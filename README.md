# Base Design System

`@calebhill/base` is a reusable React design system for building consistent, accessible interfaces across products, teams, and brands. It provides semantic design tokens, accessible components, stable package APIs, and compiled CSS without requiring consumer Tailwind configuration.

Read the [AI-first design contract](DESIGN.md) before changing tokens, components, motion, accessibility behavior, or public APIs. Repository workflow and validation commands live in [AGENTS.md](AGENTS.md).

## Consumer setup

Install the package and its React peer dependencies:

```sh
pnpm add @calebhill/base motion react react-dom
```

Import the complete package stylesheet once in the application entry point:

```ts
import "@calebhill/base/styles.css";
```

Light tokens are the default. Set the package theme contract on an application root to select a theme explicitly:

```html
<html data-base-theme="light">
```

Supported values are `data-base-theme="light"` and `data-base-theme="dark"`.

Import only the token contract when a consumer supplies all component and foundation styles itself:

```ts
import "@calebhill/base/tokens.css";
```

Apply product-specific branding by overriding semantic properties through the normal CSS cascade, without creating a separate Base theme:

```css
[data-base-theme="light"] {
  --base-color-accent: #0082f6;
  --base-color-accent-hover: #56afff;
  --base-color-accent-active: #0062b8;
  --base-color-focus-ring: #0082f6;
}
```

The complete stylesheet exports opt-in `.base-type-*`, `.base-link*`, `.base-tabular-nums`, `.base-focus-ring`, and `.base-pressable` classes. It does not style `body`, reset elements, or require Tailwind.

## Dialog

Dialog is controlled. It owns the portal, focus entry and containment, Escape and backdrop dismissal, scroll locking, exit presence, and focus return.

```tsx
import { useState } from "react";
import { Button, Dialog, DialogFooter, DialogHeading, TextInput } from "@calebhill/base";

export function EditProfile() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit profile</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeading
          title="Edit profile"
          subtitle="Update the details shown with your work."
        />
        <TextInput aria-label="Display name" />
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Save</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
```

`DialogHeading` and `DialogFooter` are separate exports so the composition stays readable, but they are Dialog-specific parts rather than standalone page-layout components. `DialogHeading` requires Dialog context. `DialogFooter` supplies the action layout and does not close anything on its own.

Escape and backdrop dismissal are enabled by default and can be controlled independently with `dismissOnEscape` and `dismissOnBackdrop`. Use `initialFocusRef` only when the first focusable control is not the right starting point. Consumers do not need a separate focus or scroll-lock hook.

## ActionMenu

ActionMenu turns a compact icon trigger into a typed list of actions. It owns positioning, keyboard navigation, focus return, and selection handoff so the action runs after the menu has closed and focus is back on the trigger.

```tsx
import { ActionMenu, MoreIcon, type ActionMenuItem } from "@calebhill/base";

const items = [
  { label: "Rename", onSelect: () => renamePhoto() },
  { label: "Delete", tone: "destructive", onSelect: () => deletePhoto() },
] satisfies readonly ActionMenuItem[];

export function PhotoActions() {
  return (
    <ActionMenu
      icon={<MoreIcon />}
      items={items}
      label="Photo options"
    />
  );
}
```

The menu is uncontrolled by default and opens above the trigger, aligned to its trailing edge with an 8px gap. Use `open` with `onOpenChange` for controlled state, or adjust `side`, `align`, and `sideOffset` when the surrounding layout needs another placement. Disabled actions stay visible but cannot receive focus or run their callback.

## Toast

Wrap your application once in `ToastProvider`. Use `useToast` inside it to display
notifications. Base owns placement, queuing, announcements, timers, and dismissal;
your application owns the operation and its result.

```tsx
import { Button, ToastProvider, useToast } from "@calebhill/base";

function SaveFeedback() {
  const { notify } = useToast();
  return (
    <Button onClick={() => notify({ message: "Changes saved.", duration: 5000 })}>
      Show feedback
    </Button>
  );
}

export function App() {
  return <ToastProvider><SaveFeedback /></ToastProvider>;
}
```

The default is bottom-center, a 150ms entrance with no delay, a 5000ms timeout,
and up to three visible notifications. Use `duration: null` to persist until
dismissed. Timers pause on hover, keyboard focus, and window blur. An optional
`leading` node holds a decorative image or icon; an `action` has a text `label`
and an `onClick` callback. The action always uses the subtle, pill-shaped Base
Button. Clicking it invokes the callback and dismisses the notification; it does
not await asynchronous work. A persistent toast without an action gets a Dismiss
button in the same trailing slot.

`notify` returns an id for `dismiss(id)`. `dismissAll()` immediately clears both
visible and queued entries. Repeated open or queued notifications with the same
variant and message reuse the existing id; supply `dedupeKey` to choose another
identity. Queued timers start only when displayed. The queue uses insertion order,
with newer visible notifications below older ones.

`ToastProvider` accepts `duration`, `maxVisible`, and `placement` (top or bottom,
combined with left, center, or right). Viewport spacing accounts for safe areas.
Its portal defaults to `document.body`; set `theme` when the portal needs a theme
different from the document, or `portalContainer` for another destination. The
destination must remain mounted. For use inside a modal, place a scoped provider
and its portal container inside the modal's accessible content.

F8 focuses notifications; Tab reaches each toast and action; Escape dismisses
within that area. Swipe right also dismisses. `variant: "error"` announces
assertively; `"neutral"` (default) and `"success"` announce politely. These variants
do not add decorative color. Reduced motion uses a fade. Localize `label`,
`viewportLabel` (supports `{hotkey}`), and `dismissLabel` on the provider.

`Toast` is also exported as visual anatomy with `message`, `leading`, and `action`
props plus native div attributes and a forwarded ref. It does not announce or
manage its own visibility; use the provider for notifications.

## Development

Install dependencies and run the same fail-fast gate used by CI:

```sh
pnpm install
pnpm verify
```

Start the local component lab with:

```sh
pnpm lab:dev
```

The lab is Base's public component reference. Its left navigation opens hash-linkable documents for foundations and every current public component, while live specimens consume only `@calebhill/base` exports and the public stylesheet. The lab remains package-owned documentation and is excluded from the npm artifact.

Validate one packed npm artifact in the standalone Vite and Next.js consumer fixtures with:

```sh
pnpm fixture:test
```

Registry verification is release-only and requires an exact published prerelease:

```sh
pnpm fixture:registry -- 0.1.0-alpha.1
```

See [docs/releasing.md](docs/releasing.md) for the Changesets, trusted-publishing, verification, and rollback runbook. Public alphas publish under npm's `next` tag; `StatusTag` remains documentation-only and is never consumable from the package.

## Status

Base is in public alpha. Its foundations, Dialog system, and first action, input, and feedback primitives are available, with the component lab documenting current APIs and behavior.

## License

MIT © Caleb Hill
