# Base ActionMenu System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a project-agnostic, accessible ActionMenu that is visually and behaviorally faithful to the proven photos.me menu.

**Architecture:** Wrap Radix DropdownMenu behind one typed Base component. Base owns the composite public API, semantic styles, shared-motion application, selection handoff, lab documentation, and parity harness; Radix owns menu semantics, roving focus, dismissal, portal presence, and collision-aware positioning.

**Tech Stack:** React 19, TypeScript 5.9, Radix DropdownMenu through `radix-ui`, Motion 13, `@calebhill/animations`, Vitest, Testing Library, PostCSS, Vite lab.

**Spec:** `docs/superpowers/specs/2026-08-26-action-menu-system-design.md`

## Global Constraints

- Keep product state, photo types, routing, canvas behavior, Tailwind, Next.js, and Vercel outside `src/`.
- Preserve the photos.me reference geometry: 36 px trigger, 8 px gap, 144 px minimum menu width, 4 px surface padding, 16 px surface radius, 40 px item height, 12 px item padding and radius.
- Preserve reference motion: 4 px/0.95 surface entry, 3 px/0.95 item entry, 180 ms opacity, 30 ms child delay, 40 ms stagger, 120 ms exit, and opacity-only reduced motion.
- Consume existing Base semantic tokens and shared `@calebhill/animations` values; add no public token and export no Radix or Motion type.
- Behavior changes use strict red-green-refactor. Run the focused failing test before each production change.
- The lab-only parity reference must never enter package runtime exports, public CSS, metadata, or the tarball.
- The public change requires a minor changeset, canonical lab document, README example, packed fixture verification, `pnpm verify`, and `pnpm tsc --noEmit`.

---

### Task 1: Lock the public ActionMenu contract

**Files:**
- Create: `test/contracts/public-api/action-menu-exports.ts`
- Create: `test/contracts/action-menu-types.test.tsx`
- Modify: `test/contracts/public-api.test.ts`
- Create: `src/components/action-menu.tsx`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `Button`, `ButtonProps`, `DropdownMenu` from `radix-ui`.
- Produces: `ActionMenu`, `ActionMenuProps`, `ActionMenuItem`, `ActionMenuItemTone`, `ActionMenuSide`, and `ActionMenuAlign`.

- [ ] **Step 1: Write the failing runtime-export test**

Add `actionMenuRuntimeExports = ["ActionMenu"] as const` and include it in the exact `runtimeExports` list. The production change that makes this pass is exporting the new component from `src/index.ts`.

- [ ] **Step 2: Write the failing type-contract test**

Create compile-time specimens covering uncontrolled, controlled, portal, placement, root native props, trigger ref, destructive and disabled items, plus `@ts-expect-error` cases for missing controlled `onOpenChange`, simultaneous `open` and `defaultOpen`, rich labels, and package-owned children.

```tsx
const valid = (
  <ActionMenu
    ref={triggerRef}
    label="Photo options"
    icon={<MoreIcon />}
    items={[
      { label: "Edit", onSelect: () => undefined },
      { label: "Delete", tone: "destructive", onSelect: () => undefined },
      { label: "Unavailable", disabled: true, onSelect: () => undefined },
    ]}
    side="top"
    align="end"
    sideOffset={8}
    portalContainer={portal}
  />
);
```

- [ ] **Step 3: Verify both contract tests fail for missing production exports**

Run: `pnpm vitest run test/contracts/public-api.test.ts test/contracts/action-menu-types.test.tsx`

Expected: FAIL because `ActionMenu` and its types are not exported.

- [ ] **Step 4: Add the minimal typed component shell and public export**

Define the exact discriminated controlled/uncontrolled contract from the spec. Render a Base icon Button as a Radix trigger, render string-labelled items in a Radix portal, forward the ref to the button, compose root attributes, and keep all Radix types private.

```tsx
const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
const resolvedOpen = open ?? uncontrolledOpen;
const setOpen = (nextOpen: boolean) => {
  if (open === undefined) setUncontrolledOpen(nextOpen);
  onOpenChange?.(nextOpen);
};

<DropdownMenu.Root open={resolvedOpen} onOpenChange={setOpen}>
  <DropdownMenu.Trigger asChild>
    <Button ref={ref} aria-label={label} size="icon" variant="text">
      <span aria-hidden="true">{icon}</span>
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal container={portalContainer ?? undefined}>
    <DropdownMenu.Content aria-label={label} align={align} side={side} sideOffset={sideOffset}>
      {items.map((item) => (
        <DropdownMenu.Item disabled={item.disabled} key={item.label}>
          {item.label}
        </DropdownMenu.Item>
      ))}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

- [ ] **Step 5: Verify the focused contract tests pass**

Run: `pnpm vitest run test/contracts/public-api.test.ts test/contracts/action-menu-types.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the public contract slice**

```bash
git add src/components/action-menu.tsx src/index.ts test/contracts/action-menu-types.test.tsx test/contracts/public-api.test.ts test/contracts/public-api/action-menu-exports.ts
git commit -m "feat: add the ActionMenu public contract"
```

### Task 2: Own menu interaction, disabled state, and selection handoff

**Files:**
- Create: `test/react/action-menu.test.tsx`
- Modify: `src/components/action-menu.tsx`

**Interfaces:**
- Consumes: the Task 1 `ActionMenu` API and Radix menu behavior.
- Produces: pointer and keyboard operation, disabled-item enforcement, controlled state, portal placement, focus return, and exactly-once selection handoff.

- [ ] **Step 1: Write the failing anatomy and state tests**

Test real rendered behavior: the trigger has the supplied accessible name and forwarded ref; uncontrolled click opens a labelled menu in a custom portal; controlled `open` renders and `onOpenChange(false)` observes Escape.

- [ ] **Step 2: Run the anatomy tests and confirm the expected failures**

Run: `pnpm vitest run test/react/action-menu.test.tsx -t "anatomy|state"`

Expected: FAIL on missing portal/ref/state behavior not yet implemented by the minimal shell.

- [ ] **Step 3: Implement only the anatomy and state behavior**

Compose root `className`, `style`, and data props on `.base-action-menu-root`; pass `side`, `align`, `sideOffset`, and `portalContainer`; keep the trigger icon decorative; connect the discriminated state handler.

- [ ] **Step 4: Run the anatomy tests to green**

Run: `pnpm vitest run test/react/action-menu.test.tsx -t "anatomy|state"`

Expected: PASS.

- [ ] **Step 5: Write failing keyboard and disabled-item tests**

Cover Arrow Down and Up entry, Arrow navigation, Home, End, wrapping, typeahead, Enter activation, disabled-item skipping, and disabled-item pointer protection. Assert focused real menuitems rather than Radix internals.

- [ ] **Step 6: Run the keyboard tests and confirm the expected failures**

Run: `pnpm vitest run test/react/action-menu.test.tsx -t "keyboard|disabled"`

Expected: FAIL until items use the correct Radix item contract and disabled state.

- [ ] **Step 7: Implement the typed item behavior**

Render each item through `DropdownMenu.Item asChild`, put `disabled` on the primitive, apply `data-tone`, and keep consumer callbacks out of direct click handlers so keyboard and pointer activation share the same selection route.

- [ ] **Step 8: Run keyboard and disabled tests to green**

Run: `pnpm vitest run test/react/action-menu.test.tsx -t "keyboard|disabled"`

Expected: PASS.

- [ ] **Step 9: Write the failing focus-restoration and handoff tests**

Open from a real trigger, choose an item whose callback opens a Base Dialog, and assert the menu trigger receives focus before the callback runs while Dialog ultimately receives its correct initial focus. Also cover Escape/outside cancellation and one callback for repeated close lifecycle events.

- [ ] **Step 10: Run the handoff tests and confirm callback timing fails**

Run: `pnpm vitest run test/react/action-menu.test.tsx -t "handoff|restores"`

Expected: FAIL because Task 1 invokes selection directly or does not coordinate close focus.

- [ ] **Step 11: Implement the minimal selection handoff**

Store the first callback in `pendingSelectionRef`, let Radix request close, and use `onCloseAutoFocus` to queue exactly one callback after the primitive completes focus restoration. Clear the pending callback on non-selection dismissal and unmount.

- [ ] **Step 12: Run all ActionMenu React tests and accessibility checks**

Add axe coverage for representative light and dark menus, then run:

`pnpm vitest run test/react/action-menu.test.tsx`

Expected: PASS with no violations or console warnings.

- [ ] **Step 13: Commit the behavior slice**

```bash
git add src/components/action-menu.tsx test/react/action-menu.test.tsx
git commit -m "feat: own ActionMenu interaction behavior"
```

### Task 3: Match the photos.me visual and motion contract

**Files:**
- Create: `test/contracts/action-menu-css.test.ts`
- Create: `src/styles/components/action-menu.css`
- Modify: `src/components/action-menu.tsx`
- Modify: `scripts/build-css.mjs`
- Modify: `lab/src/styles.css`
- Modify: `test/contracts/css-build.test.ts`

**Interfaces:**
- Consumes: Task 2 anatomy plus `springConfigs.press` and shared easing from `@calebhill/animations`.
- Produces: Base-scoped parity geometry, theme styles, state styles, standard motion, reduced motion, and aggregate stylesheet inclusion.

- [ ] **Step 1: Write the failing CSS contract tests**

Parse `action-menu.css` and assert the hand-derived parity literals: 2.25 rem trigger, 0.5 rem offset contract, 9 rem minimum width, 0.25 rem padding, 1 rem surface radius, 2.5 rem item height, 0.75 rem item padding/radius, action typography, reference shadow, semantic colors, disabled state, fine-pointer hover, focus-visible treatment, and reduced-motion rules. Reject non-Base variables, global selectors, product names, and Tailwind directives.

- [ ] **Step 2: Verify the CSS test fails because the stylesheet is missing**

Run: `pnpm vitest run test/contracts/action-menu-css.test.ts`

Expected: FAIL reading `src/styles/components/action-menu.css`.

- [ ] **Step 3: Implement the minimal parity stylesheet**

Use `.base-action-menu-*` selectors only. Express Tailwind `shadow-lg` as `0 10px 15px -3px rgb(0 0 0 / 10%), 0 4px 6px -4px rgb(0 0 0 / 10%)`, with the neutral reference color through `color-mix`. Use the existing Base action typography values and semantic color properties.

- [ ] **Step 4: Run the CSS contract to green**

Run: `pnpm vitest run test/contracts/action-menu-css.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing motion assertions in the React test**

Assert the surface and item motion styles/attributes use the approved open/closed variants, transform origins supplied by Radix, and no spatial transforms when reduced motion is active.

- [ ] **Step 6: Run the focused motion tests and confirm expected failures**

Run: `pnpm vitest run test/react/action-menu.test.tsx -t "motion"`

Expected: FAIL because the component is not yet a Motion variant tree.

- [ ] **Step 7: Implement shared motion variants**

Use `motion.div` for content and `motion.button` for items. Read `useReducedMotion()`, source `springConfigs.press` and easing from `@calebhill/animations`, and apply the exact surface/item distances, durations, delays, and stagger from the spec. Keep Motion types private.

- [ ] **Step 8: Add the stylesheet to every aggregate and its exact-order contract**

Append `action-menu.css` after Dialog in `scripts/build-css.mjs`, `lab/src/styles.css`, and `componentStyleSentinels`/expected imports in `test/contracts/css-build.test.ts`.

- [ ] **Step 9: Run component, CSS-build, and aggregate tests**

Run: `pnpm vitest run test/react/action-menu.test.tsx test/contracts/action-menu-css.test.ts test/contracts/css-build.test.ts`

Expected: PASS.

- [ ] **Step 10: Commit the visual and motion slice**

```bash
git add src/components/action-menu.tsx src/styles/components/action-menu.css scripts/build-css.mjs lab/src/styles.css test/contracts/action-menu-css.test.ts test/contracts/css-build.test.ts test/react/action-menu.test.tsx
git commit -m "feat: match the ActionMenu visual language"
```

### Task 4: Add the canonical lab document and parity harness

**Files:**
- Create: `lab/src/documents/action-menu.tsx`
- Create: `lab/src/components/action-menu-parity-reference.tsx`
- Modify: `lab/src/component-registry.tsx`
- Modify: `lab/src/lab.css`
- Modify: `test/react/lab-documents.test.tsx`
- Modify: `test/react/lab-components.test.tsx`

**Interfaces:**
- Consumes: the Task 3 public ActionMenu and stylesheet.
- Produces: beta public documentation plus a lab-only reference comparison for identical state and theme review.

- [ ] **Step 1: Write failing registry and document tests**

Add `/components/action-menu` to the exact registry inventory and component document table. Assert the page renders Edit, Delete, and disabled items from the public package; lists controlled state, placement, portal, and item props; and includes keyboard/focus/reduced-motion accessibility notes.

- [ ] **Step 2: Run the focused lab tests and confirm missing-document failures**

Run: `pnpm vitest run test/react/lab-documents.test.tsx test/react/lab-components.test.tsx -t "ActionMenu|navigation"`

Expected: FAIL because the registry and document are absent.

- [ ] **Step 3: Implement the focused public document**

Follow existing `DocumentHeader`, `Specimen`, `CodeSample`, `PropsTable`, and `AccessibilityNotes` patterns. Use `MoreIcon`, real selection state text, both themes, and fixed specimen geometry that makes the open surface easy to review.

- [ ] **Step 4: Run focused lab tests to green**

Run: `pnpm vitest run test/react/lab-documents.test.tsx test/react/lab-components.test.tsx -t "ActionMenu|navigation"`

Expected: PASS.

- [ ] **Step 5: Write the failing parity-harness boundary test**

Assert a labelled `photos.me reference` specimen and `Base ActionMenu` specimen exist in the document, but `ActionMenuParityReference` and lab-only parity class names do not appear in `src/`, package metadata, dist exports, or public component CSS.

- [ ] **Step 6: Implement the lab-only parity reference**

Reproduce only the source DOM and resolved visual values required for comparison. Give both specimens identical token values, 1× scale, menu content, open state, placement, and state controls. Add `data-parity-target="reference" | "base"` hooks for screenshot bounds and computed-style capture.

- [ ] **Step 7: Run all lab tests and lab build**

Run: `pnpm vitest run test/react/lab-documents.test.tsx test/react/lab-components.test.tsx`

Run: `pnpm lab:build`

Expected: both PASS.

- [ ] **Step 8: Commit the documentation and parity slice**

```bash
git add lab/src/documents/action-menu.tsx lab/src/components/action-menu-parity-reference.tsx lab/src/component-registry.tsx lab/src/lab.css test/react/lab-documents.test.tsx test/react/lab-components.test.tsx
git commit -m "docs: add the ActionMenu parity lab"
```

### Task 5: Complete consumer documentation and release contracts

**Files:**
- Modify: `README.md`
- Create: `.changeset/calm-menus-open.md`
- Modify: `test/contracts/packed-package.test.ts`
- Modify: `test/fixtures/vite-smoke/src/main.tsx`
- Modify: `test/fixtures/next-smoke/app/page.tsx`

**Interfaces:**
- Consumes: the complete public ActionMenu API.
- Produces: package guidance, minor release metadata, and packed consumer compilation/rendering evidence.

- [ ] **Step 1: Write failing packed/runtime assertions for ActionMenu**

Extend the hand-built valid package fixture and exact runtime/declaration lists with ActionMenu. Add a representative ActionMenu render to both packed smoke fixtures so missing JS, declarations, CSS, or peer/runtime dependencies fail a real consumer build.

- [ ] **Step 2: Run packed and fixture tests and confirm the missing-artifact failures**

Run: `pnpm vitest run test/contracts/packed-package.test.ts`

Run: `pnpm fixture:test`

Expected: FAIL until runtime declarations, styles, and fixture usage align.

- [ ] **Step 3: Complete package artifact integration**

Add `ActionMenu` to the exact runtime export fixture, add its five public types to the declaration fixture, and add the ActionMenu stylesheet sentinel to the valid packed stylesheet fixture. Keep runtime dependencies unchanged because Radix, Motion, and `@calebhill/animations` are already declared.

- [ ] **Step 4: Add README guidance and a minor changeset**

Document one concise typed-items example, placement defaults, keyboard/focus behavior, and the controlled-state escape hatch. Create a minor changeset for `@calebhill/base` describing the beta ActionMenu API and parity with photos.me.

- [ ] **Step 5: Run package and fixture tests to green**

Run: `pnpm vitest run test/contracts/packed-package.test.ts`

Run: `pnpm fixture:test`

Expected: PASS.

- [ ] **Step 6: Commit the consumer and release slice**

```bash
git add README.md .changeset test/contracts/packed-package.test.ts test/fixtures/vite-smoke/src/main.tsx test/fixtures/next-smoke/app/page.tsx
git commit -m "docs: prepare ActionMenu for consumers"
```

### Task 6: Verify pixel parity and finish the branch

**Files:**
- Modify only when verification reveals a tested discrepancy.
- Create local evidence under `.tmp/action-menu-parity/` only; do not commit generated screenshots.

**Interfaces:**
- Consumes: complete implementation and lab parity targets.
- Produces: screenshot/computed-style evidence, simplified code, and a fully verified delivery branch.

- [ ] **Step 1: Run the repository simplification pass**

Review the diff for unnecessary public props, duplicated state, helper abstractions, repeated styles, and consumer leakage. Make only behavior-preserving simplifications and re-run their focused tests.

- [ ] **Step 2: Start and verify the lab server**

Run: `pnpm lab:dev --host 127.0.0.1`

Use agent-browser to open `http://127.0.0.1:5173/#/components/action-menu`, wait for network idle, reject blank content or Vite overlays, inspect interactive elements, and capture the initial document screenshot.

- [ ] **Step 3: Capture the parity matrix**

At identical viewport, zoom, and DPR, capture reference and Base bounds/computed styles and screenshots in light and dark themes for open, hovered, focused, destructive, disabled, and closing states. Correct any unintended non-zero difference through a new failing contract/behavior test before code changes.

- [ ] **Step 4: Verify manual interaction requirements**

Exercise pointer selection, Arrow Down and Up entry, roving focus, Home, End, typeahead, Escape, outside click, focus return, collision flip, scroll repositioning, 200 percent zoom, and reduced motion. Check the browser console and error overlay after interaction.

- [ ] **Step 5: Run the full fresh verification gates**

Run: `pnpm verify`

Run: `pnpm tsc --noEmit`

Run: `git diff --check`

Expected: every command exits 0 with no test failures, TypeScript errors, lint errors, build failures, package contract failures, or fixture failures.

- [ ] **Step 6: Commit any final verified simplification or parity correction**

Stage only the explicit CLB-696 files and use a scoped commit message. Do not stage `.tmp/`, `dist/`, coverage, or unrelated work.

- [ ] **Step 7: Use the finishing-a-development-branch workflow**

Re-run the required tests, confirm this named worktree forks from `main`, and present the standard three integration options. For a PR, push `chill/clb-696-action-menu`, create the PR against `main`, wait for checks, then follow the repository release, Linear Done, and cleanup workflow only after merge.
