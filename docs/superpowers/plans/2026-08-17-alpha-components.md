# Base Alpha Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the reviewed shared alpha prelude, Button/ButtonLink/icon slice, and TextInput/ProgressBar slice as independently reviewed, mergeable Base package changes.

**Architecture:** A reviewed prelude adds the shared semantic status colors and creates deterministic, empty per-component source slots so CLB-694 and CLB-695 can modify disjoint production files in isolated child worktrees. The component lanes run concurrently after the prelude, then CLB-694 lands first and CLB-695-specific commits are replayed onto the new `main` with only the exact public-export expectation reconciled.

**Tech Stack:** React 19, TypeScript 5.9, CSS custom properties, tsup, Vitest, Testing Library, vitest-axe, PostCSS, pnpm 10.30.3, Changesets.

**Spec:** `docs/superpowers/specs/2026-08-17-alpha-component-slice-design.md`

## Global Constraints

- `DESIGN.md` owns Base boundaries and conflict resolution; accessibility and native-platform requirements block delivery.
- Public custom properties use `--base-`; package-owned classes use `base-`.
- Do not import Next.js, Vercel modules, consumer aliases, product code, product types, or product CSS.
- Published CSS remains framework-independent and requires no consumer Tailwind configuration.
- The public artifact remains `@calebhill/base`, `@calebhill/base/tokens.css`, and `@calebhill/base/styles.css`.
- The token-only entry remains tokens only. The complete stylesheet contains tokens, foundations, and component styles.
- React and React DOM remain peer dependencies. This slice does not add a React animation runtime dependency.
- Preserve native props, refs, keyboard behavior, focus visibility, disabled behavior, reduced motion, and accessible names.
- Begin every behavior change with a focused failing test and record the expected RED before production code.
- Component PRs add minor changesets. Do not publish or version packages in this plan.
- CLB-716 owns the immediate canonical-lab completion; record the temporary specimen divergence in CLB-694 and CLB-695 and do not publish while it exists.
- Icon source is Iconic Free License: `https://iconic.app/iconic-free-license/`; preserve source attribution in code and docs.
- Run `pnpm verify`, a separate `pnpm tsc --noEmit`, and `git diff --check` before each delivery claim.

---

### Task 1: Shared alpha token and source-ownership prelude

**Execution:** Integration worktree on `chill/clb-694-695-alpha-components`.

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `scripts/build-css.mjs`
- Modify: `src/index.ts`
- Modify: `test/contracts/foundations-css.test.ts`
- Modify: `test/contracts/css-build.test.ts`
- Modify: `test/contracts/public-api.test.ts`
- Create: `src/styles/components/button.css`
- Create: `src/styles/components/text-input.css`
- Create: `src/styles/components/progress-bar.css`
- Create: `src/components/button.tsx`
- Create: `src/components/text-input.tsx`
- Create: `src/components/progress-bar.tsx`
- Create: `src/components/icons/more-icon.tsx`
- Create: `src/components/icons/trash-icon.tsx`
- Create: `test/contracts/public-api/button-exports.ts`
- Create: `test/contracts/public-api/primitive-exports.ts`

**Interfaces:**
- Produces semantic properties `--base-color-danger` and `--base-color-danger-subtle`.
- Produces deterministic component stylesheet slots consumed by Tasks 2 and 3.
- Produces empty component module slots re-exported by `src/index.ts`; runtime exports remain unchanged until Tasks 2 and 3 implement them.
- Produces two independent expected-export lists so the component lanes do not edit the same test-support file.

- [ ] **Step 1: Add focused RED contracts for the shared semantic colors**

Extend `test/contracts/foundations-css.test.ts` with exact reference and semantic assertions for:

```ts
const alphaDangerColors = {
  "--base-ref-color-red-50": "#fee4e2",
  "--base-ref-color-red-200": "#ff8a80",
  "--base-ref-color-red-700": "#b42318",
  "--base-ref-color-red-950": "#33120f",
} as const;
```

Assert light aliases map danger to red-700/red-50. Assert dark aliases map danger to red-200/red-950.

Add a local contrast helper and assert both foreground/subtle pairs meet `4.5` using the literal defaults from the spec.

- [ ] **Step 2: Run the semantic-color contract and verify RED**

Run:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts
```

Expected: FAIL because the four reference colors and two semantic aliases do not exist.

- [ ] **Step 3: Implement the exact shared colors**

Add the four `--base-ref-color-*` properties to `:root` in `src/styles/tokens.css`. Add these aliases to the light/default selector:

```css
--base-color-danger: var(--base-ref-color-red-700);
--base-color-danger-subtle: var(--base-ref-color-red-50);
```

Add these aliases to the dark selector:

```css
--base-color-danger: var(--base-ref-color-red-200);
--base-color-danger-subtle: var(--base-ref-color-red-950);
```

- [ ] **Step 4: Run the semantic-color contract and verify GREEN**

Run the focused Vitest command from Step 2. Expected: PASS with the new contrast and alias assertions green.

- [ ] **Step 5: Add RED contracts for deterministic component CSS assembly**

Update `test/contracts/css-build.test.ts` so `dist/styles.css` must contain these sentinels in order after existing foundation CSS:

```css
/* base-component: button */
/* base-component: text-input */
/* base-component: progress-bar */
```

Assert `dist/tokens.css` contains none of the three sentinels.

- [ ] **Step 6: Run the CSS build contract and verify RED**

Run:

```sh
pnpm build
pnpm exec vitest run test/contracts/css-build.test.ts
```

Expected: FAIL because the component source files and manifest are absent.

- [ ] **Step 7: Create the deterministic component CSS slots**

Create each component CSS file with only its exact sentinel comment. Replace `scripts/build-css.mjs` with an explicit manifest that reads tokens, foundations, then:

```js
const componentStylePaths = [
  new URL("../src/styles/components/button.css", import.meta.url),
  new URL("../src/styles/components/text-input.css", import.meta.url),
  new URL("../src/styles/components/progress-bar.css", import.meta.url),
];
```

Read every path with `Promise.all`, join component contents with two newlines, write tokens unchanged to `dist/tokens.css`, and write tokens, foundations, and components in that order to `dist/styles.css`. Do not catch missing-file errors.

- [ ] **Step 8: Run the CSS build contract and verify GREEN**

Run the commands from Step 6. Expected: build succeeds and the CSS contract passes.

- [ ] **Step 9: Add RED public-barrel ownership contracts**

Create `button-exports.ts` and `primitive-exports.ts` with these exact test-support interfaces:

```ts
export const buttonRuntimeExports = [] as const;
```

```ts
export const primitiveRuntimeExports = [] as const;
```

Update `test/contracts/public-api.test.ts` to concatenate the foundation names with those two arrays for its exact runtime-surface assertion. Add re-exports to `src/index.ts` for every empty component/icon module. Add an assertion that the runtime surface is still exactly `BASE_THEME_ATTRIBUTE` and `isBaseTheme`.

Run:

```sh
pnpm exec vitest run test/contracts/public-api.test.ts
```

Expected RED before the module slots exist: TypeScript/Vite cannot resolve the five component paths.

- [ ] **Step 10: Create empty component module slots and verify GREEN**

Create the five `.tsx` files with:

```ts
export {};
```

Run the focused public API test. Expected: PASS and no new runtime exports.

- [ ] **Step 11: Verify and commit the shared prelude**

Run:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts test/contracts/css-build.test.ts test/contracts/public-api.test.ts
pnpm verify
pnpm tsc --noEmit
git diff --check
```

Commit:

```sh
git add src scripts test
git commit -m "feat: establish alpha component contract"
```

### Task 2: CLB-694 Button, ButtonLink, and icons

**Execution:** Fork `chill/clb-694-actions` from the reviewed Task 1 commit into its own worktree. Do not edit any CLB-695-owned source or expected-export file.

**Files:**
- Modify: `src/components/button.tsx`
- Modify: `src/components/icons/more-icon.tsx`
- Modify: `src/components/icons/trash-icon.tsx`
- Modify: `src/styles/components/button.css`
- Modify: `test/contracts/public-api/button-exports.ts`
- Create: `test/react/button.test.tsx`
- Create: `test/contracts/button-types.test.tsx`
- Create: `test/contracts/icon-license.test.ts`
- Create: `.changeset/brave-actions-arrive.md`

**Interfaces:**
- Produces runtime exports `Button`, `ButtonLink`, `MoreIcon`, and `TrashIcon`.
- Produces type exports `ButtonProps`, `ButtonLinkProps`, `ButtonVariant`, and `ButtonSize`.
- Consumes the Task 1 danger aliases and existing Base focus/press/type foundations.
- Uses package-owned classes `base-button`; `base-button-primary`, `base-button-secondary`, `base-button-subtle`, `base-button-destructive`, `base-button-text`, `base-button-text-accent`; and `base-button-default`, `base-button-icon`.

- [ ] **Step 1: Write the Button/ButtonLink RED behavior tests**

Create `test/react/button.test.tsx` with focused tests that render real public components and assert:

```tsx
const ref = createRef<HTMLButtonElement>();
render(<Button ref={ref}>Save</Button>);
expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
expect(ref.current).toHaveAttribute("type", "button");
expect(ref.current).toHaveClass(
  "base-button",
  "base-button-primary",
  "base-button-default",
  "base-focus-ring",
  "base-pressable",
  "base-type-action",
);
```

Cover all six variants with `it.each`, both sizes, consumer `className`, native data attributes, button click behavior, native `disabled` click suppression, ButtonLink ref/href/native props, and axe-clean representative light/dark compositions.

- [ ] **Step 2: Write the public type RED contract**

Create `test/contracts/button-types.test.tsx` with valid default/icon examples and these expected compile failures:

```tsx
// @ts-expect-error icon Button requires aria-label
const unnamedButton = <Button size="icon"><MoreIcon /></Button>;

// @ts-expect-error icon ButtonLink requires aria-label
const unnamedLink = <ButtonLink href="#x" size="icon"><MoreIcon /></ButtonLink>;

// @ts-expect-error ButtonLink deliberately does not expose disabled
const disabledLink = <ButtonLink href="#x" disabled>Unavailable</ButtonLink>;
```

Assert valid components accept native handlers, attributes, refs, and labeled icon controls.

- [ ] **Step 3: Run Button tests and verify RED**

Run:

```sh
pnpm exec vitest run test/react/button.test.tsx
pnpm tsc --noEmit
```

Expected: runtime imports are absent and the valid type examples cannot compile against empty modules.

- [ ] **Step 4: Implement the minimal public Button API**

In `src/components/button.tsx`, define the exact variants/sizes from the spec. Use `Omit<..., "aria-label">` with this size union for both native element prop families:

```ts
type AccessibleSize =
  | { size: "icon"; "aria-label": string }
  | { size?: "default"; "aria-label"?: string };
```

For ButtonLink also omit `"aria-disabled"` and do not add `disabled`. Implement both with `forwardRef`. Preserve consumer props and concatenate the exact class list. Button defaults `type` to `button`; ButtonLink preserves href behavior without custom routing or click interception.

- [ ] **Step 5: Implement the exact Button CSS**

Replace the button sentinel-only file with the sentinel plus styles for:

- common inline-flex centering, pill radius, no wrapping, 40px default height, 36px icon square, 20px default inline padding, 4px gap, pointer cursor, selection suppression, and no inherited text decoration;
- primary: text-primary background with background foreground; fine-hover opacity `0.85`;
- secondary: semantic border/surface/text with surface-hover and surface-active states;
- subtle: surface-hover/text with surface-active hover/active;
- destructive: danger-subtle/danger with fine-hover opacity `0.85`;
- text: transparent background and secondary text lifting to primary;
- text-accent: transparent background and accent lifting to accent-hover;
- native disabled Button: default cursor, disabled foreground, disabled surface, standard border where applicable, no hover or active feedback;
- focus/press/type behavior through the composed foundation classes rather than duplicated declarations.

Guard hover rules with `@media (hover: hover) and (pointer: fine)`. Do not add global selectors or product variables.

- [ ] **Step 6: Implement MoreIcon and TrashIcon**

Port only the two proven 24px Iconic SVG paths from `photos.me`. Each component accepts `SVGProps<SVGSVGElement>`, defaults `width`, `height`, `viewBox`, `fill`, `aria-hidden`, and `focusable`, then spreads props so deliberate consumer overrides work. Preserve `currentColor`, stroke widths, caps, joins, and path data exactly. Add source and Free License links in comments.

- [ ] **Step 7: Expose only the approved action exports**

Set `buttonRuntimeExports` in `test/contracts/public-api/button-exports.ts` to:

```ts
export const buttonRuntimeExports = [
  "Button",
  "ButtonLink",
  "MoreIcon",
  "TrashIcon",
] as const;
```

Task 1 names this list `buttonRuntimeExports`; update that exact array and leave the root test composition unchanged. Do not add runtime constants for variant or size values.

- [ ] **Step 8: Verify GREEN and accessibility**

Run:

```sh
pnpm exec vitest run test/react/button.test.tsx test/contracts/public-api.test.ts
pnpm tsc --noEmit
```

Expected: all action behavior, accessibility, public surface, and type contracts pass.

- [ ] **Step 9: Add and verify the icon license contract**

Create `test/contracts/icon-license.test.ts` that reads both icon modules and asserts each contains `https://iconic.app/` and `https://iconic.app/iconic-free-license/`. Assert the two source modules are the only files under `src/components/icons` for this slice.

Run:

```sh
pnpm exec vitest run test/contracts/icon-license.test.ts
```

Expected: PASS.

- [ ] **Step 10: Add the CLB-694 changeset**

Run `pnpm changeset`, select `@calebhill/base`, choose minor, and use:

```md
Add Button, ButtonLink, MoreIcon, and TrashIcon as the first accessible Base action primitives.
```

- [ ] **Step 11: Verify and commit CLB-694**

Run:

```sh
pnpm verify
pnpm tsc --noEmit
git diff --check
```

Commit the focused implementation:

```sh
git add src test .changeset
git commit -m "feat: add Base action primitives"
```

Record in Linear that canonical lab specimens are temporarily owned by CLB-716 and publication remains blocked.

### Task 3: CLB-695 TextInput and ProgressBar

**Execution:** Fork `chill/clb-695-primitives` from the reviewed Task 1 commit into its own worktree. Do not edit Button/icon source or the Button expected-export file.

**Files:**
- Modify: `src/components/text-input.tsx`
- Modify: `src/components/progress-bar.tsx`
- Modify: `src/styles/components/text-input.css`
- Modify: `src/styles/components/progress-bar.css`
- Modify: `test/contracts/public-api/primitive-exports.ts`
- Create: `test/react/text-input.test.tsx`
- Create: `test/react/progress-bar.test.tsx`
- Create: `test/contracts/primitive-types.test.tsx`
- Create: `.changeset/calm-primitives-grow.md`

**Interfaces:**
- Produces runtime exports `TextInput` and `ProgressBar`.
- Produces type exports `TextInputProps` and `ProgressBarProps`.
- Consumes the Task 1 danger pair and existing Base type/focus/duration foundations.
- Uses package-owned classes rooted at `base-text-input` and `base-progress-bar`.

- [ ] **Step 1: Write TextInput RED tests**

Create `test/react/text-input.test.tsx`. Cover ref/native props/className, no-error state, error state, alert semantics, and exact description composition:

```tsx
render(
  <TextInput
    aria-describedby="hint-one hint-two"
    aria-label="Caption"
    error="Caption is required"
    ref={ref}
  />,
);
const input = screen.getByRole("textbox", { name: "Caption" });
const error = screen.getByRole("alert");
expect(input).toHaveAttribute("aria-invalid", "true");
expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual([
  "hint-one",
  "hint-two",
  error.id,
]);
```

Include disabled and axe-clean light/dark examples.

- [ ] **Step 2: Write ProgressBar RED tests**

Create `test/react/progress-bar.test.tsx`. Use `it.each` for `-20 -> 0`, `0 -> 0`, `45 -> 45`, `140 -> 100`, `NaN -> 0`, `Infinity -> 0`, and `-Infinity -> 0`. Assert role, accessible name, min/max/now, ref/native props/className, `aria-valuetext`, and fill transform.

- [ ] **Step 3: Write the primitive type RED contract**

Create `test/contracts/primitive-types.test.tsx` with valid native/ref examples and expected errors for a ProgressBar with no accessible name and a ProgressBar with two name routes:

```tsx
// @ts-expect-error ProgressBar requires exactly one accessible-name route
const unnamed = <ProgressBar value={50} />;

// @ts-expect-error label and aria-label are mutually exclusive
const doubleNamed = <ProgressBar value={50} label="Upload" aria-label="Upload" />;
```

- [ ] **Step 4: Run focused tests and verify RED**

Run:

```sh
pnpm exec vitest run test/react/text-input.test.tsx test/react/progress-bar.test.tsx
pnpm tsc --noEmit
```

Expected: imports are absent and valid type examples cannot compile against empty modules.

- [ ] **Step 5: Implement TextInput**

Use `forwardRef<HTMLInputElement, TextInputProps>`. Preserve native props. Compose consumer `aria-describedby` tokens followed by the generated error ID. Render a wrapper class `base-text-input`, input classes `base-text-input-field base-type-input base-focus-ring`, and an error paragraph `base-text-input-error base-type-caption` with `role="alert"`. Do not add wrapper customization or validation policy.

Implement CSS for the proven 48px pill input: semantic border/surface/text/caret/placeholder, fine-hover border, two-pixel focus/filled/error border, visible semantic focus/danger outline, disabled surface/text/placeholder, and fast semantic transitions. Use only package tokens and capability-guarded hover.

- [ ] **Step 6: Implement ProgressBar**

Define three mutually exclusive accessible-name branches exactly as the spec describes. Omit children and Base-owned ARIA value attributes from native div props. Normalize finite values with `Math.min(100, Math.max(0, value))`; return 0 for non-finite values. Render the named root and a hidden/decorative fill element with `scaleX(normalized / 100)`.

Implement CSS with a 6px pill track using surface-disabled, an accent-independent primary-text fill, transform origin left, linear transform transition over the standard duration, and no transition under reduced motion.

- [ ] **Step 7: Expose only the approved primitive exports**

Set `primitiveRuntimeExports` to:

```ts
export const primitiveRuntimeExports = [
  "ProgressBar",
  "TextInput",
] as const;
```

Do not export normalization, class composition, label maps, or status arrays at runtime.

- [ ] **Step 8: Verify GREEN and accessibility**

Run:

```sh
pnpm exec vitest run test/react/text-input.test.tsx test/react/progress-bar.test.tsx test/contracts/public-api.test.ts
pnpm tsc --noEmit
```

Expected: all primitive behavior, accessibility, public surface, and type contracts pass.

- [ ] **Step 9: Add the CLB-695 changeset**

Run `pnpm changeset`, select `@calebhill/base`, choose minor, and use:

```md
Add TextInput and ProgressBar as accessible Base input and feedback primitives.
```

- [ ] **Step 10: Verify and commit CLB-695**

Run:

```sh
pnpm verify
pnpm tsc --noEmit
git diff --check
```

Commit:

```sh
git add src test .changeset
git commit -m "feat: add Base input and feedback primitives"
```

Record in Linear that canonical lab specimens are temporarily owned by CLB-716 and publication remains blocked.

### Task 4: Integrate, deliver, and re-verify both component slices

**Execution:** Controller-owned delivery after independent task reviews are clean. No implementation agent performs external delivery.

**Files:**
- Reconcile: `test/contracts/public-api.test.ts`
- Verify unchanged action list: `test/contracts/public-api/button-exports.ts`
- Reconcile primitive list: `test/contracts/public-api/primitive-exports.ts`
- Verify: all changed source, tests, changesets, packed fixture, and generated CSS.

**Interfaces:**
- Consumes reviewed Task 1, Task 2, and Task 3 commits.
- Produces merged `main` with both component slices and no temporary branch-only API differences.

- [ ] **Step 1: Deliver CLB-694 first**

Assemble Task 1 plus Task 2 on the CLB-694 delivery branch. Run the simplification pass, final whole-branch review, `pnpm verify`, and separate TypeScript check. Push, open the CLB-694 PR, wait for green CI, merge the exact reviewed head, mark CLB-694 Done, and clean only its branch/worktree.

- [ ] **Step 2: Replay CLB-695-specific commits onto merged main**

Create or refresh the CLB-695 delivery worktree from the new `main`. Cherry-pick only the Task 3 implementation commits because Task 1 is already present through CLB-694. Resolve the expected public runtime list so it includes foundation, action, and primitive exports exactly once.

- [ ] **Step 3: Verify the integrated CLB-695 tree**

Run:

```sh
pnpm exec vitest run test/contracts/public-api.test.ts test/react/button.test.tsx test/react/text-input.test.tsx test/react/progress-bar.test.tsx
pnpm verify
pnpm tsc --noEmit
git diff --check
```

Expected: the full alpha component surface is green together.

- [ ] **Step 4: Deliver CLB-695**

Run the simplification pass and final whole-branch review. Push, open the CLB-695 PR, wait for green CI, merge the exact reviewed head, mark CLB-695 Done, and clean only its branch/worktree.

- [ ] **Step 5: Confirm the next dependency wave is unblocked**

Verify in Linear that CLB-716 and CLB-717 have no remaining incomplete blockers. Move both to In Progress with their existing estimates and record the merged component PRs. Do not begin publication until both issues are Done.
