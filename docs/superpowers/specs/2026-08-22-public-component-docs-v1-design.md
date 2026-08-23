# Public Base Component Documentation V1

## Context

The existing Vite lab is the canonical executable review surface for Base, but it presents foundations and every component in one long two-theme page. That works for package validation and visual review, but it does not give package consumers a durable way to find, link to, or understand an individual public component.

CLB-703 turns that lab into the first public-facing Base documentation surface. This is an information-architecture and documentation-tooling change. It does not change the published `@calebhill/base` API, CSS, tokens, or package artifact.

## Goals

- Provide persistent navigation for the current public component catalog.
- Give every current public component a linkable canonical document.
- Keep examples executable by rendering production components through documented package exports.
- Show supported variants, states, themes, public props, lifecycle status, and accessibility behavior.
- Preserve the existing lab's role as an executable source of truth for component states.
- Make adding the next component a small, additive change rather than another app-shell refactor.
- Keep the site responsive, keyboard accessible, and independent of a specific hosting provider.

## Non-goals

- Base will not prescribe when a consumer should use a component or how a product should compose it. Product-level usage guidance remains consumer-owned.
- V1 will not add MDX, Storybook, generated prop extraction, a router dependency, search, interactive prop controls, copy-to-clipboard controls, or full-text indexing.
- V1 will not deploy or configure `base.calebhill.me`; CLB-726 owns production hosting and canonical metadata.
- V1 will not change package exports, component behavior, Figma specifications, or product consumers.
- V1 will not add a Changeset because the documentation lab is excluded from the npm artifact.

## Architecture decision

V1 will use a typed, hand-authored documentation registry inside the existing React and Vite lab.

This approach is preferred over MDX because the initial catalog is small, every specimen needs real React composition, and V1 does not need a second content compilation pipeline. It is preferred over customizing Storybook because the goal is a Base-owned public experience rather than a themed version of Storybook's navigation, URL model, and addon architecture.

The registry is intentionally narrow. It coordinates navigation and document selection; it does not become a generic content-management framework. If repeated prose-heavy authoring later makes MDX valuable, document components can move behind the same registry contract without changing the shell or URLs.

## Information architecture

The lab has two navigation groups:

- **Foundations** — one document preserving the current semantic color, typography, link, focus, press, and consumer-override specimens.
- **Components** — Button, Button Link, Text Input, Progress Bar, and Icons.

Button Link receives its own document because it has a distinct native element and public prop contract. MoreIcon and TrashIcon share an Icons document because the current icon catalog is too small to justify one page per glyph.

The first valid document is Foundations. An empty or unrecognized location resolves to Foundations so the app always has meaningful content. Navigation labels use consumer-facing component names rather than implementation filenames.

## URL and navigation model

Documents use static-host-safe hash URLs:

```text
#/foundations
#/components/button
#/components/button-link
#/components/text-input
#/components/progress-bar
#/components/icons
```

Navigation uses real anchors. Selecting an anchor updates the hash and swaps the document without a full page reload. Browser back and forward navigation update the selected document. The active link exposes `aria-current="page"`.

A small lab-local hash-location hook owns parsing and subscription. It normalizes missing, malformed, and unknown hashes to `#/foundations` with `history.replaceState`, avoiding an extra browser history entry. No router package is added in V1.

Hash URLs are a deliberate V1 tradeoff: they work from any static host without rewrite configuration. CLB-726 may move to clean path URLs only when the production host owns a tested fallback and redirect contract.

## Documentation registry

The registry owns only stable navigation metadata and the React document entrypoint:

```ts
type LabDocumentGroup = "foundations" | "components";

interface LabDocumentDefinition {
  slug: string;
  label: string;
  group: LabDocumentGroup;
  render: () => ReactNode;
}
```

Slugs are unique and include their group in the final URL. A registry lookup resolves location to one document definition. Navigation and document rendering read from the same registry so an item cannot appear in only one of them.

Each document lives in its own focused module under `lab/src/documents/`. Shared documentation-only presentation belongs under `lab/src/components/`. None of those modules are exported from `src/index.ts`, copied into public CSS, or included in the npm artifact.

Expected structure:

```text
lab/src/
├── app.tsx
├── component-registry.tsx
├── routing.ts
├── components/
│   ├── code-sample.tsx
│   ├── document-header.tsx
│   ├── props-table.tsx
│   ├── specimen.tsx
│   ├── status-tag.tsx
│   └── theme-control.tsx
└── documents/
    ├── foundations.tsx
    ├── button.tsx
    ├── button-link.tsx
    ├── text-input.tsx
    ├── progress-bar.tsx
    └── icons.tsx
```

The final implementation may combine a very small presentation helper with its only caller, but it must preserve the registry, routing, shell, and per-document boundaries.

## Document content contract

Every component document contains:

1. Component name, package import path, and lifecycle status.
2. A concise statement of the public primitive's behavior, without product-level usage advice.
3. Live production specimens covering public variants and meaningful supported states.
4. A light/dark control that changes the specimen surface.
5. A code example matching a rendered, type-checked specimen.
6. A compact public-props table describing Base-owned props and notable native-prop behavior.
7. Accessibility behavior owned by the component, such as native semantics, accessible-name requirements, error association, progress ARIA values, keyboard behavior, and reduced motion.

Documentation must distinguish component guarantees from consumer responsibilities. For example, Button documents its native button semantics and disabled behavior; it does not recommend which product actions should be primary. TextInput documents its error association; it does not define consumer validation policy.

Foundations uses the same overall document anatomy where it applies, but it has no props table or lifecycle tag. It preserves the current light/dark tokens and scoped consumer override proof.

## Live examples and code

All consumable elements import from `@calebhill/base` and the lab imports `@calebhill/base/styles.css`. The Vite aliases continue to point those public paths to package source during local development.

Specimen JSX is the executable source. Displayed code is a concise consumer example adjacent to that specimen, not copied component implementation markup. Contract tests assert that the document modules contain no relative production-source imports, product imports, Next.js, Vercel, or Tailwind dependencies.

V1 does not add live prop controls. Fixed examples communicate the supported contract more clearly for the small alpha catalog and keep accessibility checks deterministic.

## Shell and visual direction

At desktop widths, the app uses a full-height two-column shell:

- A quiet, sticky left rail contains the Base wordmark, package version context, grouped document navigation, and a repository link.
- The right side is a generous reading column with a restrained maximum width.
- Specimens sit on an explicit preview surface rather than appearing as ordinary page content.

The site uses Base's own semantic tokens and type roles so the documentation surface is also a realistic consumer. Documentation layout CSS remains lab-local and uses `lab-` class names. The single signature element is the specimen surface: a precise, theme-switchable workbench that makes component state the visual focus. Decorative gradients, dashboard cards, and unrelated marketing treatments are excluded.

At narrow widths, the shell becomes one column and navigation moves above the document as a wrapping list. This keeps every destination visible without adding a JavaScript drawer in V1. No fixed width may block 200 percent zoom or create horizontal page overflow.

## Theme state

Each document owns one theme selection for its live specimens. The control uses a labelled two-option group for Light and Dark. The selected theme applies `data-base-theme` to the preview surface; documentation chrome remains readable independently.

Theme selection is presentation state, not part of the document URL in V1. Changing documents resets the specimen to light so each document has a predictable initial state. Both themes remain covered by automated and manual review.

## Accessibility

- A skip link moves focus directly to the selected document.
- The sidebar is a labelled `nav`; grouped items use headings and lists.
- Navigation destinations are anchors with visible focus and `aria-current` on the active page.
- The selected document renders in a stable `main` landmark with a single page heading.
- Hash changes update the document without forcing focus. The page title updates to include the selected component so browser and assistive-technology context remains accurate.
- Theme controls have a visible label, pressed or selected state, and keyboard-operable native controls.
- Props tables use real table semantics and remain horizontally scrollable inside their own container at narrow widths.
- Live examples preserve every accessible-name and state requirement already enforced by component tests.
- Reduced-motion preferences remove or soften lab transitions; no essential state depends on motion.

## Error handling and drift prevention

- Unknown or malformed hashes normalize to Foundations.
- Duplicate registry slugs fail a contract test.
- Every registry entry must render a document with one heading.
- Tests assert the exact current navigation inventory so newly exported components require an explicit lab update.
- Package-boundary tests continue to ensure lab-only components, status colors, and documentation CSS do not enter runtime exports, public CSS, metadata, or the tarball.
- The registry and props tables are hand-authored in V1. Public component changes must update their owning tests and corresponding document in the same issue, as required by `DESIGN.md`.

## Testing and verification

Behavior changes begin with failing tests for:

- the exact Foundations and Components navigation inventory;
- default, selected, unknown, back, and forward hash behavior;
- `aria-current`, landmarks, skip link, and one visible document at a time;
- theme-control behavior and the selected preview theme;
- representative live specimens and lifecycle labels;
- document API sections and accessibility notes;
- registry uniqueness and public-import boundaries;
- representative axe coverage;
- responsive CSS contracts and protection against fixed page widths.

Existing foundation, component, package, CSS, tarball, and clean-consumer contracts remain green. Before delivery, run:

```sh
pnpm verify
pnpm tsc --noEmit
git diff --check
```

Manual review covers desktop and narrow layouts, 200 percent zoom, keyboard traversal, light and dark specimens, browser back and forward, visible focus, and reduced motion.

## Delivery boundaries

CLB-703 owns this V1 shell, registry, current documents, tests, and lab-local styling. It does not own production deployment, domain configuration, or canonical metadata; CLB-726 follows after this documentation surface is merged.

The work ships from an isolated `chill/` branch. After the simplification pass, verification, pull request, and green checks, CLB-703 is marked Done and the branch and worktree are removed according to the repository workflow.
