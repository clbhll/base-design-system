# Base Alpha Component Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the canonical front-facing review surface for every public Base alpha component while keeping `StatusTag` strictly local to the documentation lab.

**Architecture:** Extend the existing Vite lab through `@calebhill/base` public imports only. Keep consumable markup inside production components; place the documentation-only lifecycle tag and its colors under `lab/src/`. Automated DOM, import-boundary, CSS, and accessibility contracts protect the lab, while manual visual review covers responsive layout, zoom, focus, themes, and reduced motion.

**Tech Stack:** React 19, TypeScript, Vite, package CSS, Vitest, Testing Library, PostCSS, vitest-axe.

**Spec:** `docs/superpowers/specs/2026-08-17-alpha-component-slice-design.md`

## Global Constraints

- Import consumable components only from `@calebhill/base` and import `@calebhill/base/styles.css`.
- Show `Button`, `ButtonLink`, `MoreIcon`, `TrashIcon`, `TextInput`, and `ProgressBar` in both light and dark themes.
- Cover every Button variant, both Button sizes, disabled/error/progress states, keyboard focus guidance, and reduced-motion guidance.
- `StatusTag` lives under `lab/src/`, is never exported from `src/index.ts`, never enters package CSS, and is absent from the npm artifact.
- `StatusTag` visibly says `Stable`, `Beta`, `Unstable`, or `Deprecated`; color never carries lifecycle meaning alone.
- Stable and deprecated use existing Base accent/danger semantics. Beta and unstable use lab-local color variables, never public `--base-*` tokens.
- The lab must remain responsive at narrow width and usable at 200 percent zoom.
- Do not add a Changeset because this ticket changes documentation tooling, not the consumable package API.
- Run `pnpm verify`, `pnpm tsc --noEmit`, and `git diff --check` before committing.

---

### Task 1: Build and verify the alpha component lab

**Files:**
- Create: `lab/src/status-tag.tsx`
- Modify: `lab/src/app.tsx`
- Modify: `lab/src/lab.css`
- Modify: `lab/src/styles.css`
- Modify: `test/react/lab-foundations.test.tsx`
- Create: `test/react/lab-components.test.tsx`

**Interfaces:**
- Consumes public runtime exports `Button`, `ButtonLink`, `MoreIcon`, `TrashIcon`, `TextInput`, `ProgressBar`, `BASE_THEME_ATTRIBUTE`, and type `BaseTheme`.
- Produces lab-local `StatusTag` with `status: "stable" | "beta" | "unstable" | "deprecated"` and no package export.
- Uses lab classes prefixed `lab-`; package component markup and classes remain production-owned.

- [ ] **Step 1: Write the failing lab surface and boundary tests**

Create `test/react/lab-components.test.tsx`. Render the real `App` with `DevTools` mocked. Assert:

```tsx
expect(screen.getAllByRole("button", { name: "Primary" })).toHaveLength(2);
expect(screen.getAllByRole("link", { name: "Button link" })).toHaveLength(2);
expect(screen.getAllByRole("textbox", { name: "Default input" })).toHaveLength(2);
expect(screen.getAllByRole("alert", { name: undefined })).toHaveLength(2);
expect(screen.getAllByRole("progressbar", { name: "Upload progress" })).toHaveLength(2);
```

Collect production buttons by `data-lab-variant` and assert the six exact classes:

```ts
const variants = ["primary", "secondary", "subtle", "destructive", "text", "text-accent"];
for (const variant of variants) {
  expect(container.querySelectorAll(`[data-lab-variant="${variant}"]`)).toHaveLength(2);
  expect(container.querySelector(`[data-lab-variant="${variant}"]`)).toHaveClass(
    `base-button-${variant}`,
  );
}
```

Assert both icon controls have accessible names, the disabled Button is native-disabled, the error TextInput is invalid and described by its alert, and progress is normalized to a real `aria-valuenow`.

Read `lab/src/app.tsx` and assert it imports components from `@calebhill/base`, imports the public stylesheet, and contains no `../../src`, `src/components`, Tailwind, Next.js, Vercel, or product imports. Read `src/index.ts`, package CSS sources, and `package.json` and assert `StatusTag`, warning variables, and beta variables do not leak into them.

- [ ] **Step 2: Write the failing StatusTag and lab CSS contracts**

In the same test file, assert two visible labels for each lifecycle state:

```ts
for (const label of ["Stable", "Beta", "Unstable", "Deprecated"]) {
  expect(screen.getAllByText(label)).toHaveLength(2);
}
```

Parse `lab/src/lab.css` with PostCSS and assert:

- `.lab-status-tag` and all four `[data-status]` selectors exist;
- beta and unstable declarations reference only `--lab-status-*` variables;
- stable and deprecated reference Base accent/danger semantic variables;
- the light and dark theme panels each define beta/unstable surface and foreground variables;
- the status foreground/surface pairs meet 4.5:1 contrast;
- no lab-local variable starts with `--base-`;
- narrow-layout media rules exist and no fixed page width blocks 200 percent zoom.

Run:

```sh
pnpm exec vitest run test/react/lab-foundations.test.tsx test/react/lab-components.test.tsx
```

Expected: FAIL because component specimens and `StatusTag` do not exist.

- [ ] **Step 3: Implement the lab-local StatusTag**

Create `lab/src/status-tag.tsx`:

```tsx
const statusLabels = {
  stable: "Stable",
  beta: "Beta",
  unstable: "Unstable",
  deprecated: "Deprecated",
} as const;

export type LabStatus = keyof typeof statusLabels;

export function StatusTag({ status }: { status: LabStatus }) {
  return (
    <span className="lab-status-tag base-type-caption" data-status={status}>
      {statusLabels[status]}
    </span>
  );
}
```

Do not export it from any package source file.

- [ ] **Step 4: Build the canonical component panels**

Refactor `lab/src/app.tsx` into small lab-only presentation helpers. Preserve the existing foundation specimens and add one `ComponentPanel` per theme. Each panel must render:

- all six Button variants with `data-lab-variant`;
- default and icon Button sizes, with MoreIcon and TrashIcon controls carrying `aria-label`;
- a native-disabled Button;
- at least one ButtonLink using real `href` behavior;
- default, filled, disabled, and error TextInput specimens;
- ProgressBar at representative start/in-progress/complete values using accessible labels;
- all four lab-only StatusTag states;
- concise keyboard, accessible-name, error-association, and reduced-motion guidance;
- short copyable-looking usage snippets as escaped text, never duplicate component implementations.

Keep both theme panels visible together through `BASE_THEME_ATTRIBUTE`. Rename the page heading from foundations-only language to the Base alpha component lab.

- [ ] **Step 5: Implement responsive, theme-aware lab styling**

Extend `lab/src/lab.css` with focused layout classes for component groups, specimens, guidance, code samples, and tags. Define lab-local colors on each themed panel:

```css
.lab-panel[data-base-theme="light"] {
  --lab-status-beta-surface: #eee9ff;
  --lab-status-beta-text: #4c1d95;
  --lab-status-warning-surface: #fff4cc;
  --lab-status-warning-text: #6b4600;
}

.lab-panel[data-base-theme="dark"] {
  --lab-status-beta-surface: #2e2259;
  --lab-status-beta-text: #d9ccff;
  --lab-status-warning-surface: #4a3712;
  --lab-status-warning-text: #ffe0a3;
}
```

Map stable to Base accent semantics, deprecated to Base danger semantics, beta to lab beta variables, and unstable to lab warning variables. Use content-sized tags, wrapping grids, and `minmax(0, 1fr)` so 200 percent zoom and narrow widths do not create horizontal overflow.

Update `lab/src/styles.css`, which is the Vite alias target for `@calebhill/base/styles.css`, to mirror the complete built stylesheet in manifest order:

```css
@import "../../src/styles/tokens.css";
@import "../../src/styles/styles.css";
@import "../../src/styles/components/button.css";
@import "../../src/styles/components/text-input.css";
@import "../../src/styles/components/progress-bar.css";
```

The Vite aliases keep both TypeScript and stylesheet consumption on the documented public paths while the lab watches production source during development. Do not copy declarations into the lab.

- [ ] **Step 6: Verify GREEN, accessibility, and package exclusion**

Run:

```sh
pnpm exec vitest run test/react/lab-foundations.test.tsx test/react/lab-components.test.tsx
pnpm lab:build
pnpm test:tarball
```

Expected: lab DOM, boundary, contrast, axe, build, and tarball exclusion checks pass.

- [ ] **Step 7: Perform the visual review**

Run `pnpm lab:dev` and review the actual lab at normal desktop width and a narrow mobile width. Verify light/dark panels, keyboard focus traversal, disabled/error states, 200 percent browser zoom, and reduced-motion emulation. Record any browser limitation honestly in the implementation report; do not substitute screenshots for unavailable interaction checks.

- [ ] **Step 8: Run the delivery gate and commit**

Run:

```sh
pnpm verify
pnpm tsc --noEmit
git diff --check
```

Commit only this ticket's lab, tests, and plan:

```sh
git add docs/superpowers/plans/2026-08-17-alpha-component-lab.md lab test/react
git commit -m "feat: build the Base alpha component lab"
```

Record in Linear that StatusTag is lab-only, absent from package exports/CSS/tarball, and publication remains blocked only on CLB-717 after this issue lands.
