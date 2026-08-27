# Base ActionMenu system design

## Context

`@calebhill/base@0.1.0-alpha.1` publishes the package foundations, actions,
inputs, progress, icons, and Dialog. `photos.me` still owns a hand-built action
menu for photo controls. That implementation establishes the approved visual
and motion reference, but it also owns bespoke focus, dismissal, portal,
positioning, and selection-handoff logic.

CLB-696 promotes the universal behavior into a project-agnostic ActionMenu.
`DESIGN.md` owns the package boundary, Linear owns the approved scope and
acceptance criteria, the photos.me implementation owns the parity reference,
and package source and executable tests will own the resulting public contract.

## Goals

- Export one compact ActionMenu with a typed item model.
- Support default, destructive, and disabled items.
- Own portal positioning, collision handling, outside dismissal, Escape,
  complete menu keyboard navigation, focus restoration, and selection handoff.
- Support controlled and uncontrolled open state without product state.
- Preserve the photos.me trigger, surface, item, and motion treatment pixel for
  pixel when rendered with equivalent semantic token values.
- Keep the API framework-independent and free of photo, canvas, routing, and
  application assumptions.
- Document and test the component in the canonical Base lab.

## Non-goals

- No nested or cascading menus, groups, separators, checkboxes, radio items,
  submenus, arbitrary rich item content, or product-specific shortcuts.
- No navigation policy, confirmation behavior, analytics, asynchronous state,
  or destructive-action policy.
- No exported Radix primitives, motion-library types, positioning utilities,
  handoff helper, or focus-management helper.
- No photos.me migration in this issue. CLB-706 adopts the published component
  after CLB-696 and CLB-687 are available.
- No canonical Figma component in this issue. CLB-707 is explicitly blocked by
  CLB-696 and must model the shipped Base contract.

## Classification and ownership

This is Base-owned work. Menu semantics, keyboard behavior, focus, dismissal,
positioning, item state, portal behavior, and component styling are reusable
interaction mechanics. The consumer owns where the trigger appears, item copy,
selection callbacks, permissions, and any flow started by a selection.

`@calebhill/animations` owns the shared spring and easing vocabulary. Base owns
how that vocabulary applies to the ActionMenu surface and items. Existing Base
semantic tokens are sufficient; this work adds no public token.

## Approaches considered

### Recommended: a narrow Base wrapper around Radix DropdownMenu

Radix DropdownMenu already owns the WAI-ARIA menu pattern, roving focus,
Arrow Up and Down, Home, End, typeahead, disabled-item skipping, Escape,
outside-pointer dismissal, focus return, portal presence, collision-aware
positioning, and repositioning during resize and scroll. Base wraps those
mechanics behind the approved typed-item API and owns the visuals and motion.

This keeps the public contract small while replacing the highest-risk bespoke
logic. It also uses the runtime dependency already present for Dialog rather
than adding another package.

### Rejected: copy the photos.me implementation

Copying would preserve the current DOM most literally, but it would make Base
maintain manual global listeners, ref arrays, wrapping focus math, viewport
positioning, and scroll/resize behavior. It would also keep the current gap
where disabled items are not represented. Pixel parity does not require Base
to preserve bespoke mechanics.

### Rejected: export a compound primitive API

Separate Trigger, Content, Item, Group, Separator, and Portal exports would be
more flexible, but neither supported consumer needs that surface. It would
expose more API and styling anatomy than CLB-696 approves. Additional menu
patterns require their own consumer evidence and issue.

## Public API

```ts
export type ActionMenuItemTone = "default" | "destructive";
export type ActionMenuSide = "top" | "right" | "bottom" | "left";
export type ActionMenuAlign = "start" | "center" | "end";

export interface ActionMenuItem {
  label: string;
  onSelect: () => void;
  tone?: ActionMenuItemTone;
  disabled?: boolean;
}

type ActionMenuStateProps =
  | {
      open: boolean;
      defaultOpen?: never;
      onOpenChange: (open: boolean) => void;
    }
  | {
      open?: never;
      defaultOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
    };

export type ActionMenuProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onSelect"
> & {
  label: string;
  icon: ReactNode;
  items: readonly ActionMenuItem[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  side?: ActionMenuSide;
  align?: ActionMenuAlign;
  sideOffset?: number;
  portalContainer?: HTMLElement | null;
  triggerClassName?: string;
  contentClassName?: string;
} & ActionMenuStateProps;

export const ActionMenu: ForwardRefExoticComponent<
  ActionMenuProps & RefAttributes<HTMLButtonElement>
>;
```

Defaults are:

- uncontrolled closed state when `open` and `defaultOpen` are omitted;
- `side="top"`, `align="end"`, and `sideOffset={8}` to preserve photos.me;
- `tone="default"` and `disabled={false}` for every item;
- `portalContainer={document.body}` on the client.

`label` supplies the trigger's accessible name, title, and menu label. `icon`
is decorative within that labelled trigger. The forwarded ref targets the
operative button. Root `className`, `style`, data attributes, and applicable
div props compose on the non-semantic positioning wrapper so photos.me can
retain its inverse canvas-scale placement. `triggerClassName` and
`contentClassName` are narrow visual integration hooks; Base still owns roles,
focusability, item tab indices, data state, selection events, and portal
semantics.

`open` makes the component controlled and requires `onOpenChange`.
`defaultOpen` supplies an uncontrolled initial state, where `onOpenChange` is
optional observation. The discriminated state contract rejects supplying both
`open` and `defaultOpen`.

## Rendered anatomy

```text
wrapper
└── trigger button [aria-haspopup=menu, aria-expanded]

portal
└── menu surface [role=menu, aria-label]
    └── item button [role=menuitem] × n
```

The trigger uses Base `Button` with `variant="text"` and `size="icon"`. The
menu surface and items use Radix DropdownMenu parts internally. Item labels are
strings so the public model remains serializable, keys stay stable, and every
item has a text alternative without another naming prop.

## Interaction behavior

- Pointer activation toggles the menu unless the trigger is disabled.
- Arrow Down on the trigger opens and focuses the first enabled item.
- Arrow Up on the trigger opens and focuses the last enabled item.
- Arrow Up and Down move through enabled items and wrap.
- Home and End move to the first and last enabled items.
- Enter and Space activate the focused item.
- Disabled items remain visible but cannot receive focus or activate.
- Escape and outside pointer interaction close without selecting.
- Closing without selection restores focus to the connected trigger.
- Positioning updates across viewport resize, scroll, and collision changes.

Selection is handed off after the menu has closed and focus restoration has
completed. Base queues only the first selection, requests close, allows the
surface exit and Radix close-auto-focus lifecycle to finish, then invokes the
consumer callback in a microtask. This preserves the photos.me behavior and
prevents an action that opens Dialog from losing its initial focus to a late
menu restoration. Escape or outside dismissal cancels any pending callback.

## Pixel-parity contract

The visual source is
`photos-me/src/components/action-menu.tsx` at the CLB-696 implementation
baseline. Equivalent Base semantic tokens must produce the following geometry:

| Element | Reference contract |
| --- | --- |
| Trigger | 36 × 36 px, 12 px radius with squircle enhancement, text-button color treatment |
| Trigger gap | 8 px between trigger edge and menu surface |
| Surface | minimum width 144 px, 4 px padding, 16 px radius with squircle enhancement, 1 px semantic border |
| Item | minimum height 40 px, 12 px horizontal padding, 12 px radius, left aligned |
| Type | existing Base action role, matching photos.me `type-action` size, line height, weight, and letter spacing |
| Color | semantic surface, border, primary text, hover surface, danger text, and danger-subtle hover |
| Shadow | photos.me `shadow-lg` geometry and opacity, expressed directly through Base semantic/reference colors |
| Origin | trigger-facing corner: bottom right for the default top/end placement |

The standard surface enters from `translateY(4px) scale(0.95)` and opacity
zero. Items enter from `translateY(3px) scale(0.95)` and opacity zero with the
existing 30 ms child delay and 40 ms stagger. Standard opacity takes 180 ms;
transform uses `springConfigs.press`. Exit is 120 ms with reverse item stagger
and no new travel beyond the proven closed transform. Reduced motion keeps a
120 ms opacity fade and removes translation, scale, spring, and stagger travel.

Visual verification uses a lab-only reference specimen that reproduces the
hand-rolled DOM and exact resolved reference values without importing product
code into the package. The reference and Base specimens render side by side at
the same viewport, browser zoom, device pixel ratio, item content, placement,
and semantic token values. Review captures both themes and the open, hovered,
focused, destructive, disabled, and closing states. Element bounds and
computed styles are recorded alongside screenshots. Any non-zero visual
difference must be either corrected or documented in CLB-696 as an intentional
accessibility or browser-primitive difference before delivery.

The reference specimen remains lab-only and is clearly labelled as a parity
harness. It is excluded from `src/`, public CSS, exports, and the packed npm
artifact. Once photos.me migrates under CLB-706, the parity harness can be
removed in that issue after the product screenshot matches the published Base
component.

## Styling and motion implementation

ActionMenu component CSS is Base-scoped and uses existing semantic properties.
No Tailwind directives, reset selectors, global element selectors, product
variables, or product names enter package CSS.

The surface and items use `motion/react` because the approved transform spring,
child delay, and stagger cannot be represented faithfully by the existing CSS
duration tokens alone. Shared spring and easing values come directly from
`@calebhill/animations`; Base owns only the component distances and sequencing.
Radix remains responsible for presence and positioning.

The wrapper does not impose layout. The trigger and menu remain usable at 200
percent zoom and narrow viewports. Collision handling may change the rendered
side; CSS transform-origin follows Radix's computed origin so flipped menus
still animate from their trigger-facing corner.

## Testing

Behavior work follows test-driven development. Every new behavior begins with
a focused failing test.

React coverage proves:

- uncontrolled and controlled open state plus `onOpenChange`;
- custom portal container, forwarded trigger ref, and root integration props;
- correct trigger and menu accessible names;
- Arrow Down and Up entry, Arrow navigation, Home, End, wrapping, typeahead,
  activation, and trigger focus restoration;
- disabled items are skipped and cannot activate;
- Escape, outside pointer dismissal, and inside interaction;
- exactly-once selection handoff after focus restoration;
- representative axe-clean menus in light and dark themes.

Contract coverage proves:

- exact runtime and type exports;
- accepted and rejected public prop combinations;
- Base-only selectors and custom properties;
- exact geometry, state, motion, reduced-motion, and transform-origin rules;
- inclusion of ActionMenu CSS in the complete stylesheet only;
- absence of product imports, aliases, Tailwind directives, and global styles;
- packed Vite and Next fixtures compile and build from the real tarball.

The lab documents the public contract, props, item states, themes, placement,
keyboard behavior, focus restoration, reduced motion, and lifecycle status.
Manual review covers keyboard-only use, pointer use, visible focus, zoom,
collision flipping, scroll repositioning, both themes, reduced motion, and the
pixel-parity matrix above.

## Documentation, Figma, and release impact

README gains one focused ActionMenu example and explains controlled state only
as an integration hook, not product orchestration. The canonical lab gains the
ActionMenu document and parity harness. A minor changeset records the new beta
public API.

No Figma node is linked to CLB-696 and `DESIGN.md` records the canonical Figma
library as future work. This is an explicit code-first divergence owned by
CLB-707, which CLB-696 currently blocks. CLB-707 must reproduce the shipped
anatomy, variants, item states, placements, tokens, and interaction annotations.

## Delivery

CLB-696 ships from `chill/clb-696-action-menu`. Before review it must pass the
simplification pass, `pnpm verify`, `pnpm tsc --noEmit`, and `git diff --check`.
The packed Vite and Next fixtures must pass. Visual parity evidence covers both
themes and the required state matrix. After the PR merges and the prerelease is
published and verified, CLB-696 moves to Done and the feature worktree and
branch are cleaned up.
