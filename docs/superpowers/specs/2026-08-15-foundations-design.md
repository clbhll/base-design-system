# Base Foundations Design

**Issue:** CLB-692
**Status:** Approved for implementation planning
**Package:** `@calebhill/base`

## Purpose

Base needs a portable visual foundation before components can be extracted. This slice reconciles the reusable token, typography, link, and interaction rules in `photos.me` and `calebhill.me` without importing either product's layout or application conventions.

The result is an opt-in CSS foundation. It works in plain React applications without Tailwind, supports light and dark themes through normal CSS cascade, and gives later Base components stable semantic values to consume.

## Source decisions

The approved alpha design and root `DESIGN.md` remain authoritative. This design narrows their CLB-692 decisions into an implementable vocabulary.

- `photos.me/src/styles/globals.css` supplies the light palette and component-oriented typography scale.
- `photos.me/src/lib/interaction-styles.ts` supplies the press feedback model: scale for normal motion and opacity for reduced motion.
- `calebhill.me/src/styles/globals.css` supplies the dark palette, inline-code aliases, monospace stack, and dotted-link treatment.
- `@calebhill/animations` remains the sole owner of shared JavaScript easing, spring, entrance, and reduced-motion primitives.

CalebHill's responsive editorial body treatment remains consumer-owned. Photo canvas, upload, safe-area, page shell, asset-mask, changelog, syntax-highlighting, and theme-crossfade rules are excluded.

## Architecture

The package retains the two existing public CSS entry points:

- `@calebhill/base/tokens.css` contains reference scales, semantic themes, and reduced-motion token overrides.
- `@calebhill/base/styles.css` contains the complete token sheet followed by opt-in `.base-*` foundation classes.

There are no global element selectors, reset rules, `body` styles, Tailwind directives, or runtime theme changes. Consumers select a theme with `data-base-theme="light" | "dark"` or override the semantic custom properties in their own selector.

Reference tokens use the internal `--base-ref-*` namespace. They make raw scales explicit but are not the supported consumer customization layer. Public semantic properties use `--base-*` names and are the stable override contract.

## Reference token vocabulary

The reference layer contains only values required by this slice or the immediately dependent alpha components.

### Typography

- Sizes: `--base-ref-font-size-200`, `300`, `350`, `400`, `450`, `500`, `600`, `700`
- Line heights: `--base-ref-line-height-200`, `250`, `300`, `350`, `400`, `500`, `800`
- Weights: `--base-ref-font-weight-regular`, `medium`, `semibold`
- Tracking: `--base-ref-letter-spacing-tight`, `compact`, `normal`, `wider`

These values preserve the `photos.me` component scale: 12, 14, 15, 16, 17, 20, 24, and 30 pixels at a 16-pixel root.

| Scale | Values in ascending key order |
| --- | --- |
| Font size | `0.75rem`, `0.875rem`, `0.9375rem`, `1rem`, `1.0625rem`, `1.25rem`, `1.5rem`, `1.875rem` |
| Line height | `1.125rem`, `1.1875rem`, `1.25rem`, `1.5rem`, `1.5rem`, `1.8125rem`, `2.25rem` |
| Font weight | `400`, `500`, `600` |
| Letter spacing | `-0.03em`, `-0.31px`, `0`, `0.02em` |

The semantic family properties are `--base-font-family-sans` and `--base-font-family-mono`. Their defaults are portable system stacks; consumers may override them without changing the reference type scale.

### Color

Raw colors use ordered reference names and do not encode component intent:

- Neutral: `--base-ref-color-neutral-0`, `50`, `100`, `150`, `180`, `200`, `250`, `300`, `350`, `400`, `450`, `500`, `550`, `600`, `700`, `750`, `800`, `900`, `1000`
- Blue: `--base-ref-color-blue-50`, `100`, `200`, `400`, `500`, `600`, `800`, `950`

Neutral values in key order are `#ffffff`, `#f9f9f9`, `#f5f5f5`, `#f2f2f2`, `#ededed`, `#ebebeb`, `#e5e5e5`, `#cccccc`, `#bbbbbb`, `#a0a0a0`, `#999999`, `#666666`, `#555555`, `#444444`, `#2a2a2a`, `#222222`, `#1a1a1a`, `#111111`, and `#0a0a0a`.

Blue values in key order are `#e6eeff`, `#8cc1ff`, `#6aa3ff`, `#4d90fe`, `#0055ff`, `#0044cc`, `#003399`, and `#0d1a33`.

### Layout and shape

- Spacing: `--base-ref-space-1` through `--base-ref-space-6`, representing 4, 8, 12, 16, 20, and 24 pixels.
- Radius: `--base-ref-radius-sm`, `md`, and `lg`, representing 6, 12, and 16 pixels.

### Interaction timing

- Durations: `--base-ref-duration-fast` at 150 milliseconds and `--base-ref-duration-standard` at 220 milliseconds.

The semantic interaction properties are `--base-duration-interaction-fast`, `--base-duration-interaction-standard`, `--base-interaction-press-scale`, and `--base-interaction-press-opacity-reduced`. Their defaults are the corresponding reference durations, `0.97`, and `0.8`.

Base does not publish a second named copy of the weighted easing curve or press spring from `@calebhill/animations`. CSS-only state transitions use the platform `ease-out` keyword. Animated React components must import shared motion primitives from `@calebhill/animations` when they need the canonical curve or spring.

## Semantic theme vocabulary

Light values originate in `photos.me`; dark values originate in `calebhill.me`. Semantic properties are declared on `:root` and `[data-base-theme="light"]`, with dark overrides on `[data-base-theme="dark"]`.

| Semantic property suffix | Light reference | Dark reference |
| --- | --- | --- |
| `background` | neutral 0 | neutral 1000 |
| `background-subtle` | neutral 50 | neutral 800 |
| `text-primary` | neutral 900 | neutral 180 |
| `text-secondary` | neutral 550 | neutral 400 |
| `text-tertiary` | neutral 450 | neutral 500 |
| `text-disabled` | neutral 350 | neutral 600 |
| `accent` | blue 500 | blue 400 |
| `accent-hover` | blue 600 | blue 200 |
| `accent-active` | blue 800 | blue 100 |
| `accent-subtle` | blue 50 | blue 950 |
| `on-accent` | neutral 0 | neutral 1000 |
| `surface` | neutral 0 | neutral 800 |
| `surface-hover` | neutral 100 | neutral 750 |
| `surface-active` | neutral 200 | neutral 700 |
| `surface-disabled` | neutral 150 | neutral 900 |
| `border` | neutral 250 | neutral 700 |
| `border-hover` | neutral 300 | neutral 600 |
| `border-focus` | blue 500 | blue 400 |
| `border-active` | neutral 900 | neutral 180 |
| `focus-ring` | blue 500 | blue 400 |

### Background and text

- `--base-color-background`
- `--base-color-background-subtle`
- `--base-color-text-primary`
- `--base-color-text-secondary`
- `--base-color-text-tertiary`
- `--base-color-text-disabled`

### Accent

- `--base-color-accent`
- `--base-color-accent-hover`
- `--base-color-accent-active`
- `--base-color-accent-subtle`
- `--base-color-on-accent`

The light accent is `#0055ff`. The dark accent is `#4d90fe`. `calebhill.me` may retain its light `#0082f6` accent through a consumer override rather than introducing a second Base theme.

### Surfaces and borders

- `--base-color-surface`
- `--base-color-surface-hover`
- `--base-color-surface-active`
- `--base-color-surface-disabled`
- `--base-color-border`
- `--base-color-border-hover`
- `--base-color-border-focus`
- `--base-color-border-active`
- `--base-color-focus-ring`

### Inline code

- `--base-color-code-surface`
- `--base-color-code-border`

The inline-code properties alias the theme's subtle background and standard border by default. They remain separate semantic properties so a consumer can diverge inline code without redefining all surfaces.

Status colors are not added in this issue. CLB-695 will introduce only the semantic colors required by the approved `StatusTag` states, preventing speculative token growth.

## Typography classes

The complete stylesheet exports these opt-in classes:

- `.base-type-display`
- `.base-type-heading-lg`
- `.base-type-heading-md`
- `.base-type-heading-sm`
- `.base-type-action`
- `.base-type-input`
- `.base-type-body-lg`
- `.base-type-body`
- `.base-type-body-sm`
- `.base-type-caption`
- `.base-type-mono`

Each class sets only font family when the role requires it, size, line height, weight, and letter spacing. It does not set margins, color, width, wrapping, or layout. The action and input roles retain the 15-pixel medium-weight treatment from `photos.me`; the body role remains the stable 14-pixel component role rather than adopting CalebHill's responsive editorial rule.

## Link and numeric classes

- `.base-link` is the standard dotted-underline link using primary text and a `currentColor` decoration, then secondary text on fine-pointer hover.
- `.base-link-muted` starts at secondary text with a `currentColor` decoration and lifts to primary text on fine-pointer hover.
- `.base-tabular-nums` applies `font-variant-numeric: tabular-nums`.

Both link classes include the Base focus ring on `:focus-visible`. Hover changes are guarded by `@media (hover: hover) and (pointer: fine)` so coarse pointers do not receive sticky hover styling.

## Interaction classes

- `.base-focus-ring` applies a two-pixel semantic outline with a two-pixel offset only on `:focus-visible`.
- `.base-pressable` transitions color, background, border, opacity, transform, and scale over the fast duration. Its enabled active state scales to `0.97`.

Native `:disabled` and `[aria-disabled="true"]` states are excluded from every Base active-feedback rule. Base does not reset their scale or opacity, so component-owned disabled presentation remains intact. Base also does not set `pointer-events: none` on ARIA-disabled elements because they may need to remain focusable for accessible explanation.

Under `prefers-reduced-motion: reduce`, semantic interaction durations become `0ms`, press scale is removed, and the enabled active state uses `opacity: 0.8` as non-spatial feedback. Essential focus and state signals remain visible.

Future components may compose these classes internally, but each component still owns its semantic hover, disabled, loading, error, and success presentation.

## Accessibility and consumer overrides

The light and dark focus-ring defaults must remain visible against their corresponding surfaces. Link meaning is communicated with a `currentColor` underline rather than color alone. Across background, subtle, surface, surface-hover, surface-active, surface-disabled, and accent-subtle defaults, resting standard link text and decoration have minimum contrast ratios of 15.84:1 in light and 12.26:1 in dark; muted link text and decoration have minimum ratios of 6.25:1 in light and 5.49:1 in dark. Reduced motion retains state feedback without movement.

Consumers may override semantic properties at `:root`, a theme selector, or a subtree. Foundation classes must continue to resolve those overrides at use time. Consumers should not override `--base-ref-*` values to theme the package; they should override semantic properties or their own local class composition.

No foundation class changes native semantics, tab order, accessible names, disabled attributes, or keyboard behavior.

## Lab and documentation

The canonical lab will show light and dark panels side by side with:

- the semantic color groups;
- every typography role;
- standard and muted links in rest, hover-capable, and keyboard-focus contexts;
- tabular numerals;
- focus-ring and pressable examples;
- an inline-code token sample;
- a consumer override scoped to one subtree.

README documents both stylesheet entry points, theme selection, semantic overrides, and the absence of global page styling. `DESIGN.md` records this vocabulary as the approved CLB-692 foundation decision without duplicating the full token inventory.

## Verification

Implementation follows test-driven development.

1. Contract tests first fail for the required semantic properties, class names, theme selectors, and reduced-motion rules.
2. A forbidden-global test rejects `body`, reset, and unscoped element styling in published source CSS.
3. CSS build tests verify `tokens.css` is copied byte-for-byte and precedes foundation styles in `styles.css`.
4. DOM tests verify theme attributes, opt-in class composition, and accessibility smoke behavior.
5. The packed Vite fixture imports the published complete stylesheet without Tailwind.
6. The lab build demonstrates both themes and the override example.
7. `pnpm verify` and `pnpm tsc --noEmit` pass before commit and before delivery.

The change includes a minor changeset because it adds consumer-visible CSS APIs without removing a published stable contract.

## Delivery boundary

CLB-692 ships only foundations. It does not extract React components, add a theme provider, migrate either consumer, publish a package version, or create Figma components. Component issues consume this contract after it lands; consumer migrations and Figma parity remain their explicitly tracked follow-up work.
