# Base Design System Alpha

**Status:** Approved for implementation
**Date:** 2026-08-14
**Linear project:** `base-design-system`
**Package:** `@calebhill/base`

## Context

Caleb's web products contain reusable interface foundations, but those foundations currently live inside product repositories and have begun to diverge. `photos-me` has the strongest component-oriented tokens and the cleanest small primitives. `calebhill.me` has the more mature light/dark theme model and editorial typography. The standalone `@calebhill/animations` package is the canonical lower-level motion dependency.

The first delivery must prove the package boundary with a small, coherent vertical slice. It must not wait for the complete v1 component catalog.

## Goals

- Publish an installable `@calebhill/base@0.1.0-alpha.0` prerelease under the npm `next` tag.
- Establish a framework-agnostic React and TypeScript package with explicit public exports.
- Ship package-owned light and dark semantic CSS themes without requiring Tailwind in consumers.
- Migrate Button, ButtonLink, TextInput, ProgressBar, StatusTag, and only the icons those components need.
- Prove the packed artifact in an independent React fixture and a package-owned component lab.
- Establish CI, accessibility checks, versioning, trusted npm publishing, provenance, and a documented rollback path.
- Make the alpha foundation extensible enough for the remaining v1 migrations without pre-designing their APIs.

## Non-goals

- The alpha will not ship Dialog, ActionMenu, Squircle, InlineCode, ThemeProvider, ThemeToggle, Slider, Switch, SegmentedControl, ValueReadout, SuccessButton, or Toast/Snackbar.
- The alpha will not ship a CSS reset, global `body` styles, product shells, routing, storage, authentication, upload/media behavior, or application state.
- The alpha will not publish the Figma library or migrate either consumer to the registry package.
- The package will not expose a polymorphic `as` API, per-component stylesheet entry points, CommonJS output, or internal source paths.

## Package architecture

The repository remains a single package. A separate Vite component lab lives inside the repository but is excluded from the npm artifact.

```text
base-design-system/
├── src/
│   ├── components/
│   ├── icons/
│   ├── styles/
│   │   ├── tokens.css
│   │   └── styles.css
│   └── index.ts
├── lab/
├── test/
├── .changeset/
├── .github/workflows/
└── package.json
```

`tsup` builds ESM JavaScript and TypeScript declarations. Plain CSS is authored as package source. The CSS build copies `tokens.css` to `dist/tokens.css` and deterministically concatenates the token and component sheets into `dist/styles.css`. Tailwind may be used in the lab, but no public component implementation or published stylesheet may depend on consumer Tailwind configuration.

The public export contract is:

```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./tokens.css": "./dist/tokens.css",
  "./styles.css": "./dist/styles.css"
}
```

The package publishes only `dist`, `README.md`, `LICENSE`, and package metadata. CSS files are declared as side effects; JavaScript remains tree-shakeable. React and React DOM are peer dependencies. The package is ESM-only and targets modern Vite and Next.js consumers.

## CSS and theme contract

Public custom properties use a package prefix such as `--base-color-text-primary`. Component selectors use a stable `base-` class prefix. Consumers may override semantic properties through the normal cascade.

`tokens.css` contains:

- Primitive color, spacing, radius, typography, easing, and duration values.
- Semantic light-theme aliases on `:root` and `[data-base-theme="light"]`.
- Semantic dark-theme aliases on `[data-base-theme="dark"]`.
- Reduced-motion and fine-pointer media-query primitives.

`styles.css` contains the complete token contract followed by component styles, so consumers need only one CSS import. It does not set page background, base font, margins, box sizing, or other reset behavior.

The alpha uses the component-oriented typography roles from `photos-me` for controls and status UI. Editorial typography remains consumer-owned until a later typography review reconciles the 16px component scale with `calebhill.me`'s 17px article scale.

The React theme runtime is deferred to CLB-699. Alpha consumers select a theme by setting `data-base-theme` themselves; default tokens are light.

## Motion dependency

CLB-697 precedes package scaffolding and locks the canonical identity to `@calebhill/animations` on the public npm registry. `calebhill.me` moves off the historical `@clbhll/animations` GitHub Packages release.

The alpha components use CSS for hover, press, focus, disabled, and reduced-motion behavior. They do not force a motion runtime on consumers. `@calebhill/animations` remains the canonical source for reusable motion constants and will become a direct runtime dependency when the first exported animated component needs it. CLB-697 must also document that the current package's `framer-motion` reference is type-only and decide its long-term public type contract before animated base components ship.

This interpretation preserves CLB-691's architectural dependency without imposing an unused peer dependency on the alpha artifact.

## Component migration

The source components are references, not files to copy unchanged. Application aliases, Tailwind utility strings, product names, and consumer state are removed during extraction.

### Foundations — CLB-692

Primary sources:

- `photos-me/src/styles/globals.css`
- `photos-me/src/lib/interaction-styles.ts`
- `calebhill.me/src/styles/globals.css`

The migration retains semantic tokens, reusable type roles, fine-hover behavior, tabular numerals, focus representation, and reduced-motion behavior. It excludes site shells, canvas/upload rules, asset paths, and article layout.

### Actions — CLB-694

Primary sources:

- `photos-me/src/components/button.tsx`
- `photos-me/src/lib/button-styles.ts`
- `photos-me/src/components/icons/more-icon.tsx`
- `photos-me/src/components/icons/trash-icon.tsx`

`Button` extends native button attributes, defaults `type` to `button`, forwards its ref, and supports primary, secondary, subtle, destructive, text, and text-accent variants. The icon size requires an accessible label at the type boundary.

`ButtonLink` remains an anchor-only primitive in the alpha. Routing adapters stay consumer-owned. Icons are React SVG components that inherit `currentColor` and accept normal SVG props. Only icons used by alpha components or lab specimens ship.

### Inputs and feedback — CLB-695

Primary sources:

- `photos-me/src/components/text-input.tsx`
- `photos-me/src/lib/text-input-styles.ts`
- `photos-me/src/components/progress-bar.tsx`
- `photos-me/src/lib/progress-bar.ts`
- `photos-me/src/components/status-tag.tsx`
- `photos-me/src/lib/status-tag.ts`

`TextInput` extends native input attributes, forwards its ref, and composes consumer-provided `aria-describedby` values with package error messaging.

`ProgressBar` is determinate. Non-finite values fall back to zero and values outside the supported range are clamped. Accessible value semantics reflect the normalized result.

`StatusTag` exposes a typed status API for stable, beta, unstable, and deprecated states. The associated semantic colors are included in the alpha token contract.

## Component lab

The Vite lab imports production source through the same public entry point used by the build. It does not maintain duplicate component implementations.

For every alpha component it shows:

- Every public variant and meaningful state.
- Light and dark themes.
- Keyboard focus and disabled behavior.
- Reduced-motion behavior where relevant.
- Short usage examples and accessibility guidance.

The lab is a development and review surface, not a separately deployed product requirement for the alpha.

## Testing and package contracts

Every pull request must pass:

- `pnpm lint`
- `pnpm tsc --noEmit`
- Unit tests for pure normalization and class/variant logic.
- React interaction and ref-forwarding tests.
- Automated axe checks for stable specimens.
- The package build and declaration build.
- The component lab production build.
- A packed-tarball contract test in a minimal Vite React fixture.
- Forbidden-import checks for Next.js, Vercel, application aliases, and product modules.

The packed fixture installs the actual `pnpm pack` artifact, imports JavaScript and CSS through public exports, typechecks, and builds without Tailwind configuration. A Next.js packed fixture remains part of the broader CLB-704 work and must pass before stable release.

## Release design

Changesets owns version selection and changelog generation. GitHub Actions owns CI and npm trusted publishing with provenance. Publishing uses OIDC rather than a long-lived npm write token.

The alpha sequence is:

1. Build and pack locally in CI.
2. Validate the exact file list and public exports.
3. Merge a Changesets version pull request.
4. Publish `0.1.0-alpha.0` with the npm `next` tag.
5. Install the registry artifact into the Vite fixture and verify it again.
6. Document rollback as deprecating the broken version and publishing a corrected prerelease; published versions are never overwritten.

After the remaining catalog, Figma library, and both consumer migrations are validated, CLB-711 promotes the package to `1.0.0` under the npm `latest` tag.

## Linear delivery model

The project uses ordered milestones without target dates until the alpha establishes delivery throughput.

### 1. Package foundation

- CLB-697 — standardize `@calebhill/animations`
- CLB-691 — scaffold `@calebhill/base`

### 2. Alpha component slice

- CLB-692 — tokens, typography, and interactions
- CLB-694 — Button, ButtonLink, and icons
- CLB-695 — TextInput, ProgressBar, and StatusTag
- New two-point child issue under CLB-703 — build the alpha component lab
- New two-point child issue under CLB-704 — add alpha package contracts and Vite fixture

### 3. Public alpha

- CLB-705 — publish the trusted prerelease

### 4. Component expansion

- CLB-693, CLB-696, CLB-698, CLB-699, CLB-700, CLB-701, CLB-687

Independent component issues may proceed in parallel after CLB-692. Dependencies between composed components remain explicit; for example, SuccessButton waits for Button.

### 5. Validation and stable release

- CLB-702, CLB-709, CLB-707, CLB-710 — Figma library
- CLB-706 and CLB-708 — consumer migrations
- CLB-712 — governance and contribution workflow
- CLB-711 — publish `1.0.0`

CLB-713 remains backlog and does not block stable release.

The alpha critical path is:

```text
CLB-697 -> CLB-691 -> CLB-692 -> CLB-694 and CLB-695
        -> alpha lab and package contracts -> CLB-705
```

## Definition of done

The alpha milestone is complete when `@calebhill/base@0.1.0-alpha.0` is publicly installable from npm, carries provenance, exposes only the approved JavaScript and CSS entry points, passes the packed Vite fixture, and presents every alpha component in both themes in the package-owned lab. No consumer migration or remaining v1 component is required to declare the alpha successful.
