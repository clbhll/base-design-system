# Base alpha component slice design

## Context

The Base package now has a verified framework-independent package foundation and semantic light/dark foundations, but it does not yet export a React component. CLB-694 and CLB-695 define the first public component slice. CLB-716 and CLB-717 then turn that slice into a reviewable, independently installable artifact; CLB-705 publishes it; supported consumers validate the release afterward.

This design is authoritative for that alpha sequence. `DESIGN.md` remains authoritative for system boundaries and conflict resolution. The Linear issues remain authoritative for delivery scope, estimates, dependency history, and completion state.

## Goals

- Publish the proven universal action, input, progress, and icon patterns without product assumptions.
- Establish a small public component API that preserves native props, native semantics, and ref forwarding.
- Keep all styling framework-independent, token-driven, opt-in, and free of global selectors.
- Make the first public alpha reviewable in the canonical lab and verifiable from its packed registry artifact.
- Preserve real dependency gates while executing independent component work concurrently.

## Non-goals

- No router adapter, polymorphic `asChild` API, form library integration, validation policy, network state, loading orchestration, or product workflow.
- No indeterminate progress bar, public lifecycle/status label component, icon registry, icon size system, or speculative component abstraction.
- No Dialog, ActionMenu, Squircle, InlineCode, theme provider, advanced control, SuccessButton, or toast implementation.
- No Tailwind requirement, reset, global element styling, Next.js import, consumer alias, or product type.
- No Figma component publication in this slice. CLB-707 and CLB-709 own the canonical Figma representation.

## Delivery and branch structure

CLB-694 and CLB-695 share the semantic danger pair and package source organization, so they are not safe to begin as completely unrelated branches.

1. On the alpha integration branch, land and review a shared prelude containing this contract, the required semantic color vocabulary, and deterministic per-component CSS source assembly.
2. Fork CLB-694 and CLB-695 worktrees from the reviewed prelude commit.
3. Implement and review their component modules independently. Each branch must remain green and package-valid on its own.
4. Deliver CLB-694 first with the shared prelude. Replay only CLB-695-specific commits onto the resulting `main`, resolve the narrow public-export integration, then deliver CLB-695.
5. After both component issues land, execute CLB-716 and CLB-717 concurrently.
6. Publish through CLB-705 only after both alpha gates are merged and green.
7. Validate the published alpha in `photos.me` and `calebhill.me` concurrently. Their broad migration issues remain open if later components are still required by their acceptance criteria.

Every issue gets its own review evidence, changeset where consumer-visible behavior changes, PR, CI gate, Linear completion update, and branch/worktree cleanup. A ticket is marked Done only when all of its acceptance criteria are satisfied.

## Package source organization

The public artifact remains unchanged:

- `@calebhill/base`
- `@calebhill/base/tokens.css`
- `@calebhill/base/styles.css`

The token-only entry remains tokens only. The complete stylesheet contains tokens, foundations, and component styles.

Source CSS is split for ownership and future growth:

- `src/styles/tokens.css`
- `src/styles/styles.css` for existing foundations
- `src/styles/components/button.css`
- `src/styles/components/text-input.css`
- `src/styles/components/progress-bar.css`

`scripts/build-css.mjs` reads component files from a deterministic explicit manifest. It must not depend on filesystem enumeration order. Missing manifest files fail the build. The public output order is tokens, foundations, then component files in manifest order.

Components live under `src/components/`, with focused modules for Button/ButtonLink, TextInput, ProgressBar, and icons. `src/index.ts` is the only public JavaScript barrel. Helpers remain private unless a documented consumer use requires promotion.

## Shared semantic colors

CLB-694 requires danger colors for the destructive action variant. CLB-695 consumes the same pair for TextInput error presentation. The shared prelude therefore adds only this reusable pair:

- `--base-color-danger`
- `--base-color-danger-subtle`

The light defaults preserve the proven `photos.me` palette:

| Intent | Foreground | Subtle surface | Contrast |
| --- | --- | --- | --- |
| Danger | `#b42318` | `#fee4e2` | 5.45:1 |

The dark defaults provide restrained, accessible equivalents:

| Intent | Foreground | Subtle surface | Contrast |
| --- | --- | --- | --- |
| Danger | `#ff8a80` | `#33120f` | 7.45:1 |

The raw values are added as `--base-ref-color-*` properties and aliased by the semantic properties in both themes. Components consume only semantic properties. Warning and beta colors remain documentation-local because no reusable package component consumes them. No success token is added; the approved product convention uses accent for success where needed, and this slice has no success-state component.

## Button and ButtonLink

### Public variants and sizes

```ts
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "destructive"
  | "text"
  | "text-accent";

export type ButtonSize = "default" | "icon";
```

Both components support the same variants and sizes. Defaults are:

- `Button`: `variant="primary"`, `size="default"`, and native `type="button"`.
- `ButtonLink`: `variant="secondary"` and `size="default"`.

`ButtonProps` extends the applicable native button attributes and forwards its ref to the `<button>`. `ButtonLinkProps` extends the applicable native anchor attributes and forwards its ref to the `<a>`.

The `size="icon"` branch requires a non-optional `aria-label` in TypeScript for both components. Default-size controls may still receive any applicable accessible-name attribute. This is a compile-time boundary backed by runtime accessibility tests; Base does not attempt to inspect children.

`ButtonLink` deliberately has no disabled prop or promoted `aria-disabled` contract because anchors have no native disabled behavior. Consumers must use a button for an unavailable action or omit a destination that is not available. Base will not make a link look disabled while leaving ambiguous navigation semantics.

### Anatomy and behavior

- Both render one native operative element with consumer children unchanged.
- Consumer `className`, event handlers, data attributes, and applicable native props are preserved.
- Button disabled behavior uses the native `disabled` attribute, retains a visible disabled presentation, receives no hover or active feedback, and does not invoke click handlers.
- Focus uses the published focus-ring contract in both themes.
- Fine-pointer hover is guarded by the existing hover-capability media query.
- Active feedback composes the existing Base press contract. Reduced motion removes spatial scale and preserves non-spatial feedback.
- Variants consume the existing surface, border, text, accent, disabled, and new danger semantic colors.
- The component does not expose internal class-composition helpers as public API.

## Icons

The alpha icon set contains only `MoreIcon` and `TrashIcon`, the two proven general-purpose icons used by `photos.me`.

- Each accepts `SVGProps<SVGSVGElement>`.
- Each defaults to a 24 by 24 view box and inherits `currentColor`.
- Each is `aria-hidden="true"` and `focusable="false"` by default; standard props may override defaults when a deliberate standalone SVG accessible name is supplied.
- Icon-only controls receive their name from Button/ButtonLink, not from a decorative SVG.
- Source comments and package documentation link to Iconic and its free license.

Iconic's official Free License permits use and modification without required attribution. The package will still preserve source attribution in code and documentation: <https://iconic.app/iconic-free-license/>.

## TextInput

`TextInputProps` extends `InputHTMLAttributes<HTMLInputElement>` and adds `error?: string`. The component forwards its ref to the native `<input>`.

- Consumer `className` applies to the input.
- The component wrapper exists only to associate and render the error message; no wrapper customization prop is added.
- When `error` is present, the input receives `aria-invalid="true"`, the message renders with `role="alert"`, and its generated ID is appended to any consumer-provided `aria-describedby` value.
- When there is no error, Base does not add `aria-invalid`, an error node, or a generated description reference.
- Native input attributes, events, name, type, autocomplete, required, and disabled behavior pass through unchanged.
- Base owns presentation, error association, focus, and disabled styling. It does not decide when a value is valid or submit forms.

## ProgressBar

ProgressBar is determinate only. Its value contract is 0 through 100.

- Finite values are clamped into the inclusive range.
- `NaN`, positive infinity, and negative infinity normalize to 0.
- The operative element has `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and the normalized `aria-valuenow`.
- The visual fill uses a transform based on the normalized value and never affects layout.
- Reduced motion removes the fill transition.
- Applicable native div attributes and a forwarded ref are supported; children and conflicting ARIA value attributes are owned by Base and omitted from the public prop surface.

The type requires one accessible-name route:

- `label: string`, mapped to `aria-label`; or
- a consumer-provided `aria-label`; or
- a consumer-provided `aria-labelledby`.

The three forms are mutually exclusive in the public TypeScript union. `aria-valuetext` remains available for consumers that need a formatted value announcement.

## Styling and public DOM contract

Every component accepts `className` for consumer composition but renders stable package-owned classes prefixed with `base-`. Variant and size style hooks use explicit package-owned classes rather than product names or Tailwind output. Those class names, rendered native element, public props, and exported types are compatibility-sensitive API.

No component emits global styles, margins that assume page layout, application width constraints, or product copy. Component CSS may use fixed dimensions that are intrinsic to the approved control anatomy; reusable theme choices must remain semantic custom properties.

This slice requires no React animation runtime. CSS interaction behavior composes the existing Base foundations, so `@calebhill/animations` is not added as a runtime dependency yet.

## Testing and accessibility

Behavior work follows test-driven development: the relevant test must fail for the missing behavior before production code is written.

CLB-694 coverage includes:

- exact public runtime and type exports;
- native prop/ref forwarding and default button type;
- every variant and size;
- compile-time rejection of unnamed icon controls;
- native disabled behavior and absence of enabled press feedback;
- icon SVG props, current-color behavior, default decorative semantics, and source/license documentation;
- automated accessibility checks for representative compositions.

CLB-695 coverage includes:

- TextInput ref/native props, error rendering, `aria-invalid`, and `aria-describedby` composition;
- ProgressBar normalization, accessible-name type branches, ARIA values, native props, and ref;
- light/dark token presence and contrast contracts;
- automated accessibility checks for every meaningful state.

CSS contract tests parse selectors and declarations. They prevent global selectors, Tailwind directives, product variables, unexplained product names, and forbidden imports. Public API tests assert the exact supported export surface so accidental helpers cannot escape.

## Lab and temporary Figma divergence

The component PRs identify their lab impact but do not duplicate or concurrently edit the canonical lab. CLB-716 immediately follows both component merges and must:

- import only public production exports and `@calebhill/base/styles.css`;
- show every component, variant, meaningful state, focus treatment, disabled/error case, and both themes;
- include keyboard, reduced-motion, and concise usage/accessibility guidance;
- keep component markup inside production components rather than copied lab implementations;
- receive visual review at normal width, narrow width, 200 percent zoom, light/dark themes, keyboard focus, and reduced motion.

CLB-716 also owns a documentation-only `StatusTag` used to label component lifecycle in the front-facing docs. It lives under `lab/src/`, is not exported from `@calebhill/base`, is excluded from the npm artifact, and uses lab-local warning/beta colors plus existing Base accent/danger colors. Its visible text communicates lifecycle meaning without relying on color. If an application later demonstrates a universal need for this API, promotion requires a new Base issue and public-contract review.

Until CLB-716 lands, the missing canonical specimens are an explicit temporary divergence owned by CLB-716 and recorded on CLB-694/695 in Linear. No package publication may occur during that divergence.

The canonical Figma library does not yet exist. CLB-707 and CLB-709 own representation of the approved anatomy, variants, states, variables, and accessibility annotations. The code-first alpha divergence is explicit and does not block CLB-705, but those Figma issues must reconcile against this contract rather than infer a different API.

## Packed artifact gate

CLB-717 extends the existing real-tarball Vite fixture and package contracts after both component issues land.

- The fixture imports every consumable alpha runtime component/type path through documented public exports and imports the complete public stylesheet. It does not import the documentation-only StatusTag.
- It renders representative alpha components without aliases, Tailwind, Next.js, Vercel modules, or source imports.
- The packed artifact's runtime exports, declarations, CSS entries, side-effect declaration, and exact file list are asserted.
- Forbidden dependencies and product strings fail CI.
- The fixture typechecks and builds from the installed tarball.

CLB-716 and CLB-717 are independent after CLB-694/695 and may execute concurrently. Both block publication.

## Changesets, publication, and consumers

CLB-694 and CLB-695 each add a minor changeset describing their consumer-visible public API. CLB-695's changeset names only TextInput and ProgressBar. The documentation-only StatusTag is not release-note material for package consumers. The existing foundation changeset remains. CLB-705 owns prerelease mode, the exact first alpha version, the `next` dist-tag, trusted OIDC publication, provenance, rollback documentation, and registry verification. Published versions are never overwritten.

CLB-705 must verify the registry package by installing the exact published version into clean Vite and Next.js fixtures, checking exports/types/CSS/file list/provenance, and exercising the canonical lab build against the release candidate state.

After publication, `photos.me` and `calebhill.me` may adopt the available alpha surface concurrently in isolated worktrees. Each migration:

- installs an exact prerelease version for initial validation;
- replaces only duplicate universal implementations available in that release;
- preserves product wrappers, routing, validation policy, layouts, and workflows;
- runs the consumer's full required verification and visual review;
- records incompatibilities as Base follow-ups rather than product-local forks.

CLB-706 and CLB-708 describe broader catalog migrations than this alpha contains. They must remain open, or use estimated alpha-adoption sub-issues, until every acceptance criterion is satisfied. Initial alpha adoption is progress, not permission to mark an incomplete migration Done.

## Required delivery sequence

```text
shared alpha prelude
  -> CLB-694 + CLB-695 component implementation
  -> CLB-694 merge, then CLB-695 replay and merge
  -> CLB-716 + CLB-717
  -> CLB-705 public alpha
  -> concurrent consumer alpha adoption
```

At each merge boundary, run `pnpm verify` and `pnpm tsc --noEmit`, require green CI, update the owning Linear issue, fast-forward the clean root `main`, and remove only the delivered branch/worktree. Publication starts only from a clean merged commit after all alpha gates pass.
