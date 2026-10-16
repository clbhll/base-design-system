# Base component canvas design

Status: draft for review. Not yet approved in Linear.

## Context

The lab is the canonical executable review surface for Base. CLB-703 turned it
into a documentation site: a sidebar, one hash route per component, and a
document per route composed of `DocumentHeader`, `Specimen`, `CodeSample`,
`PropsTable`, and `AccessibilityNotes`.

That structure reads like reference documentation, not like a review surface.
Comparing variants means scrolling between prose blocks, the theme control is
repeated per specimen, and nothing exposes the rendered geometry or the tokens
that produced it. Reviewing parity with Figma still requires browser devtools.

This change replaces the documentation site with a component canvas: dense,
visual bands of real components on a switchable surface, with a persistent
inspector panel that carries the component's documentation and, when enabled,
live dimensions and token annotations for any selected element.

This supersedes the CLB-703 information architecture (sidebar plus one document
per component). It keeps CLB-703's principles: executable examples rendered
through public package exports, linkable locations, static-host-safe URLs, and
keyboard accessibility. Per `DESIGN.md` section 3, the replacement must be
recorded as an approved Linear decision before implementation.

It is lab-only. It does not change the published `@calebhill/base` API, CSS,
tokens, or package artifact, so it needs no changeset and has no Figma impact.

## Goals

- Replace the sidebar and per-component documents with a tabbed canvas.
- Show every supported variant, size, and prop-driven state of a component
  side by side in labeled bands.
- Provide one global surface control instead of a theme control per specimen.
- Move status, import, props, and accessibility notes into an inspector panel
  that follows the selected component.
- Add an opt-in Information mode that selects individual rendered elements and
  shows their live box model, layout values, and the `--base-*` tokens behind
  them, with an on-canvas overlay.
- Keep every link to a component resolvable.
- Keep the canvas keyboard operable, including element selection.

## Non-goals

- No new components, variants, sizes, tokens, or package exports. The canvas
  shows what Base exports today. Reference imagery that implies a small size,
  toggle groups, segmented controls, or cards is inspiration for layout only.
- No forced interaction states. Hover, active, and focus-visible are reached by
  interacting. States that are props (for example `disabled`) render
  statically.
- No interactive prop controls, generated prop extraction, MDX, Storybook,
  search, or router dependency.
- No hosting or canonical metadata work; CLB-726 still owns that.

## Layout

```text
┌──────────────────────────────────────────────────────────┬─────────────────┐
│ [Grey|White|Black]   Foundations Actions Inputs …   Info │ Inspector       │
├──────────────────────────────────────────────────────────┤                 │
│ Band label                                               │ Component docs  │
│            ┌specimens on the selected surface┐           │ or element      │
│                                                          │ values          │
├──────────────────────────────────────────────────────────┤                 │
│ Band label                                               │                 │
│            ┌specimens┐                                   │                 │
└──────────────────────────────────────────────────────────┴─────────────────┘
```

- **Top bar:** surface control (left), category tabs (center), Information
  toggle (right).
- **Canvas:** the active category's bands, stacked and separated by hairline
  rules. Each band has a monospace label and centered specimens with generous
  whitespace.
- **Inspector:** a fixed right panel. Below roughly 900px wide it becomes a
  bottom sheet with a drag handle, and the canvas takes the full width.

## Categories and bands

Categories are top-bar tabs. The proposed initial grouping, built only from
current exports:

| Tab | Bands |
| --- | --- |
| Foundations | Color, Typography, Focus, Press, Consumer override, Icons |
| Actions | Button: default size, Button: icon size, Button: disabled, Button Link, ActionMenu |
| Inputs | Text Input |
| Feedback | Progress Bar, Toast |
| Overlays | Dialog |

A band belongs to exactly one component (or one foundation topic), so
selecting a band header is how a component is selected. Bands render real
components imported from `@calebhill/base`.

## URL model

Hash URLs stay static-host safe:

```text
#/actions                 tab, first band
#/actions/button          tab, scrolled to and selecting the Button band
```

Existing CLB-703 URLs redirect: `#/components/button` resolves to
`#/actions/button`, `#/foundations` to `#/foundations`, and so on, following
the existing redirect pattern in `routing.ts`. Unknown locations resolve to
`#/foundations`. Selecting a band updates the hash with `replaceState`, so
scrolling the canvas does not flood history; tab changes push history.

## Registry

The typed registry stays narrow and replaces `labDocuments`:

```ts
interface LabBand {
  id: string;            // URL segment, e.g. "button"
  label: string;         // band label, e.g. "Button · default size"
  componentId: string;   // inspector docs key; several bands may share one
  Specimens: ComponentType;
}

interface LabComponentDocs {
  id: string;
  title: string;
  status: "unstable" | "beta" | "stable" | "deprecated";
  importStatement: string;
  summary: string;
  props: PropRow[];
  accessibility: string[];
  example: string;
}

interface LabCategory {
  id: string;            // URL segment, e.g. "actions"
  label: string;
  bands: LabBand[];
}
```

The existing `documents/*.tsx` content is split into specimens (into bands) and
docs data (into `LabComponentDocs`). `PropsTable`, `CodeSample`,
`AccessibilityNotes`, and `StatusTag` are reused inside the inspector.

## Surface control

Grey, White, and Black are lab presentation choices, not public tokens:

| Surface | `data-base-theme` | Canvas background |
| --- | --- | --- |
| Grey | `light` | `--base-color-background-subtle` |
| White | `light` | `--base-color-background` |
| Black | `dark` | `--base-color-background` |

The control sets the attribute once on the canvas root. The lab chrome (top
bar, inspector) stays in a fixed theme so changing the surface does not move
the tool around the reviewer. The last choice persists in `localStorage`,
wrapped in try/catch.

## Inspector

### Default mode (Information off)

Specimens are fully interactive. Selecting a band (clicking its label, or
focusing it and pressing Enter) shows that component's docs in the inspector:
title, status, summary, import statement, example, props, and accessibility
notes. With no selection, the inspector shows the first band of the tab.

### Information mode (Information on)

Information mode turns the canvas into an element picker, like a devtools
inspect mode:

- A transparent capture layer sits above the specimens and intercepts pointer
  events, so clicking a Button selects it instead of activating it. Hover shows
  a light outline and tag label.
- For keyboard users, each inspectable specimen gets a focusable target in the
  capture layer in DOM order ("Inspect Primary button"). Tab moves between
  targets, Enter selects, and Escape clears the selection. The specimens
  underneath are `inert` while the mode is on, so focus never lands on a
  control that would act on Enter.
- Turning Information off removes the capture layer and restores live
  interaction. The component-docs view returns.

The inspectable element is the component's root native element (the one that
receives the forwarded ref). Children such as icons are not separate targets
in the first pass.

For the selected element, the inspector shows:

| Section | Values |
| --- | --- |
| Element | tag, accessible name, Base classes (`.base-*` only) |
| Dimensions | width, height, min-height, box-sizing (rendered px) |
| Layout | display, align-items, justify-content, gap |
| Padding | top, right, bottom, left |
| Margin | top, right, bottom, left |
| Border | width, radius, color |
| Color | text, background |
| Type | font-size, line-height, weight, letter-spacing |

Each value shows the rendered result and, when one exists, the token that
produced it:

```text
Padding right   20px   --base-ref-space-5
Background      #111   --base-color-text-primary
```

### Overlay

While an element is selected in Information mode, a lab-owned layer above the
canvas draws:

- hatched padding regions and a tinted margin region;
- the gap between flex children;
- a compact label (`Padding 0 / 20 / 0 / 20 px`, `Margin 0 px`) anchored above
  the element.

The overlay is positioned from `getBoundingClientRect` and computed padding
and margin. It is redrawn with `ResizeObserver` and on scroll, and it uses
`pointer-events: none`. It is decorative and `aria-hidden`; the inspector panel
is the accessible representation of the same values.

### Token resolution

`getComputedStyle` returns resolved values (`20px`), not the `var()` that
produced them. Token annotations therefore come from the CSSOM:

1. Walk `document.styleSheets`, which are same-origin under Vite, and collect
   rules from Base's stylesheet whose selector matches the element
   (`element.matches(rule.selectorText)`).
2. Read the declared value of each inspected property. If it is a `var(--base-*)`
   reference, record the token name and follow `var()` chains to the semantic
   or reference token.
3. Resolve competing declarations by specificity and source order. Ignore
   pseudo-class rules (`:hover`, `:active`, `:focus-visible`) unless the
   element currently matches them.

This is a deliberate approximation of the cascade, not a reimplementation of
it. When the resolver cannot attribute a value, the inspector shows the
rendered value with no token rather than guessing. The resolver is a pure
function of (element, rule list), so it can be unit tested without a browser
layout engine.

A useful side effect: the annotations make raw `--base-ref-*` use and
unexplained literal values visible, which supports the `DESIGN.md` section 4
rule that components consume semantic tokens.

## Overlay components on the canvas

Dialog, ActionMenu, and Toast appear twice:

- **Trigger specimen:** a button that opens the real portal-rendered component
  exactly as consumers use it.
- **Static specimen:** the open surface rendered inside the band so it can be
  compared and inspected.

Toast's static specimen is straightforward: `Toast` is exported as a plain
component. Dialog and ActionMenu already accept `portalContainer`, but both are
modal Radix surfaces. A permanently open instance would trap focus, lock
scroll, and make the rest of the canvas inert.

Recommended approach: render each static modal specimen in a same-origin
`<iframe>` that loads a lab-only frame route (`#/frame/dialog`) with the same
stylesheet and surface attribute. Modal behavior stays contained in the frame.
The inspector and overlay can reach into a same-origin frame document, so
Information mode still works. The alternative, a visual replica of the open
surface, is rejected because it would stop rendering the production
component.

## Accessibility

- The skip link is retained and targets the canvas.
- Category tabs use the ARIA tabs pattern (`tablist`, `tab`, `tabpanel`,
  arrow-key movement, roving tabindex).
- The surface control and the Information toggle are `aria-pressed` button
  groups, matching the existing `ThemeControl`.
- Band labels are headings, so screen-reader heading navigation lists bands.
- Inspector updates are not announced on every hover. A selection change
  updates a polite live region with the element name.
- Focus visibility is verified on all three surfaces. Lab chrome must not
  override package focus styles on specimens.
- The overlay respects reduced motion (no animated transitions between
  selections).

## Testing

Behavior changes start with failing tests in the existing lab test files:

- `lab-routing.test.tsx`: tab and band resolution, redirects from every
  CLB-703 URL, unknown-path fallback, `replaceState` versus push behavior.
- `lab-documents.test.tsx` (renamed or replaced): every public export appears
  in at least one band; every band's `componentId` has docs; every docs entry
  has props and accessibility notes.
- New `lab-inspector.test.tsx`: band selection shows docs; Information mode
  makes specimens inert; keyboard selection through capture targets; Escape
  clears; turning the mode off restores interaction.
- New unit tests for the token resolver against fixture rule lists, including
  `var()` chains, specificity ties, and unmatched pseudo-classes.
- `vitest-axe` on each tab, with Information mode both off and on.

Visual review of all tabs on all three surfaces happens in `pnpm lab:dev`.
`pnpm verify` and `pnpm tsc --noEmit` gate each phase.

## Delivery phases

Each phase is a separate PR that leaves the lab shippable.

1. **Canvas shell.** Top bar, tabs, surface control, bands, registry split,
   inspector with component docs, URL redirects. Remove the sidebar and
   per-component documents. This reaches content parity with CLB-703.
2. **Information mode.** Capture layer, keyboard picking, computed values in
   the inspector, overlay.
3. **Token annotations.** CSSOM resolver and token column.
4. **Static overlays.** Frame route and iframe static specimens for Dialog and
   ActionMenu, plus the static Toast specimen.

## Open questions

- Does Black always mean the dark theme, or should the light theme on a black
  canvas also be reviewable?
- Should Information mode ship in the production `lab:build` (the public site)
  or be dev-only like the Agentation tool? This spec assumes it ships, off by
  default.
- Is the proposed tab grouping right? Inputs and Overlays each hold one
  component today.
- Should the inspector's chrome theme follow the surface or stay fixed?
- Does the Agentation dev tool still need to be present on the canvas, and does
  its UI conflict with the Information-mode capture layer?
