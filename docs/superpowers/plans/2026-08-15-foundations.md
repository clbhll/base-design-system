# Base Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved CLB-692 semantic token, typography, link, and interaction foundation as framework-independent package CSS.

**Architecture:** Keep raw scales and semantic theme aliases in `tokens.css`; keep every visual behavior opt-in behind `.base-*` classes in `styles.css`. The existing build continues to copy the token sheet byte-for-byte and concatenate it before the class sheet, while the lab and packed Vite fixture consume only public package entry points.

**Tech Stack:** Plain CSS, TypeScript, React 19, Vitest 4, Testing Library, vitest-axe, Vite 7, pnpm 10.30.3, Changesets

**Spec:** `docs/superpowers/specs/2026-08-15-foundations-design.md`

## Global Constraints

- Light semantic colors use the `photos.me` source palette; dark semantic colors use the `calebhill.me` source palette.
- Public semantic properties use `--base-*`; internal reference scales use `--base-ref-*`; opt-in classes use `.base-*`.
- `tokens.css` must remain the token-only entry point; `styles.css` must contain tokens first and classes second.
- Do not add `body`, reset, unscoped element, Tailwind, product, site-shell, canvas, upload, article-layout, or theme-runtime behavior.
- Typography uses the `photos.me` component scale. CalebHill editorial typography remains consumer-owned.
- CSS transitions use the platform `ease-out` keyword. Do not duplicate easing or spring constants from `@calebhill/animations`.
- Reduced motion removes press scaling but retains enabled active opacity feedback.
- No React component or new JavaScript export is part of CLB-692.
- Add a minor changeset for the consumer-visible CSS API.
- Run `pnpm verify` and `pnpm tsc --noEmit` before committing and before delivery.

---

### Task 1: Establish the token and theme contract

**Files:**
- Create: `test/contracts/foundations-css.test.ts`
- Modify: `test/contracts/css-build.test.ts`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Consumes: the existing `@calebhill/base/tokens.css` export and `data-base-theme="light" | "dark"` selector contract.
- Produces: the exact `--base-ref-*` reference scales, stable `--base-*` semantic properties, light/dark aliases, and reduced-motion overrides consumed by Task 2.

- [ ] **Step 1: Write the failing token contract test**

Create `test/contracts/foundations-css.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const styles = readFileSync("src/styles/styles.css", "utf8");

const semanticTokens = [
  "--base-font-family-sans",
  "--base-font-family-mono",
  "--base-duration-interaction-fast",
  "--base-duration-interaction-standard",
  "--base-interaction-press-scale",
  "--base-interaction-press-opacity-reduced",
  "--base-color-background",
  "--base-color-background-subtle",
  "--base-color-text-primary",
  "--base-color-text-secondary",
  "--base-color-text-tertiary",
  "--base-color-text-disabled",
  "--base-color-accent",
  "--base-color-accent-hover",
  "--base-color-accent-active",
  "--base-color-accent-subtle",
  "--base-color-on-accent",
  "--base-color-surface",
  "--base-color-surface-hover",
  "--base-color-surface-active",
  "--base-color-surface-disabled",
  "--base-color-border",
  "--base-color-border-hover",
  "--base-color-border-focus",
  "--base-color-border-active",
  "--base-color-focus-ring",
  "--base-color-code-surface",
  "--base-color-code-border",
] as const;

function blockFor(pattern: RegExp) {
  const match = tokens.match(pattern);
  const block = match?.[1];
  expect(block).toBeDefined();
  return block ?? "";
}

describe("foundation CSS contract", () => {
  it("publishes the complete semantic token vocabulary", () => {
    for (const token of semanticTokens) {
      expect(tokens).toContain(`${token}:`);
    }
  });

  it("maps the approved light and dark accent sources", () => {
    const light = blockFor(/:root,\s*\[data-base-theme="light"\]\s*\{([^}]*)\}/s);
    const dark = blockFor(/\[data-base-theme="dark"\]\s*\{([^}]*)\}/s);

    expect(light).toContain("--base-color-accent: var(--base-ref-color-blue-500)");
    expect(dark).toContain("--base-color-accent: var(--base-ref-color-blue-400)");
    expect(light).toContain("--base-color-code-surface: var(--base-color-background-subtle)");
    expect(dark).toContain("--base-color-code-surface: var(--base-color-background-subtle)");
  });

  it("removes spatial press feedback for reduced motion", () => {
    const reducedMotion = blockFor(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{([^}]*)\}/s,
    );

    expect(reducedMotion).toContain("--base-duration-interaction-fast: 0ms");
    expect(reducedMotion).toContain("--base-duration-interaction-standard: 0ms");
    expect(reducedMotion).toContain("--base-interaction-press-scale: 1");
  });

  it("keeps the class sheet free of global and Tailwind rules", () => {
    const withoutComments = styles.replaceAll(/\/\*[\s\S]*?\*\//g, "");

    expect(withoutComments).not.toMatch(/(^|})\s*(html|body|\*)\b/);
    expect(withoutComments).not.toContain('@import "tailwindcss"');
    expect(withoutComments).not.toContain("@tailwind");
  });
});
```

In `test/contracts/css-build.test.ts`, replace the old placeholder assertions:

```ts
expect(tokens).toMatch(/^:root\s*\{/);
expect(tokens).toContain(':root,\n[data-base-theme="light"]');
expect(tokens).toContain('[data-base-theme="dark"]');
expect(tokens).toContain("--base-color-text-primary");
expect(tokens).toContain("@media (prefers-reduced-motion: reduce)");
expect(styles).toContain(".base-type-display");
```

- [ ] **Step 2: Run the focused tests and verify the new contract fails**

Run:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts test/contracts/css-build.test.ts
```

Expected: FAIL because the placeholder sheet lacks the reference scales and most semantic properties.

- [ ] **Step 3: Implement the token sheet**

Replace `src/styles/tokens.css` with the following structure and values:

```css
:root {
  --base-ref-font-size-200: 0.75rem;
  --base-ref-font-size-300: 0.875rem;
  --base-ref-font-size-350: 0.9375rem;
  --base-ref-font-size-400: 1rem;
  --base-ref-font-size-450: 1.0625rem;
  --base-ref-font-size-500: 1.25rem;
  --base-ref-font-size-600: 1.5rem;
  --base-ref-font-size-700: 1.875rem;
  --base-ref-line-height-200: 1.125rem;
  --base-ref-line-height-250: 1.1875rem;
  --base-ref-line-height-300: 1.25rem;
  --base-ref-line-height-350: 1.5rem;
  --base-ref-line-height-400: 1.5rem;
  --base-ref-line-height-500: 1.8125rem;
  --base-ref-line-height-800: 2.25rem;
  --base-ref-font-weight-regular: 400;
  --base-ref-font-weight-medium: 500;
  --base-ref-font-weight-semibold: 600;
  --base-ref-letter-spacing-tight: -0.03em;
  --base-ref-letter-spacing-compact: -0.31px;
  --base-ref-letter-spacing-normal: 0;
  --base-ref-letter-spacing-wider: 0.02em;
  --base-ref-color-neutral-0: #ffffff;
  --base-ref-color-neutral-50: #f9f9f9;
  --base-ref-color-neutral-100: #f5f5f5;
  --base-ref-color-neutral-150: #f2f2f2;
  --base-ref-color-neutral-180: #ededed;
  --base-ref-color-neutral-200: #ebebeb;
  --base-ref-color-neutral-250: #e5e5e5;
  --base-ref-color-neutral-300: #cccccc;
  --base-ref-color-neutral-350: #bbbbbb;
  --base-ref-color-neutral-400: #a0a0a0;
  --base-ref-color-neutral-450: #999999;
  --base-ref-color-neutral-500: #666666;
  --base-ref-color-neutral-550: #555555;
  --base-ref-color-neutral-600: #444444;
  --base-ref-color-neutral-700: #2a2a2a;
  --base-ref-color-neutral-750: #222222;
  --base-ref-color-neutral-800: #1a1a1a;
  --base-ref-color-neutral-900: #111111;
  --base-ref-color-neutral-1000: #0a0a0a;
  --base-ref-color-blue-50: #e6eeff;
  --base-ref-color-blue-100: #8cc1ff;
  --base-ref-color-blue-200: #6aa3ff;
  --base-ref-color-blue-400: #4d90fe;
  --base-ref-color-blue-500: #0055ff;
  --base-ref-color-blue-600: #0044cc;
  --base-ref-color-blue-800: #003399;
  --base-ref-color-blue-950: #0d1a33;
  --base-ref-space-1: 0.25rem;
  --base-ref-space-2: 0.5rem;
  --base-ref-space-3: 0.75rem;
  --base-ref-space-4: 1rem;
  --base-ref-space-5: 1.25rem;
  --base-ref-space-6: 1.5rem;
  --base-ref-radius-sm: 0.375rem;
  --base-ref-radius-md: 0.75rem;
  --base-ref-radius-lg: 1rem;
  --base-ref-duration-fast: 150ms;
  --base-ref-duration-standard: 220ms;
  --base-font-family-sans: ui-sans-serif, system-ui, sans-serif;
  --base-font-family-mono: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
  --base-duration-interaction-fast: var(--base-ref-duration-fast);
  --base-duration-interaction-standard: var(--base-ref-duration-standard);
  --base-interaction-press-scale: 0.97;
  --base-interaction-press-opacity-reduced: 0.8;
}

:root,
[data-base-theme="light"] {
  --base-color-background: var(--base-ref-color-neutral-0);
  --base-color-background-subtle: var(--base-ref-color-neutral-50);
  --base-color-text-primary: var(--base-ref-color-neutral-900);
  --base-color-text-secondary: var(--base-ref-color-neutral-550);
  --base-color-text-tertiary: var(--base-ref-color-neutral-450);
  --base-color-text-disabled: var(--base-ref-color-neutral-350);
  --base-color-accent: var(--base-ref-color-blue-500);
  --base-color-accent-hover: var(--base-ref-color-blue-600);
  --base-color-accent-active: var(--base-ref-color-blue-800);
  --base-color-accent-subtle: var(--base-ref-color-blue-50);
  --base-color-on-accent: var(--base-ref-color-neutral-0);
  --base-color-surface: var(--base-ref-color-neutral-0);
  --base-color-surface-hover: var(--base-ref-color-neutral-100);
  --base-color-surface-active: var(--base-ref-color-neutral-200);
  --base-color-surface-disabled: var(--base-ref-color-neutral-150);
  --base-color-border: var(--base-ref-color-neutral-250);
  --base-color-border-hover: var(--base-ref-color-neutral-300);
  --base-color-border-focus: var(--base-ref-color-blue-500);
  --base-color-border-active: var(--base-ref-color-neutral-900);
  --base-color-focus-ring: var(--base-ref-color-blue-500);
  --base-color-code-surface: var(--base-color-background-subtle);
  --base-color-code-border: var(--base-color-border);
}

[data-base-theme="dark"] {
  --base-color-background: var(--base-ref-color-neutral-1000);
  --base-color-background-subtle: var(--base-ref-color-neutral-800);
  --base-color-text-primary: var(--base-ref-color-neutral-180);
  --base-color-text-secondary: var(--base-ref-color-neutral-400);
  --base-color-text-tertiary: var(--base-ref-color-neutral-500);
  --base-color-text-disabled: var(--base-ref-color-neutral-600);
  --base-color-accent: var(--base-ref-color-blue-400);
  --base-color-accent-hover: var(--base-ref-color-blue-200);
  --base-color-accent-active: var(--base-ref-color-blue-100);
  --base-color-accent-subtle: var(--base-ref-color-blue-950);
  --base-color-on-accent: var(--base-ref-color-neutral-1000);
  --base-color-surface: var(--base-ref-color-neutral-800);
  --base-color-surface-hover: var(--base-ref-color-neutral-750);
  --base-color-surface-active: var(--base-ref-color-neutral-700);
  --base-color-surface-disabled: var(--base-ref-color-neutral-900);
  --base-color-border: var(--base-ref-color-neutral-700);
  --base-color-border-hover: var(--base-ref-color-neutral-600);
  --base-color-border-focus: var(--base-ref-color-blue-400);
  --base-color-border-active: var(--base-ref-color-neutral-180);
  --base-color-focus-ring: var(--base-ref-color-blue-400);
  --base-color-code-surface: var(--base-color-background-subtle);
  --base-color-code-border: var(--base-color-border);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --base-duration-interaction-fast: 0ms;
    --base-duration-interaction-standard: 0ms;
    --base-interaction-press-scale: 1;
  }
}
```

- [ ] **Step 4: Run focused and type checks**

Run:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts test/contracts/css-build.test.ts
pnpm tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit the token contract**

```sh
git add src/styles/tokens.css test/contracts/foundations-css.test.ts test/contracts/css-build.test.ts
git commit -m "feat: add semantic foundation tokens"
```

---

### Task 2: Add opt-in typography, link, and interaction classes

**Files:**
- Modify: `test/contracts/foundations-css.test.ts`
- Modify: `src/styles/styles.css`

**Interfaces:**
- Consumes: Task 1 semantic family, color, duration, and press properties.
- Produces: the eleven `.base-type-*` roles plus `.base-link`, `.base-link-muted`, `.base-tabular-nums`, `.base-focus-ring`, and `.base-pressable` for the lab, fixture, and later components.

- [ ] **Step 1: Add failing class and interaction assertions**

Append these cases to `test/contracts/foundations-css.test.ts`:

```ts
const foundationClasses = [
  ".base-type-display",
  ".base-type-heading-lg",
  ".base-type-heading-md",
  ".base-type-heading-sm",
  ".base-type-action",
  ".base-type-input",
  ".base-type-body-lg",
  ".base-type-body",
  ".base-type-body-sm",
  ".base-type-caption",
  ".base-type-mono",
  ".base-link",
  ".base-link-muted",
  ".base-tabular-nums",
  ".base-focus-ring",
  ".base-pressable",
] as const;

it("exports every approved opt-in foundation class", () => {
  for (const className of foundationClasses) {
    expect(styles).toContain(className);
  }
});

it("guards hover and reduced-motion press behavior", () => {
  expect(styles).toContain("@media (hover: hover) and (pointer: fine)");
  expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  expect(styles).toContain("scale: var(--base-interaction-press-scale)");
  expect(styles).toContain("opacity: var(--base-interaction-press-opacity-reduced)");
  expect(styles).toContain(':is(:disabled, [aria-disabled="true"])');
});
```

- [ ] **Step 2: Run the contract and verify it fails**

Run:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts
```

Expected: FAIL because only `.base-theme-probe` exists.

- [ ] **Step 3: Replace the placeholder class sheet**

Replace `src/styles/styles.css` with opt-in rules using this exact vocabulary and behavior:

```css
.base-type-display,
.base-type-heading-lg,
.base-type-heading-md,
.base-type-heading-sm,
.base-type-action,
.base-type-input,
.base-type-body-lg,
.base-type-body,
.base-type-body-sm,
.base-type-caption {
  font-family: var(--base-font-family-sans);
}

.base-type-display {
  font-size: var(--base-ref-font-size-700);
  line-height: var(--base-ref-line-height-800);
  font-weight: var(--base-ref-font-weight-regular);
  letter-spacing: var(--base-ref-letter-spacing-tight);
}

.base-type-heading-lg {
  font-size: var(--base-ref-font-size-600);
  line-height: var(--base-ref-line-height-500);
  font-weight: var(--base-ref-font-weight-regular);
  letter-spacing: var(--base-ref-letter-spacing-tight);
}

.base-type-heading-md {
  font-size: var(--base-ref-font-size-500);
  line-height: var(--base-ref-line-height-350);
  font-weight: var(--base-ref-font-weight-regular);
  letter-spacing: var(--base-ref-letter-spacing-tight);
}

.base-type-heading-sm {
  font-size: var(--base-ref-font-size-400);
  line-height: var(--base-ref-line-height-250);
  font-weight: var(--base-ref-font-weight-regular);
  letter-spacing: var(--base-ref-letter-spacing-tight);
}

.base-type-action {
  font-size: var(--base-ref-font-size-350);
  line-height: var(--base-ref-line-height-400);
  font-weight: var(--base-ref-font-weight-medium);
  letter-spacing: var(--base-ref-letter-spacing-compact);
}

.base-type-input {
  font-size: var(--base-ref-font-size-350);
  line-height: var(--base-ref-line-height-350);
  font-weight: var(--base-ref-font-weight-medium);
  letter-spacing: var(--base-ref-letter-spacing-compact);
}

.base-type-body-lg {
  font-size: var(--base-ref-font-size-400);
  line-height: var(--base-ref-line-height-400);
  font-weight: var(--base-ref-font-weight-regular);
  letter-spacing: var(--base-ref-letter-spacing-normal);
}

.base-type-body {
  font-size: var(--base-ref-font-size-300);
  line-height: var(--base-ref-line-height-300);
  font-weight: var(--base-ref-font-weight-regular);
  letter-spacing: var(--base-ref-letter-spacing-normal);
}

.base-type-body-sm,
.base-type-caption {
  font-size: var(--base-ref-font-size-200);
  line-height: var(--base-ref-line-height-200);
  font-weight: var(--base-ref-font-weight-regular);
}

.base-type-body-sm {
  letter-spacing: var(--base-ref-letter-spacing-normal);
}

.base-type-caption {
  letter-spacing: var(--base-ref-letter-spacing-wider);
}

.base-type-mono {
  font-family: var(--base-font-family-mono);
  font-size: var(--base-ref-font-size-200);
  line-height: var(--base-ref-line-height-250);
  letter-spacing: var(--base-ref-letter-spacing-normal);
}

.base-link,
.base-link-muted {
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--base-color-border);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  transition-property: color, text-decoration-color;
  transition-duration: var(--base-duration-interaction-fast);
  transition-timing-function: ease-out;
}

.base-link {
  color: var(--base-color-text-primary);
}

.base-link-muted {
  color: var(--base-color-text-tertiary);
}

.base-tabular-nums {
  font-variant-numeric: tabular-nums;
}

.base-link:focus-visible,
.base-link-muted:focus-visible,
.base-focus-ring:focus-visible {
  outline: 2px solid var(--base-color-focus-ring);
  outline-offset: 2px;
}

.base-pressable {
  transition-property: color, background-color, border-color, opacity, transform, scale;
  transition-duration: var(--base-duration-interaction-fast);
  transition-timing-function: ease-out;
}

.base-pressable:not(:disabled, [aria-disabled="true"]):active {
  scale: var(--base-interaction-press-scale);
}

.base-pressable:is(:disabled, [aria-disabled="true"]):active {
  opacity: 1;
  scale: 1;
}

@media (hover: hover) and (pointer: fine) {
  .base-link:hover {
    color: var(--base-color-text-secondary);
  }

  .base-link-muted:hover {
    color: var(--base-color-text-primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-pressable:not(:disabled, [aria-disabled="true"]):active {
    opacity: var(--base-interaction-press-opacity-reduced);
    scale: 1;
  }
}
```

If ESLint/CSS tooling rejects the two-argument `:not()` selector, use the equivalent chained form `.base-pressable:not(:disabled):not([aria-disabled="true"]):active` and update the test string to match. Do not broaden the selector.

- [ ] **Step 4: Run focused and build checks**

Run:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts test/contracts/css-build.test.ts
pnpm build
pnpm tsc --noEmit
```

Expected: PASS and `dist/styles.css` contains the token sheet before `.base-type-display`.

- [ ] **Step 5: Commit the class foundation**

```sh
git add src/styles/styles.css test/contracts/foundations-css.test.ts
git commit -m "feat: add opt-in foundation styles"
```

---

### Task 3: Exercise the foundations in DOM tests, the lab, and the packed fixture

**Files:**
- Delete: `test/react/theme-probe.test.tsx`
- Create: `test/react/foundations.test.tsx`
- Modify: `lab/src/app.tsx`
- Create: `lab/src/lab.css`
- Modify: `lab/src/main.tsx`
- Modify: `test/fixtures/vite-smoke/src/main.tsx`

**Interfaces:**
- Consumes: Task 1 theme attributes and Task 2 opt-in class names.
- Produces: executable accessibility coverage, a canonical two-theme foundation lab, a scoped consumer override example, and proof that the packed public stylesheet works without Tailwind.

- [ ] **Step 1: Replace the placeholder DOM test with failing foundation coverage**

Delete `test/react/theme-probe.test.tsx` and create `test/react/foundations.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { BASE_THEME_ATTRIBUTE, type BaseTheme } from "../../src";
import "../../src/styles/styles.css";

function FoundationPreview({ theme }: { theme: BaseTheme }) {
  return (
    <section aria-label={`${theme} foundations`} {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      <h2 className="base-type-heading-md">{theme} theme</h2>
      <p className="base-type-body">
        Body copy with <code className="base-type-mono">inline code</code> and a{" "}
        <a className="base-link" href={`#${theme}-target`}>
          visible link
        </a>
        .
      </p>
      <button className="base-focus-ring base-pressable base-type-action" type="button">
        Pressable
      </button>
    </section>
  );
}

describe("foundation preview", () => {
  it.each(["light", "dark"] as const)("renders accessible %s foundations", async (theme) => {
    const { container } = render(<FoundationPreview theme={theme} />);

    expect(screen.getByRole("region", { name: `${theme} foundations` })).toHaveAttribute(
      BASE_THEME_ATTRIBUTE,
      theme,
    );
    expect(screen.getByRole("button")).toHaveClass("base-focus-ring", "base-pressable");
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the DOM test and verify the old placeholder contract is gone**

Run:

```sh
pnpm exec vitest run test/react/foundations.test.tsx
```

Expected: PASS only after the Task 2 classes are present; verify `rg "base-theme-probe" test lab src` still reports the lab and fixture placeholders that this task will remove.

- [ ] **Step 3: Build the canonical lab page**

Modify `lab/src/main.tsx` to import the lab-only sheet after `App`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app";
import "./lab.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Replace `lab/src/app.tsx` with a data-driven preview using public imports:

```tsx
import { BASE_THEME_ATTRIBUTE, type BaseTheme } from "@calebhill/base";
import "@calebhill/base/styles.css";

import { DevTools } from "./dev-tools";

const typeRoles = [
  ["Display", "base-type-display"],
  ["Heading large", "base-type-heading-lg"],
  ["Heading medium", "base-type-heading-md"],
  ["Heading small", "base-type-heading-sm"],
  ["Action", "base-type-action"],
  ["Input", "base-type-input"],
  ["Body large", "base-type-body-lg"],
  ["Body", "base-type-body"],
  ["Body small", "base-type-body-sm"],
  ["Caption", "base-type-caption"],
  ["Mono", "base-type-mono"],
] as const;

function ThemePanel({ theme }: { theme: BaseTheme }) {
  return (
    <section className="lab-panel" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      <header className="lab-section">
        <p className="base-type-caption">{theme} theme</p>
        <h2 className="base-type-heading-lg">Foundation contract</h2>
      </header>

      <div className="lab-section lab-swatches" aria-label={`${theme} semantic colors`}>
        {[
          ["Background", "background"],
          ["Subtle", "background-subtle"],
          ["Surface", "surface"],
          ["Accent", "accent"],
        ].map(([label, token]) => (
          <div className="lab-swatch" key={token} style={{ background: `var(--base-color-${token})` }}>
            <span className="base-type-caption">{label}</span>
          </div>
        ))}
      </div>

      <div className="lab-section">
        {typeRoles.map(([label, className]) => (
          <p className={className} key={className}>
            {label} — Base foundations
          </p>
        ))}
      </div>

      <div className="lab-section base-type-body">
        <a className="base-link" href="#standard-link">Standard link</a>{" "}
        <a className="base-link-muted" href="#muted-link">Muted link</a>{" "}
        <code className="base-type-mono lab-code">inline code</code>{" "}
        <span className="base-tabular-nums">01:23:45</span>
      </div>

      <button className="lab-pressable base-focus-ring base-pressable base-type-action" type="button">
        Press me
      </button>
    </section>
  );
}

export function App() {
  return (
    <>
      <main className="lab-shell">
        <header className="lab-intro">
          <p className="base-type-caption">@calebhill/base</p>
          <h1 className="base-type-display">Foundations</h1>
          <p className="base-type-body-lg">Portable tokens, type, links, and interaction.</p>
        </header>
        <div className="lab-grid">
          <ThemePanel theme="light" />
          <ThemePanel theme="dark" />
        </div>
        <section className="lab-override" data-base-theme="light">
          <p className="base-type-body">
            Scoped override: <a className="base-link" href="#override">consumer accent</a>
          </p>
        </section>
      </main>
      <DevTools />
    </>
  );
}
```

Create `lab/src/lab.css` with lab-only layout. Keep it outside the package stylesheet:

```css
:root {
  font-family: ui-sans-serif, system-ui, sans-serif;
  background: #f3f3f3;
}

body {
  margin: 0;
}

.lab-shell {
  display: grid;
  gap: 2rem;
  width: min(72rem, calc(100% - 2rem));
  margin: 0 auto;
  padding-block: 3rem;
}

.lab-intro,
.lab-section {
  display: grid;
  gap: 0.75rem;
}

.lab-intro > *,
.lab-section > * {
  margin: 0;
}

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 28rem), 1fr));
  gap: 1rem;
}

.lab-panel {
  display: grid;
  gap: 2rem;
  padding: 2rem;
  color: var(--base-color-text-primary);
  background: var(--base-color-background);
  border: 1px solid var(--base-color-border);
  border-radius: var(--base-ref-radius-lg);
}

.lab-swatches {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.lab-swatch {
  min-height: 4rem;
  padding: var(--base-ref-space-3);
  color: var(--base-color-text-primary);
  border: 1px solid var(--base-color-border);
  border-radius: var(--base-ref-radius-sm);
}

.lab-code {
  padding: 0.125rem 0.375rem;
  background: var(--base-color-code-surface);
  border: 1px solid var(--base-color-code-border);
  border-radius: var(--base-ref-radius-sm);
}

.lab-pressable {
  justify-self: start;
  padding: var(--base-ref-space-2) var(--base-ref-space-4);
  color: var(--base-color-on-accent);
  background: var(--base-color-accent);
  border: 0;
  border-radius: var(--base-ref-radius-sm);
}

.lab-override {
  --base-color-accent: #0082f6;
  --base-color-focus-ring: #0082f6;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
}
```

- [ ] **Step 4: Update the packed fixture to consume real foundation classes**

Replace the fixture's placeholder element in `test/fixtures/vite-smoke/src/main.tsx`:

```tsx
function FixtureApp() {
  const theme = "light";

  return (
    <section className="base-type-body" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      fixture:{isBaseTheme(theme) ? theme : "invalid"}{" "}
      <a className="base-link" href="#fixture">
        link
      </a>
      <button className="base-focus-ring base-pressable base-type-action" type="button">
        pressable
      </button>
    </section>
  );
}
```

- [ ] **Step 5: Verify tests, lab, and packed consumer**

Run:

```sh
pnpm exec vitest run test/react/foundations.test.tsx test/contracts/foundations-css.test.ts
pnpm lab:build
pnpm fixture:test
pnpm tsc --noEmit
rg "base-theme-probe" src test lab
```

Expected: all commands pass; the final `rg` returns no matches.

Start `pnpm lab:dev`, review both themes at the printed local URL, and verify keyboard focus, press feedback, color contrast, layout at 200% zoom, and reduced-motion behavior. Stop the server after review.

- [ ] **Step 6: Commit executable examples**

```sh
git add test/react lab/src test/fixtures/vite-smoke/src/main.tsx
git commit -m "feat: demonstrate Base foundations"
```

---

### Task 4: Document the public foundation and add a changeset

**Files:**
- Modify: `README.md`
- Modify: `DESIGN.md`
- Create: `.changeset/bright-bases-bloom.md`

**Interfaces:**
- Consumes: the complete Task 1 and Task 2 public vocabulary and the verified Task 3 examples.
- Produces: consumer setup guidance, a durable approved-decision record, and a minor release note for CLB-705.

- [ ] **Step 1: Add a failing documentation contract**

Extend `test/contracts/design-doc.test.ts` with a case that fails until the approved decision and README guidance exist:

```ts
it("records the approved CLB-692 foundation contract", async () => {
  const [readme, design] = await Promise.all([
    readRepositoryFile("README.md"),
    readRepositoryFile("DESIGN.md"),
  ]);

  expect(readme).toContain('import "@calebhill/base/tokens.css"');
  expect(readme).toContain("--base-color-accent: #0082f6");
  expect(design).toContain("CLB-692 approved foundation vocabulary");
  expect(design).not.toContain("CLB-692 will approve the complete semantic token");
});
```

- [ ] **Step 2: Run the documentation contract and verify it fails**

Run:

```sh
pnpm exec vitest run test/contracts/design-doc.test.ts
```

Expected: FAIL on the new README and approved-decision strings.

- [ ] **Step 3: Update README consumer guidance**

Under Consumer setup, document the token-only alternative and scoped override:

````md
Import only the token contract when a consumer supplies all component and foundation styles itself:

```ts
import "@calebhill/base/tokens.css";
```

Override semantic properties through normal CSS cascade. For example, CalebHill's light theme retains its product accent without creating another Base theme:

```css
[data-base-theme="light"] {
  --base-color-accent: #0082f6;
  --base-color-accent-hover: #56afff;
  --base-color-accent-active: #0062b8;
  --base-color-focus-ring: #0082f6;
}
```

The complete stylesheet exports opt-in `.base-type-*`, `.base-link*`, `.base-tabular-nums`, `.base-focus-ring`, and `.base-pressable` classes. It does not style `body`, reset elements, or require Tailwind.
````

Update Roadmap so CLB-692 is described as the completed foundation and CLB-694/CLB-695 as the next component slices.

- [ ] **Step 4: Record the approved decision in DESIGN.md**

Add this bullet under Approved now:

```md
- CLB-692 approved foundation vocabulary uses `--base-ref-*` raw scales, overrideable `--base-*` semantic properties, the photos.me light palette and component type scale, the calebhill.me dark palette, and opt-in `.base-*` foundation classes; the detailed inventory lives in `docs/superpowers/specs/2026-08-15-foundations-design.md`.
```

Remove the CLB-692 vocabulary item from Intentionally open.

- [ ] **Step 5: Add the minor changeset**

Create `.changeset/bright-bases-bloom.md`:

```md
---
"@calebhill/base": minor
---

Add the semantic light and dark token contract plus opt-in typography, link, focus, press, and reduced-motion foundation styles.
```

- [ ] **Step 6: Run documentation and type checks**

Run:

```sh
pnpm exec vitest run test/contracts/design-doc.test.ts
pnpm tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit documentation and release intent**

```sh
git add README.md DESIGN.md .changeset/bright-bases-bloom.md test/contracts/design-doc.test.ts
git commit -m "docs: document Base foundation APIs"
```

---

### Task 5: Simplify, verify, deliver, and clean up CLB-692

**Files:**
- Review: every file changed since `main`
- Modify: only files requiring simplification or verification fixes

**Interfaces:**
- Consumes: all prior task commits.
- Produces: a clean, merged CLB-692 PR with Linear status and branch cleanup complete.

- [ ] **Step 1: Run the required simplification pass**

Run `/simplify` against `git diff main...HEAD`. Remove duplicate declarations, speculative tokens, unnecessary lab abstractions, and brittle assertions while preserving the approved contract. Review the simplified diff with:

```sh
git diff --check
git diff --stat main...HEAD
git diff main...HEAD
```

If simplification changes tracked files, rerun their focused tests and commit with:

```sh
git add -u
git commit -m "refactor: simplify foundation implementation"
```

- [ ] **Step 2: Run the complete verification gates**

Run separately:

```sh
pnpm verify
pnpm tsc --noEmit
```

Expected: lint, TypeScript, all tests, package build, lab build, tarball verification, and packed Vite consumer all pass.

- [ ] **Step 3: Confirm the branch is clean and push it**

```sh
git status --short --branch
git log --oneline --decorate main..HEAD
git push -u origin chill/clb-692-foundations
```

Expected: clean working tree and only CLB-692 commits above `main`.

- [ ] **Step 4: Open and merge the PR**

Open a PR titled `CLB-692 add Base token and interaction foundations`. Include the design spec, public token/class summary, excluded scope, changeset, visual lab review, and exact verification results. Wait for required checks; merge only the verified head with squash merge.

- [ ] **Step 5: Complete Linear and clean up**

Comment on CLB-692 with the PR, merge commit, verification, and lab review. Mark it Done. Fast-forward the clean root `main`, delete the remote branch, remove `.worktrees/chill-clb-692-foundations`, and delete the local branch. Confirm:

```sh
git status --short --branch
git worktree list
git branch --list "chill/clb-692-foundations"
git ls-remote --heads origin chill/clb-692-foundations
```

Expected: root `main` matches `origin/main`, the feature worktree and local branch are absent, and the remote branch query returns no result.
