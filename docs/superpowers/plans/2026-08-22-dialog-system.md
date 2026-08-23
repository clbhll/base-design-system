# Base Dialog System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a controlled, accessible Base Dialog system that owns portal, focus, dismissal, scroll, presence, motion, layout, and composable heading/footer behavior.

**Architecture:** Wrap only Radix Dialog's internal accessibility primitives behind package-owned `Dialog`, `DialogHeading`, and `DialogFooter` exports. Use Radix for modal focus, inertness, scroll locking, and CSS-aware exit presence; use `@calebhill/animations` for the shared ease and `motion/react` only for opt-in size layout. Keep every Radix and motion type private, style the proven photos.me anatomy with existing Base tokens, and extend the canonical lab plus packed Vite/Next fixtures.

**Tech Stack:** pnpm 10.30.3, React 19, TypeScript 5.9, Radix Dialog, Motion, `@calebhill/animations`, CSS, Vitest 4, Testing Library, axe, Vite, Next.js 16, Changesets

**Spec:** `docs/superpowers/specs/2026-08-22-dialog-system-design.md`

## Global Constraints

- The public package remains framework-independent and must not import Next.js, Vercel, consumer aliases, product types, product CSS, or product state.
- Public custom properties use the `--base-` prefix; Dialog must not add a public token when the existing semantic and reference vocabulary is sufficient.
- Shared easing comes from `@calebhill/animations`; no Radix or motion type may escape the public declaration surface.
- `Dialog` is controlled only and owns `role`, `aria-modal`, `tabIndex`, portal, presence animation events, and primitive behavior hooks.
- `DialogHeading` and `DialogFooter` are separate named exports but are documented as parts of the Dialog compound system; `DialogHeading` requires Dialog context.
- Behavior changes follow red-green-refactor with the focused test observed failing before production code is written.
- The canonical Figma component remains an explicit divergence owned by CLB-707.
- Run `pnpm verify` and `pnpm tsc --noEmit` before committing implementation and again before claiming completion.

---

### Task 1: Lock the dependency, runtime-export, and type contracts

**Files:**

- Create: `test/contracts/public-api/dialog-exports.ts`
- Create: `test/contracts/dialog-types.test.tsx`
- Modify: `test/contracts/public-api.test.ts`
- Modify: `scripts/assert-tarball-contents.mjs`
- Modify: `test/contracts/packed-package.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/components/dialog.tsx`
- Modify: `src/index.ts`

**Interfaces:**

- Consumes: React native div attributes and refs.
- Produces: `Dialog`, `DialogHeading`, `DialogFooter`, `DialogProps`, `DialogHeadingProps`, `DialogFooterProps`, and `DialogSize` from `@calebhill/base`.
- Keeps private: Radix component props, Motion props, focus-scope callbacks, animation event plumbing.

- [ ] **Step 1: Add the failing exact runtime-export contract**

Create `test/contracts/public-api/dialog-exports.ts`:

```ts
export const dialogRuntimeExports = [
  "Dialog",
  "DialogFooter",
  "DialogHeading",
] as const;
```

Import and spread `dialogRuntimeExports` into the expected `runtimeExports` array in `test/contracts/public-api.test.ts` without changing `src/index.ts`.

- [ ] **Step 2: Run the export test and verify red**

Run: `pnpm vitest run test/contracts/public-api.test.ts`

Expected: FAIL because the three Dialog runtime exports are absent from `src/index.ts`.

- [ ] **Step 3: Add the failing public type fixture**

Create `test/contracts/dialog-types.test.tsx` with real JSX compositions:

```tsx
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import {
  Dialog,
  DialogFooter,
  DialogHeading,
  type DialogProps,
  type DialogSize,
} from "../../src";

const dialogRef = createRef<HTMLDivElement>();
const focusRef = createRef<HTMLInputElement>();
const portal = document.createElement("div");
const size = "wide" satisfies DialogSize;
const props = {
  open: true,
  onOpenChange: (_open: boolean) => undefined,
  size,
  dismissOnBackdrop: false,
  dismissOnEscape: false,
  initialFocusRef: focusRef,
  layoutDependency: "editing",
  portalContainer: portal,
} satisfies DialogProps;

const valid = (
  <Dialog {...props} className="consumer-dialog" data-track="dialog" ref={dialogRef}>
    <DialogHeading title="Edit photo" subtitle="Update the caption." />
    <input ref={focusRef} />
    <DialogFooter><button type="button">Save</button></DialogFooter>
  </Dialog>
);

// @ts-expect-error Dialog is controlled and requires open
const missingOpen = <Dialog onOpenChange={() => undefined}><DialogHeading title="Title" /></Dialog>;

// @ts-expect-error Dialog is controlled and does not accept defaultOpen
const uncontrolled = <Dialog open onOpenChange={() => undefined} defaultOpen><DialogHeading title="Title" /></Dialog>;

// @ts-expect-error role is owned by Dialog
const customRole = <Dialog open onOpenChange={() => undefined} role="alertdialog"><DialogHeading title="Title" /></Dialog>;

// @ts-expect-error aria-modal is owned by Dialog
const customModal = <Dialog open onOpenChange={() => undefined} aria-modal="false"><DialogHeading title="Title" /></Dialog>;

describe("Dialog type contract", () => {
  it("accepts the controlled compound API and rejects package-owned props", () => {
    expect([valid, missingOpen, uncontrolled, customRole, customModal]).toHaveLength(5);
  });
});
```

- [ ] **Step 4: Run TypeScript and verify red**

Run: `pnpm tsc --noEmit`

Expected: FAIL because Dialog exports and types do not exist.

- [ ] **Step 5: Change the packed contract from zero dependencies to exact approved dependencies**

Update `scripts/assert-tarball-contents.mjs` so expected peers include `motion`, expected runtime dependencies include only `@calebhill/animations` and `radix-ui`, the approved tsup labels include `src/components/dialog.tsx`, and the exact runtime/declaration name lists include all Dialog exports. Update `assertRuntimeDependencies` to compare exact sorted `name@range` entries and continue rejecting optional, bundled, and peer-metadata channels.

Update the extracted manifest and declaration/runtime fixtures in `test/contracts/packed-package.test.ts` to represent the approved Dialog surface and add mutations that reject an extra runtime dependency, a missing Radix dependency, and a missing Motion peer.

- [ ] **Step 6: Install the exact dependency channels**

Run:

```sh
pnpm add radix-ui @calebhill/animations@^0.6.0
pnpm add motion --save-peer
```

Inspect `package.json`. `radix-ui` and `@calebhill/animations` must be under `dependencies`; `motion` must be under both `peerDependencies` and `devDependencies`; React and React DOM remain peers.

- [ ] **Step 7: Add the typed placeholder surface and public barrel**

Create `src/components/dialog.tsx` with the final public type aliases but placeholder renderers that make no accessibility-behavior claims yet:

```tsx
"use client";

import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode, type RefObject } from "react";

export type DialogSize = "compact" | "wide";
export type DialogProps = Omit<ComponentPropsWithoutRef<"div">, "aria-modal" | "children" | "defaultOpen" | "onAnimationEnd" | "role" | "tabIndex"> & {
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
export type DialogHeadingProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> & {
  title: ReactNode;
  subtitle?: ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
};
export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(_props, _ref) {
  return null;
});
export function DialogHeading(_props: DialogHeadingProps) { return null; }
export function DialogFooter({ children, ...props }: DialogFooterProps) { return <div {...props}>{children}</div>; }
```

Export the module from `src/index.ts`.

- [ ] **Step 8: Verify the public contracts are green**

Run:

```sh
pnpm vitest run test/contracts/public-api.test.ts test/contracts/packed-package.test.ts
pnpm tsc --noEmit
```

Expected: PASS. No runtime behavior test exists yet, so the placeholder is not treated as implemented.

- [ ] **Step 9: Commit the contract checkpoint**

```sh
git add package.json pnpm-lock.yaml scripts/assert-tarball-contents.mjs src/index.ts src/components/dialog.tsx test/contracts
git commit -m "CLB-693 lock the Dialog package contract"
```

---

### Task 2: Render the controlled accessible anatomy through a portal

**Files:**

- Create: `test/react/dialog.test.tsx`
- Modify: `src/components/dialog.tsx`

**Interfaces:**

- Consumes: `Dialog.Root`, `Dialog.Portal`, `Dialog.Overlay`, `Dialog.Content`, `Dialog.Title`, and `Dialog.Description` from `radix-ui`.
- Produces: the package-owned portal/overlay/surface DOM and generated heading relationships.

- [ ] **Step 1: Write the failing controlled-portal and ARIA test**

Create `test/react/dialog.test.tsx` with `afterEach(cleanup)` and this first behavior:

```tsx
it("portals the controlled compound anatomy with generated labelling and native surface props", () => {
  const portal = document.createElement("div");
  document.body.append(portal);
  const ref = createRef<HTMLDivElement>();

  render(
    <Dialog open onOpenChange={() => undefined} portalContainer={portal} ref={ref} className="consumer-dialog" data-track="edit">
      <DialogHeading title="Edit photo" subtitle="Update the caption." />
      <DialogFooter><Button>Save</Button></DialogFooter>
    </Dialog>,
  );

  const dialog = within(portal).getByRole("dialog", { name: "Edit photo" });
  expect(ref.current).toBe(dialog);
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveAttribute("data-track", "edit");
  expect(dialog).toHaveClass("base-dialog", "base-dialog-compact", "consumer-dialog");
  expect(within(dialog).getByText("Update the caption.")).toHaveAttribute("id", dialog.getAttribute("aria-describedby"));
  expect(within(dialog).getByRole("button", { name: "Save" })).toBeInTheDocument();
});
```

Add a paired test that `open={false}` renders no Dialog.

- [ ] **Step 2: Run the focused test and verify red**

Run: `pnpm vitest run test/react/dialog.test.tsx`

Expected: FAIL because the placeholder returns `null` while open.

- [ ] **Step 3: Implement the minimal Radix anatomy**

Replace the placeholder with:

```tsx
import { Dialog as DialogPrimitive } from "radix-ui";
import { motion } from "motion/react";

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { children, className, dismissOnBackdrop = true, dismissOnEscape = true, open, onOpenChange, overlayClassName, portalContainer, size = "compact", ...surfaceProps },
  ref,
) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={portalContainer ?? undefined}>
        <DialogPrimitive.Overlay className={["base-dialog-overlay", overlayClassName].filter(Boolean).join(" ")} />
        <DialogPrimitive.Content
          asChild
          onEscapeKeyDown={(event) => { if (!dismissOnEscape) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (!dismissOnBackdrop) event.preventDefault(); }}
        >
          <motion.div
            {...surfaceProps}
            ref={ref}
            className={["base-dialog", `base-dialog-${size}`, className].filter(Boolean).join(" ")}
          >
            {children}
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});
```

Keep primitive-only event props on `DialogPrimitive.Content`, not on the native motion div; structure the final implementation so native props go only to the surface and Radix handlers remain private.

Implement `DialogHeading` with `DialogPrimitive.Title asChild` around `h2` and optional `DialogPrimitive.Description asChild` around `p`. Implement `DialogFooter` as a `div`. Compose package classes before consumer classes.

- [ ] **Step 4: Run the test and verify green**

Run: `pnpm vitest run test/react/dialog.test.tsx`

Expected: PASS for controlled rendering, portal location, generated ARIA, ref, native props, and compound children.

- [ ] **Step 5: Add and pass representative axe coverage**

Add a test rendering a titled/described Dialog with input, link, and footer buttons in each Base theme. Assert `axe(container, { rules: { "color-contrast": { enabled: false } } }).violations` is empty.

Run: `pnpm vitest run test/react/dialog.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the accessible anatomy**

```sh
git add src/components/dialog.tsx test/react/dialog.test.tsx
git commit -m "CLB-693 add the controlled Dialog anatomy"
```

---

### Task 3: Cover focus, dismissal, scroll, and presence behavior

**Files:**

- Modify: `test/react/dialog.test.tsx`
- Modify: `src/components/dialog.tsx`
- Modify: `test/setup.ts`

**Interfaces:**

- Consumes: Radix focus scope, dismissable layer, remove-scroll, and presence lifecycle.
- Produces: Base's `initialFocusRef`, independent dismissal flags, and `onExitComplete` behavior.

- [ ] **Step 1: Write the failing focus-entry and restoration tests**

Add a stateful harness with an opener outside Dialog and two controls inside. Use `userEvent.click` to open. Prove the first control receives focus by default, `initialFocusRef` selects the requested connected control, Tab/Shift+Tab stay within the Dialog, a dynamically mounted control enters normal tab order, and closing returns focus to the opener.

Run: `pnpm vitest run test/react/dialog.test.tsx -t "focus"`

Expected: at least the explicit initial-focus assertion FAILS because the prop is not yet wired.

- [ ] **Step 2: Implement explicit initial focus without replacing Radix defaults**

Pass `onOpenAutoFocus` to the private `DialogPrimitive.Content`. When `initialFocusRef.current` is connected and contained by the content ref, prevent the primitive default and call `focus({ preventScroll: true })`. Otherwise do not prevent the event. Merge the internal content ref with the public forwarded ref through a focused private callback helper; do not export it.

- [ ] **Step 3: Verify focus green**

Run: `pnpm vitest run test/react/dialog.test.tsx -t "focus"`

Expected: PASS for default focus, explicit focus, traversal, dynamic control, and restoration.

- [ ] **Step 4: Write the failing independent-dismissal tests**

Use `userEvent.keyboard("{Escape}")` and real pointer interaction on the overlay/outside surface. Assert defaults call `onOpenChange(false)`, `dismissOnEscape={false}` prevents Escape only, `dismissOnBackdrop={false}` prevents backdrop only, and an inside click never dismisses.

Run: `pnpm vitest run test/react/dialog.test.tsx -t "dismiss"`

Expected: FAIL for at least the disabled branch until primitive events are wired correctly.

- [ ] **Step 5: Implement private dismissal handlers and verify green**

Wire `onEscapeKeyDown` and `onPointerDownOutside` on `DialogPrimitive.Content`, preventing the event only for the disabled route. Keep `onOpenChange` on the controlled root.

Run: `pnpm vitest run test/react/dialog.test.tsx -t "dismiss"`

Expected: PASS.

- [ ] **Step 6: Characterize real scroll lock and restoration**

Add a test that begins with `document.body.style.overflow = "clip"`, opens the real Dialog, observes the primitive's scroll lock effect, then closes/unmounts and expects the original inline value to be restored. If jsdom cannot expose the real primitive side effect, keep the package integration real and assert the observable body lock attribute/style Radix actually applies rather than mocking Radix itself.

Run: `pnpm vitest run test/react/dialog.test.tsx -t "scroll"`

Expected: PASS against the real primitive after the assertion is calibrated to its actual DOM effect.

- [ ] **Step 7: Write the failing exit-presence callback test**

Open a stateful Dialog, close it, assert the closed-state surface remains in the DOM, dispatch one `animationEnd` event from the surface, and expect `onExitComplete` once. Dispatch a bubbled child animation event and assert it does not trigger the callback.

Run: `pnpm vitest run test/react/dialog.test.tsx -t "exit"`

Expected: FAIL because `onExitComplete` is not wired.

- [ ] **Step 8: Implement the package-owned animation-end boundary**

Attach a private `onAnimationEnd` handler to the surface that returns unless `event.target === event.currentTarget` and `currentTarget.dataset.state === "closed"`; then call `onExitComplete`. Keep `onAnimationEnd` omitted from public props.

- [ ] **Step 9: Verify the full behavior file**

Run: `pnpm vitest run test/react/dialog.test.tsx`

Expected: PASS with no console warnings or unhandled errors.

- [ ] **Step 10: Commit the behavior**

```sh
git add src/components/dialog.tsx test/react/dialog.test.tsx test/setup.ts
git commit -m "CLB-693 own Dialog focus and dismissal behavior"
```

---

### Task 4: Add token-driven Dialog styling and motion

**Files:**

- Create: `test/contracts/dialog-css.test.ts`
- Create: `src/styles/components/dialog.css`
- Modify: `scripts/build-css.mjs`
- Modify: `test/contracts/css-build.test.ts`
- Modify: `lab/src/styles.css`
- Modify: `scripts/assert-tarball-contents.mjs`
- Modify: `src/components/dialog.tsx`

**Interfaces:**

- Consumes: existing Base semantic/reference tokens, `easingConfigs.general.ease`, and Motion size layout.
- Produces: `.base-dialog-overlay`, `.base-dialog`, `.base-dialog-compact`, `.base-dialog-wide`, `.base-dialog-heading`, `.base-dialog-title`, `.base-dialog-subtitle`, and `.base-dialog-footer`.

- [ ] **Step 1: Write the failing CSS source/build contract**

Create `test/contracts/dialog-css.test.ts` using PostCSS. Assert:

- every selector is `.base-` scoped;
- there are no product variables/names, Tailwind directives, imports, raw palette colors, or undeclared custom properties;
- overlay is fixed/inset/centered, uses semantic background mixing and two-pixel blur;
- compact and wide max widths are `28rem` and `42rem`;
- surface has `calc(100dvh - 2rem)` max height, vertical scrolling, semantic surface/border/text, `1.25rem` padding, and the approved radius;
- heading/subtitle/footer typography and spacing match the spec;
- open surface keyframes begin at `translateY(4px) scale(0.95)`;
- closed surface keyframes exit at identity transform and zero opacity;
- reduced motion keyframes contain no non-zero translation or non-unit scale and layout transitions are disabled.

Add the Dialog sentinel after ProgressBar in `test/contracts/css-build.test.ts`, the expected lab import, and the packed CSS sentinel.

Run:

```sh
pnpm vitest run test/contracts/dialog-css.test.ts test/contracts/css-build.test.ts
```

Expected: FAIL because the Dialog CSS module and manifest entry do not exist.

- [ ] **Step 2: Add the deterministic Dialog stylesheet**

Create `src/styles/components/dialog.css` beginning with `/* base-component: dialog */`. Implement the exact selectors and keyframes from the spec. Use `color-mix(in srgb, var(--base-color-background-subtle) 74%, transparent)` for the backdrop and existing Base tokens for all other theme-dependent values. Add `pointer-events: none` for closed overlay/surface state.

Append the module to `componentStylePaths` in `scripts/build-css.mjs` and to `lab/src/styles.css` after ProgressBar.

- [ ] **Step 3: Apply the shared easing and opt-in layout**

In `src/components/dialog.tsx`, read `easingConfigs.general.ease` and expose only the computed CSS value on the surface:

```ts
const dialogEase = `cubic-bezier(${easingConfigs.general.ease.join(", ")})`;
```

Merge it into the consumer `style` as `--base-dialog-ease` without overwriting other consumer styles. Use `useReducedMotion()` and set the motion `layout` prop to `"size"` only when `layoutDependency` is provided and reduced motion is false. Pass `layoutDependency` privately and use the shared ease for the layout transition.

Add a behavior assertion that the rendered surface exposes `--base-dialog-ease: cubic-bezier(0.22, 1, 0.36, 1)` while retaining a consumer style property.

- [ ] **Step 4: Run the focused style and behavior tests**

Run:

```sh
pnpm vitest run test/contracts/dialog-css.test.ts test/contracts/css-build.test.ts test/react/dialog.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit styling and motion**

```sh
git add src/components/dialog.tsx src/styles/components/dialog.css scripts/build-css.mjs scripts/assert-tarball-contents.mjs lab/src/styles.css test/contracts test/react/dialog.test.tsx
git commit -m "CLB-693 style and animate the Base Dialog"
```

---

### Task 5: Extend the canonical lab, docs, fixtures, and release note

**Files:**

- Modify: `lab/src/app.tsx`
- Modify: `lab/src/lab.css`
- Modify: `test/react/lab-components.test.tsx`
- Modify: `test/fixtures/vite-smoke/src/main.tsx`
- Modify: `test/fixtures/vite-smoke/package.json`
- Modify: `test/fixtures/vite-smoke/pnpm-lock.yaml`
- Modify: `test/fixtures/next-smoke/app/page.tsx`
- Modify: `test/fixtures/next-smoke/package.json`
- Modify: `test/fixtures/next-smoke/pnpm-lock.yaml`
- Modify: `test/contracts/registry-fixtures.test.ts`
- Modify: `README.md`
- Create: `.changeset/calm-dialogs-arrive.md`

**Interfaces:**

- Consumes: only public imports from `@calebhill/base` and `@calebhill/base/styles.css`.
- Produces: executable compact/wide Dialog specimens, packed consumer builds, usage guidance, and a minor prerelease note.

- [ ] **Step 1: Write the failing lab interaction contract**

Extend `test/react/lab-components.test.tsx` to expect one compact and one wide Dialog trigger, open each with `userEvent`, assert the titled Dialog and form controls exist, close through a public Button, and assert focus returns to the correct trigger. Keep the package-boundary test's CSS source list aligned with `dialog.css`.

Run: `pnpm vitest run test/react/lab-components.test.tsx`

Expected: FAIL because the lab has no Dialog exhibits.

- [ ] **Step 2: Build the lab exhibits**

Add a focused `DialogExhibit` stateful component to `lab/src/app.tsx`. Demonstrate:

- compact default dismissal with two form controls;
- wide Dialog with `dismissOnBackdrop={false}`, dynamic extra content, and `layoutDependency`;
- close actions that call controlled state setters;
- visible guidance for Escape/backdrop policy, focus return, and reduced motion.

Keep all lab styling in `lab/src/lab.css` and all Dialog anatomy in public production components.

- [ ] **Step 3: Verify the lab contract green**

Run: `pnpm vitest run test/react/lab-components.test.tsx`

Expected: PASS, including axe.

- [ ] **Step 4: Extend both packed fixture sources and their exact manifests**

Import all three Dialog runtime exports and all four Dialog type exports in each fixture. Render a closed controlled Dialog composition so SSR/build fixtures exercise declarations without opening a modal at build time. Add exact `motion` to each fixture's dependencies because it is a Base peer. Update `fixtureDependencies`, `runtimeExports`, and `representativeTypes` in `test/contracts/registry-fixtures.test.ts`, then regenerate the fixture lockfiles with frozen exact versions.

Run: `pnpm vitest run test/contracts/registry-fixtures.test.ts`

Expected: PASS.

- [ ] **Step 5: Document consumer setup and Dialog usage**

Update README installation to include `motion`. Add a concise Dialog section showing controlled composition and state that Heading/Footer are Dialog-specific parts, Escape/backdrop are configurable, and consumers do not need a focus hook.

- [ ] **Step 6: Add the minor changeset**

Run: `pnpm changeset`

Select `@calebhill/base` minor and use this summary:

```md
Add the controlled, accessible Dialog system with package-owned focus, dismissal, presence, layout, and reduced-motion behavior.
```

- [ ] **Step 7: Run packed consumer verification**

Run:

```sh
pnpm fixture:test
pnpm test:tarball
```

Expected: PASS for Vite, Next.js, exact files, runtime exports, declarations, CSS, peers, runtime dependencies, and forbidden imports.

- [ ] **Step 8: Commit the consumer-facing slice**

```sh
git add README.md .changeset lab test/fixtures test/contracts/registry-fixtures.test.ts
git commit -m "CLB-693 document and exercise the Dialog system"
```

---

### Task 6: Simplify, visually review, and verify the complete slice

**Files:**

- Review: every file changed from `origin/main...HEAD`
- Modify only if simplification or verification exposes a scoped issue.

**Interfaces:**

- Consumes: the complete CLB-693 diff.
- Produces: review-ready implementation evidence with no unrelated changes.

- [ ] **Step 1: Run the required simplification pass**

Review `git diff origin/main...HEAD` for duplicate helpers, unnecessary public props, leaked dependency types, redundant class composition, stale product names, and avoidable state. Remove only complexity that does not serve the approved contract. Re-run focused tests after every edit.

- [ ] **Step 2: Run the complete automated gate**

Run:

```sh
pnpm verify
pnpm tsc --noEmit
git diff --check origin/main...HEAD
```

Expected: all commands exit 0; Vitest reports zero failing files/tests; package/lab builds, tarball checks, and Vite/Next fixtures pass.

- [ ] **Step 3: Run the canonical lab and perform manual acceptance**

Run: `pnpm lab:dev`

Review the actual lab in a browser at desktop and narrow widths. Verify light/dark rendering, compact/wide layouts, keyboard focus entry/traversal/return, Escape and backdrop settings, long scrollable content, 200 percent zoom, dynamic layout, and reduced-motion emulation. Stop the server afterward.

- [ ] **Step 4: Reconcile the approved spec and Linear acceptance criteria**

Read `docs/superpowers/specs/2026-08-22-dialog-system-design.md` and CLB-693 line by line. Confirm each requirement is implemented or record an explicit gap instead of weakening the claim. Confirm the Figma divergence remains assigned to CLB-707.

- [ ] **Step 5: Commit any final scoped simplification**

If Step 1-4 changed files:

```sh
git add README.md package.json pnpm-lock.yaml scripts src lab test .changeset/calm-dialogs-arrive.md docs/superpowers/plans/2026-08-22-dialog-system.md
git commit -m "CLB-693 simplify and verify the Dialog system"
```

- [ ] **Step 6: Hand off to branch finishing**

Invoke `superpowers:finishing-a-development-branch`, re-run its required verification, open the PR, wait for checks, merge after approval, mark CLB-693 Done, and remove the feature branch/worktree while preserving unrelated work.
