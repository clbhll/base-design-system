# Base Dialog system design

## Context

`@calebhill/base@0.1.0-alpha.0` publishes foundations, actions, inputs, and
progress, but its supported consumers still own separate modal mechanics.
`photos.me` has the visual source for the compact and wide modal shell plus
heading, footer, entrance, exit, and layout behavior. Its focus handling is
split between `useModalFocus`, `UploadProvider`, `UploadComposer`, and an
upload-specific helper. `calebhill.me` independently implements a portal,
scroll lock, Escape handler, and single-control focus trap for its lightbox.

CLB-693 promotes the universal modal behavior into one package-owned Dialog
system. `DESIGN.md` remains authoritative for package boundaries and conflict
resolution. The Linear issue remains authoritative for scope, estimate,
acceptance criteria, and delivery state.

## Goals

- Export controlled `Dialog`, `DialogHeading`, and `DialogFooter` components.
- Own the portal, focus entry, focus containment, Escape dismissal, backdrop
  dismissal, scroll locking, focus restoration, and exit presence.
- Preserve the proven compact and wide layouts without product tokens,
  Tailwind, aliases, product refs, or upload state.
- Preserve the restrained fade, surface translation/scale, layout transition,
  and reduced-motion treatment through shared motion primitives where they fit.
- Make correct labelling and keyboard behavior the default composition.
- Keep the public API small enough to change deliberately during the alpha.

## Non-goals

- No alert-dialog policy, confirmation semantics, close icon, trigger, form
  state, busy-state policy, validation, upload behavior, lightbox behavior, or
  application orchestration.
- No uncontrolled `defaultOpen` state in this slice.
- No polymorphic `asChild` API and no export of the underlying Radix parts.
- No public focus-management hook, focus selector, presence hook, scroll-lock
  utility, or motion constant.
- No consumer migration in this issue. CLB-706 and CLB-708 remain separate
  delivery work after the required package APIs are published.
- No canonical Figma component in this issue. CLB-707 owns the library and must
  reconcile its Dialog against this public contract.

## Classification and ownership

This is Base-owned work. Portal mechanics, modal focus behavior, dismissal,
scroll locking, accessible labelling, stable component anatomy, and package
styles are universal. Product state, copy, forms, asynchronous dismissal rules,
and which action changes `open` remain consumer-owned.

`@calebhill/animations` remains the source for shared easing and transition
primitives. Base owns the Dialog-specific travel distance, scale, duration,
layout activation, and reduced-motion application. The implementation must not
copy the photos.me animation helpers or expose motion-library types publicly.

## Approaches considered

### Recommended: a narrow Base wrapper around Radix Dialog

Radix Dialog already implements the WAI-ARIA modal-dialog pattern, controlled
state, portal behavior, inert background, focus entry and containment, Escape
dismissal, focus restoration, and CSS-animation-aware unmounting. Base wraps
only the parts needed by the approved API and keeps all Radix names and event
types private. This gives consumers one stable Base contract without asking
this package to maintain another bespoke focus scope.

The cost is one runtime dependency. That dependency is justified because the
ticket explicitly promotes complete accessibility mechanics, and those
mechanics are more failure-prone than the package's visual wrapper.

References:

- <https://www.radix-ui.com/primitives/docs/components/dialog>
- <https://www.radix-ui.com/primitives/docs/guides/animation>

### Rejected: extract and expand the photos.me focus hook

This would avoid a dependency and preserve the current DOM most literally, but
it would make Base responsible for focus-scope edge cases, nested overlays,
background inertness, portal lifecycle, and scroll-lock reference counting.
The current implementations already demonstrate drift and product coupling.
Copying them would move that maintenance burden rather than resolve it.

### Rejected: wrap the native `<dialog>` element

Native top-layer and focus behavior are attractive, but controlled exit
presence, predictable backdrop dismissal, browser-specific focus restoration,
and test-environment support would require another compatibility layer. It is
not the smallest reliable change for the current supported consumers.

## Public API

```ts
export type DialogSize = "compact" | "wide";

export type DialogProps = Omit<
  ComponentPropsWithoutRef<"div">,
  | "aria-modal"
  | "children"
  | "onAnimationEnd"
  | "role"
  | "tabIndex"
> & {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: DialogSize;
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  layoutDependency?: boolean | number | string;
  overlayClassName?: string;
  portalContainer?: HTMLElement | null;
  onExitComplete?: () => void;
};

export type DialogHeadingProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "title"
> & {
  title: ReactNode;
  subtitle?: ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
};

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export const Dialog: ForwardRefExoticComponent<
  DialogProps & RefAttributes<HTMLDivElement>
>;
```

Defaults are:

- `size="compact"`
- `dismissOnBackdrop={true}`
- `dismissOnEscape={true}`
- `portalContainer={document.body}` on the client

`Dialog` is controlled only. `onOpenChange(false)` is the single dismissal
signal for Escape, backdrop interaction, and any consumer action that closes
the Dialog. A prevented dismissal does not call it. Base does not infer busy or
destructive state; a consumer that must remain open sets both dismissal props
to `false` while its operation is non-cancelable.

The forwarded Dialog ref targets the operative `role="dialog"` surface.
Applicable div props, data attributes, `className`, and `style` compose onto
that surface. Base owns `role`, `aria-modal`, `tabIndex`, presence animation
events, and the Radix behavior hooks.

`layoutDependency` opts the surface into motion-library size layout. It accepts
only serializable primitive values so consumers can name meaningful layout
states without importing motion types. When omitted, the Dialog has no layout
measurement overhead. The prop does not control content or product state.

## Accessible anatomy

The rendered anatomy is one package-owned portal containing an overlay and one
surface:

```text
Portal
├── overlay
└── surface [role=dialog, aria-modal=true]
    ├── DialogHeading
    │   ├── title
    │   └── optional description
    ├── consumer content
    └── optional DialogFooter
```

`DialogHeading` renders the Radix title and optional description through native
`h2` and `p` elements. Their generated relationship supplies the Dialog's
accessible name and optional description without requiring consumers to create
or coordinate IDs. A visible title is required by the documented composition.
If a future use case needs a visually hidden title, it requires a follow-up
public-contract decision rather than an undocumented escape hatch.

`DialogFooter` is a layout container only. It does not close the Dialog or
change child button semantics. Consumers keep native buttons and call their
controlled state setter from the appropriate actions.

Nested interactive content—including forms, inputs, links, menus, and controls
that mount dynamically—participates in the underlying focus scope. Base does
not query or cache a product-specific selector list.

## Focus, dismissal, scroll, and presence behavior

When `open` becomes true:

1. the Dialog portals to `portalContainer` or `document.body`;
2. the page behind it becomes inert and body scrolling is locked by the
   accessibility primitive;
3. focus moves to `initialFocusRef.current` when that connected element is
   inside the Dialog; otherwise it follows the primitive's first-suitable-focus
   behavior;
4. Tab and Shift+Tab remain within the Dialog, including dynamically mounted
   nested interactive content.

Escape calls `onOpenChange(false)` only when `dismissOnEscape` is true.
Pointer interaction outside the surface calls it only when
`dismissOnBackdrop` is true. Pointer events inside the surface never count as
backdrop dismissal. These controls are independent.

When `open` becomes false, the surface and overlay remain present for their CSS
exit animations. They are no longer interactive during the closed state.
Focus returns to the connected element that held focus before opening. Body
scroll and background interactivity are restored without overwriting consumer
styles. `onExitComplete` fires once from the surface's closed-state animation
completion, after which the primitive unmounts the portal content.

## Motion

The Dialog uses `@calebhill/animations` for the shared weighted ease and
`motion/react` only for opt-in size layout. `motion` is a peer dependency so a
single consumer runtime owns React animation state. `@calebhill/animations` is
a Base runtime dependency because Base reads the shared transition primitive.

Standard motion preserves the photos.me character:

- overlay: opacity only;
- surface enter: opacity plus `translateY(4px) scale(0.95)` to identity;
- surface exit: opacity to zero without extra travel;
- duration: the existing Base fast and standard duration vocabulary;
- layout: size-only interpolation when `layoutDependency` is supplied.

Under `prefers-reduced-motion: reduce`, overlay and surface retain a short
opacity transition but surface translation and scale are removed. Layout
interpolation is disabled. State communication remains visible without spatial
movement.

## Visual contract

The visual source is the proven photos.me modal anatomy, translated onto
existing Base semantics:

- fixed viewport overlay, centered with responsive inset padding;
- subtle two-pixel backdrop blur and a token-derived translucent background;
- compact maximum width of `28rem`, wide maximum width of `42rem`;
- surface maximum height of `calc(100dvh - 2rem)` with internal vertical
  scrolling;
- `1.25rem` padding, semantic border/surface/text colors, restrained shadow,
  and the existing clamped `1.5rem` to `2rem` squircle-capable radius;
- heading uses the approved 1.0625rem semibold modal-title role;
- subtitle uses the approved 0.9375rem regular modal-subtitle role and semantic
  tertiary text;
- footer uses a `1.5rem` top gap, right alignment, and `0.5rem` action gap.

No new public token is required. Component CSS uses existing Base reference
spacing, typography, duration, surface, border, background, and text tokens.
The optional `corner-shape: squircle` enhancement may be emitted alongside the
portable border radius; unsupported browsers retain the rounded fallback.

## Package boundaries and dependencies

- Add the current stable `radix-ui` package as a runtime dependency, importing
  only its Dialog primitive.
- Add `@calebhill/animations` as a runtime dependency at the published `0.6.x`
  line.
- Add `motion` as a peer dependency compatible with the supported React 19
  consumers and as a development dependency for package tests and the lab.
- Preserve React and React DOM as peers.
- Do not export Radix or motion types, primitives, data structures, or helpers.
- Do not import Next.js, Vercel modules, product aliases, product CSS, or
  product state.

## Testing

Behavior work follows test-driven development. Each behavior begins with a
failing focused test before production code changes.

React interaction coverage must prove:

- the controlled open and closed states and portal location;
- exact `role="dialog"`, `aria-modal`, generated title, and optional description
  relationships;
- ref forwarding plus native data/class/style composition;
- default focus entry, explicit initial focus, Tab/Shift+Tab containment, and
  dynamically mounted interactive content;
- focus restoration to the connected opener;
- default and disabled Escape dismissal;
- default and disabled backdrop dismissal without inside-click dismissal;
- body scroll lock and restoration without losing pre-existing inline style;
- closed-state presence and one `onExitComplete` callback;
- axe-clean representative compositions in both themes.

Contract coverage must prove:

- exact runtime and type exports for Dialog, DialogHeading, DialogFooter,
  DialogProps, DialogHeadingProps, DialogFooterProps, and DialogSize;
- type acceptance for native props, controlled state, ref, sizes, dismissal
  options, initial focus, layout dependency, and portal container;
- rejection of uncontrolled state and package-owned role/presence props;
- inclusion and ordering of Dialog CSS in the complete stylesheet only;
- absence of product variables, aliases, Tailwind directives, and global
  selectors;
- packed Vite and Next.js fixtures compile and build against the real tarball.

The canonical lab must show compact and wide Dialogs, a form with multiple
controls, both dismissal configurations, dynamic content/layout, focus return,
both themes, and reduced-motion guidance. Manual review covers keyboard-only
operation, focus visibility, narrow viewport, 200 percent zoom, scrollable
content, light/dark themes, and reduced motion.

## Figma and documentation

No Figma file or node is linked to CLB-693, and `DESIGN.md` still records the
canonical Figma library as future work. This is an explicit code-first
divergence owned by CLB-707. CLB-707 must model the approved compact/wide
anatomy, title/description relationship, dismissal settings, states, and Base
tokens from this contract; it must not infer a different public API.

README component guidance and the canonical lab document controlled usage,
accessible headings, focus behavior, dismissal configuration, and when a
modal Dialog is inappropriate. A minor changeset describes the new unstable
Dialog API and its peer/runtime requirements.

## Delivery

CLB-693 lands as one Base PR from `chill/clb-693-dialog`. Before review it must
pass the simplification pass, `pnpm verify`, and the explicit
`pnpm tsc --noEmit` check. The packed artifact and both supported fixture types
must pass with the new dependency contract. The PR records the manual lab
review and the temporary Figma divergence. After merge, Linear moves to Done
and the worktree and branch are cleaned up.
