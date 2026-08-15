# Base Package Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `@calebhill/base` package foundation so later component-migration issues can land into a tested, publishable React/TypeScript package with package-owned CSS, a lab, a packed-fixture contract, CI, and release preparation docs.

**Architecture:** Keep the repository as one publishable ESM package with explicit JavaScript and CSS exports, a hand-authored CSS pipeline, and a minimal runtime surface that proves the public contract before any real components ship. Use `tsup` for JavaScript and declaration output, then run a separate CSS build after `tsup` so clean builds do not delete CSS artifacts. Use plain Node scripts for CSS, tarball, and packed-fixture orchestration, Vitest plus Testing Library plus axe for local contracts, and GitHub Actions plus Changesets for CI and release preparation without activating npm publishing in this ticket.

**Tech Stack:** pnpm 10, React 19, TypeScript 5, tsup, Vite 7, Vitest, Testing Library, vitest-axe, ESLint flat config, Changesets, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-14-base-design-system-alpha-design.md`

## Global Constraints

- Package name is `@calebhill/base`; the first public prerelease target remains `0.1.0-alpha.0` on the npm `next` tag.
- Publish only `dist`, `README.md`, `LICENSE`, and package metadata; do not publish `lab`, `test`, or `src`.
- Public exports are exactly `"."`, `"./tokens.css"`, and `"./styles.css"`; do not expose internal source paths or CommonJS output.
- JavaScript is ESM-only, tree-shakeable, and framework-agnostic; React and React DOM are peer dependencies.
- CSS is package-owned, uses `--base-` custom property names plus `base-` class prefixes, and must not require consumer Tailwind configuration.
- `dist/tokens.css` is a byte-for-byte copy of `src/styles/tokens.css`; `dist/styles.css` is deterministic concatenation of tokens first, then component/base styles.
- The alpha theme runtime is deferred; the only theme contract now is `data-base-theme="light" | "dark"`, with light tokens on `:root`.
- Every verification cycle must include `pnpm lint`, `pnpm tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm lab:build`, `pnpm test:tarball`, and the packed Vite fixture.
- Forbidden imports must fail for `next/*`, `@vercel/*`, `@/*`, `~/`, `photos-me/*`, and `calebhill.me/*`.
- Frequent commits are required; each task below ends with a commit before moving on.
- The worktree is already the isolated base repo branch at `/Users/clbhll/code/base-design-system/.worktrees/chill-clb-691-package-foundation`; do not create another worktree or replace the existing `.gitignore` contents.

---

## Repository File Map

### Root package and tooling

- Create: `package.json` — canonical package metadata, exports, scripts, peers, publish config, and dev dependencies.
- Create: `tsconfig.json` — strict root TypeScript config for `src`, `lab`, `test`, and `scripts`.
- Create: `tsup.config.ts` — ESM bundle + declarations for `src/index.ts`, externalizing React peers.
- Create: `eslint.config.mjs` — flat config for TypeScript, React hooks, a11y, and forbidden-import rules.
- Modify: `.gitignore` — append `dist`, `coverage`, `.tmp`, fixture install output, and lab build artifacts without replacing existing lines.

### Source and CSS contract

- Create: `src/index.ts` — the only JavaScript entry point.
- Create: `src/theme.ts` — minimal runtime/theme helpers exported from `src/index.ts`.
- Create: `src/styles/tokens.css` — base token contract with light, dark, reduced-motion, and fine-pointer primitives.
- Create: `src/styles/styles.css` — component/base class namespace and smoke styles layered after tokens.
- Create: `scripts/build-css.mjs` — copies `tokens.css` and concatenates `tokens.css + styles.css` into `dist`.

### Tests and verification harness

- Create: `vitest.config.ts` — jsdom test runner with separate include globs for contract and React tests.
- Create: `test/setup.ts` — Testing Library and axe matcher setup.
- Create: `test/contracts/public-api.test.ts` — validates the minimal runtime export surface.
- Create: `test/contracts/css-build.test.ts` — validates `dist/tokens.css` and `dist/styles.css` output ordering/content.
- Create: `test/react/theme-probe.test.tsx` — Testing Library + axe smoke test for the exported theme contract.
- Create: `test/contracts/tarball-contents.test.ts` — validates the packed artifact file list.
- Create: `scripts/assert-tarball-contents.mjs` — inspects the packed tarball and fails on extra or missing files.
- Create: `scripts/test-packed-fixture.mjs` — packs the package, stages a temp Vite app, installs the tarball, typechecks, and builds it.

### Lab and packed consumer fixture

- Create: `lab/index.html`
- Create: `lab/vite.config.ts`
- Create: `lab/src/main.tsx`
- Create: `lab/src/app.tsx`
- Create: `test/fixtures/vite-smoke/package.json`
- Create: `test/fixtures/vite-smoke/tsconfig.json`
- Create: `test/fixtures/vite-smoke/vite.config.ts`
- Create: `test/fixtures/vite-smoke/index.html`
- Create: `test/fixtures/vite-smoke/src/main.tsx`

The lab proves the source package entry and CSS locally. The Vite fixture proves the packed tarball with only public exports.

### Release and docs

- Create: `.changeset/config.json`
- Create: `.changeset/README.md`
- Create: `.github/workflows/ci.yml`
- Modify: `README.md` — replace the placeholder status with install, theme, scripts, lab, fixture, and release docs.
- Create: `LICENSE` — MIT license with Caleb Hill copyright.
- Create: `docs/releasing.md` — Changesets + future trusted publish + rollback procedure for CLB-705.

## Package Contract To Implement

`package.json` must contain this public contract:

```json
{
  "name": "@calebhill/base",
  "version": "0.0.0",
  "type": "module",
  "sideEffects": [
    "./dist/tokens.css",
    "./dist/styles.css"
  ],
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./tokens.css": "./dist/tokens.css",
    "./styles.css": "./dist/styles.css"
  },
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-dom": ">=19.0.0"
  },
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "access": "public",
    "provenance": true,
    "tag": "next"
  },
  "scripts": {
    "build": "tsup && pnpm build:css",
    "build:css": "node scripts/build-css.mjs",
    "clean": "rm -rf dist coverage .tmp",
    "lint": "eslint .",
    "lab:build": "vite build --config lab/vite.config.ts",
    "lab:dev": "vite --config lab/vite.config.ts",
    "prepack": "pnpm build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "fixture:test": "node scripts/test-packed-fixture.mjs",
    "verify": "pnpm lint && pnpm tsc --noEmit && pnpm test && pnpm build && pnpm lab:build"
  }
}
```

Keep the scaffold on `0.0.0` until CLB-705 cuts the first public Changesets release as `0.1.0-alpha.0`.

The minimal JavaScript public surface for CLB-691 is:

```ts
export const BASE_THEME_ATTRIBUTE = "data-base-theme";
export type BaseTheme = "light" | "dark";
export function isBaseTheme(value: string): value is BaseTheme;
```

No placeholder component exports belong in this issue. CLB-692, CLB-694, and CLB-695 add real component/runtime surface later.

### Task 1: Bootstrap metadata, minimal runtime, and lint foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`
- Create: `eslint.config.mjs`
- Create: `src/index.ts`
- Create: `src/theme.ts`
- Create: `test/contracts/public-api.test.ts`
- Create: `test/contracts/forbidden-imports.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: the empty repository root and the spec’s export/peer/script contract.
- Produces: installable dev tooling, the minimal public runtime surface, working lint configuration, and executable contract tests for exports plus forbidden imports.

- [ ] **Step 1: Add package metadata and install the toolchain**

Write `package.json` with the exact contract above, add `packageManager: "pnpm@10.30.3"`, `license: "MIT"`, `repository`, and `description`, then install:

```bash
pnpm add -D react react-dom typescript tsup vite vitest jsdom @vitejs/plugin-react @types/node @types/react @types/react-dom @testing-library/jest-dom @testing-library/react @testing-library/user-event vitest-axe eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-jsx-a11y globals @changesets/cli
```

Append these `.gitignore` lines if absent:

```gitignore
dist
coverage
.tmp
lab/dist
```

- [ ] **Step 2: Add TypeScript and tsup config without `src` implementation yet**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["src", "lab", "test", "scripts", "tsup.config.ts", "vitest.config.ts", "eslint.config.mjs"],
  "exclude": ["dist", "node_modules"]
}
```

Create `tsup.config.ts`:

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: false,
  external: ["react", "react-dom"],
});
```

- [ ] **Step 3: Write the first red contract tests**

Create `vitest.config.ts` and `test/setup.ts`:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
  },
});
```

```ts
// test/setup.ts
import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";
```

Create `test/contracts/public-api.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { BASE_THEME_ATTRIBUTE, isBaseTheme } from "../../src/index";

describe("public api", () => {
  it("exposes the base theme attribute constant", () => {
    expect(BASE_THEME_ATTRIBUTE).toBe("data-base-theme");
  });

  it("narrows valid theme values", () => {
    expect(isBaseTheme("light")).toBe(true);
    expect(isBaseTheme("dark")).toBe(true);
    expect(isBaseTheme("sepia")).toBe(false);
  });
});
```

Create `test/contracts/forbidden-imports.test.ts`:

```ts
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

describe("forbidden imports", () => {
  it("reports no-restricted-imports for banned source imports", async () => {
    const eslint = new ESLint({
      cwd: process.cwd(),
      overrideConfigFile: "eslint.config.mjs",
    });

    const [result] = await eslint.lintText('import Link from "next/link";\nexport const value = Link;\n', {
      filePath: "src/test-forbidden-import.ts",
    });

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "no-restricted-imports",
        }),
      ]),
    );
  });
});
```

- [ ] **Step 4: Run the red checks to verify they fail for the right reasons**

Run: `pnpm test -- test/contracts/public-api.test.ts`

Expected:
- `pnpm test -- test/contracts/public-api.test.ts` FAILS with a module-resolution error for `../../src/index` because `src/index.ts` does not exist yet.

- [ ] **Step 5: Implement the minimal runtime and working ESLint config**

Create `src/theme.ts`:

```ts
export const BASE_THEME_ATTRIBUTE = "data-base-theme";

export type BaseTheme = "light" | "dark";

export function isBaseTheme(value: string): value is BaseTheme {
  return value === "light" || value === "dark";
}
```

Create `src/index.ts`:

```ts
export { BASE_THEME_ATTRIBUTE, isBaseTheme } from "./theme";
export type { BaseTheme } from "./theme";
```

Create `eslint.config.mjs`:

```js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          patterns: ["next/*", "@vercel/*", "@/*", "~/*", "photos-me/*", "calebhill.me/*"],
        },
      ],
    },
  },
);
```

- [ ] **Step 6: Run the green checks for this task**

Run: `pnpm lint`, `pnpm test -- test/contracts/public-api.test.ts test/contracts/forbidden-imports.test.ts`, and `pnpm tsc --noEmit`

Expected: PASS. The public runtime exports resolve, the forbidden-import contract proves `no-restricted-imports` actually fires, and the package metadata/lint/typecheck foundations are reviewable on their own.

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json tsconfig.json tsup.config.ts vitest.config.ts test/setup.ts eslint.config.mjs src/index.ts src/theme.ts test/contracts/public-api.test.ts test/contracts/forbidden-imports.test.ts pnpm-lock.yaml
git commit -m "chore: scaffold base runtime and lint foundation"
```

### Task 2: Implement the CSS build contract

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/styles.css`
- Create: `scripts/build-css.mjs`
- Create: `test/contracts/css-build.test.ts`

**Interfaces:**
- Consumes: Task 1 toolchain, lint config, and public API contract.
- Produces: source CSS and deterministic `dist/tokens.css` plus `dist/styles.css`.

- [ ] **Step 1: Write the failing CSS contract test**

Create `test/contracts/css-build.test.ts`:

```ts
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("css build", () => {
  it("copies tokens and concatenates styles in order", () => {
    rmSync("dist", { force: true, recursive: true });
    mkdirSync("dist", { recursive: true });

    execFileSync("node", ["scripts/build-css.mjs"], { stdio: "inherit" });

    const tokens = readFileSync("dist/tokens.css", "utf8");
    const styles = readFileSync("dist/styles.css", "utf8");

    expect(tokens).toContain("--base-color-text-primary");
    expect(styles.startsWith(tokens)).toBe(true);
    expect(styles).toContain(".base-theme-probe");
  });
});
```

- [ ] **Step 2: Implement the token sheet, smoke styles, and CSS build script**

Create `src/styles/tokens.css`:

```css
:root,
[data-base-theme="light"] {
  --base-color-text-primary: oklch(22% 0.02 255);
  --base-color-surface-primary: oklch(99% 0.01 255);
  --base-color-border-subtle: oklch(88% 0.01 255);
  --base-radius-md: 0.75rem;
  --base-space-3: 0.75rem;
  --base-font-size-control: 1rem;
  --base-duration-fast: 140ms;
  --base-ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
}

[data-base-theme="dark"] {
  --base-color-text-primary: oklch(96% 0.01 255);
  --base-color-surface-primary: oklch(25% 0.02 255);
  --base-color-border-subtle: oklch(41% 0.01 255);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --base-duration-fast: 0ms;
  }
}

@media (pointer: fine) {
  :root {
    --base-fine-pointer: 1;
  }
}
```

Create `src/styles/styles.css`:

```css
.base-theme-probe {
  color: var(--base-color-text-primary);
  background: var(--base-color-surface-primary);
  border: 1px solid var(--base-color-border-subtle);
  border-radius: var(--base-radius-md);
  padding: var(--base-space-3);
  font-size: var(--base-font-size-control);
  transition: color var(--base-duration-fast) var(--base-ease-standard);
}
```

Create `scripts/build-css.mjs`:

```js
import { mkdir, readFile, writeFile } from "node:fs/promises";

const tokensPath = new URL("../src/styles/tokens.css", import.meta.url);
const stylesPath = new URL("../src/styles/styles.css", import.meta.url);
const distDir = new URL("../dist/", import.meta.url);

const tokens = await readFile(tokensPath, "utf8");
const styles = await readFile(stylesPath, "utf8");

await mkdir(distDir, { recursive: true });
await writeFile(new URL("tokens.css", distDir), tokens);
await writeFile(new URL("styles.css", distDir), `${tokens}\n\n${styles}\n`);
```

- [ ] **Step 3: Run the focused contract checks**

Run: `pnpm test -- test/contracts/public-api.test.ts test/contracts/css-build.test.ts`

Expected: PASS. The runtime export tests resolve, and the CSS contract test proves the deterministic build output.

- [ ] **Step 4: Run typecheck and build**

Run: `pnpm tsc --noEmit` and `pnpm build`

Expected: PASS. `tsup` writes `dist/index.js` and `dist/index.d.ts`, then `pnpm build:css` writes `dist/tokens.css` and `dist/styles.css` afterward, so the final `dist` contains all four files with no CommonJS output.

- [ ] **Step 5: Commit**

```bash
git add src/styles scripts/build-css.mjs test/contracts/css-build.test.ts package.json
git commit -m "feat: add base css build contract"
```

### Task 3: Add the React accessibility harness

**Files:**
- Create: `test/react/theme-probe.test.tsx`

**Interfaces:**
- Consumes: Task 1 runtime/theme exports and lint config plus Task 2 CSS files.
- Produces: a jsdom-based Testing Library and axe harness the future components can extend.

- [ ] **Step 1: Add the React smoke test to the passing harness**

Create `test/react/theme-probe.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { BASE_THEME_ATTRIBUTE, type BaseTheme, isBaseTheme } from "../../src";
import "../../src/styles/styles.css";

function ThemeProbe({ theme }: { theme: BaseTheme }) {
  return (
    <div className="base-theme-probe" data-testid="probe" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      {isBaseTheme(theme) ? `theme:${theme}` : "invalid"}
    </div>
  );
}

describe("theme probe", () => {
  it("renders a valid themed probe", async () => {
    const { container } = render(<ThemeProbe theme="dark" />);
    expect(screen.getByTestId("probe")).toHaveTextContent("theme:dark");
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

Keep the React smoke test source-level only; do not import built `dist` files inside unit tests.

Run: `pnpm test -- test/react/theme-probe.test.tsx`, then `pnpm lint`, then `pnpm tsc --noEmit`

Expected: PASS. The smoke test proves the a11y harness, lint still passes with the existing forbidden-import contract from Task 1, and typecheck stays clean.

- [ ] **Step 2: Commit**

```bash
git add test/react/theme-probe.test.tsx
git commit -m "test: add accessibility harness"
```

### Task 4: Scaffold the lab and the packed Vite consumer fixture

**Files:**
- Create: `lab/index.html`
- Create: `lab/vite.config.ts`
- Create: `lab/src/main.tsx`
- Create: `lab/src/app.tsx`
- Create: `test/fixtures/vite-smoke/package.json`
- Create: `test/fixtures/vite-smoke/tsconfig.json`
- Create: `test/fixtures/vite-smoke/vite.config.ts`
- Create: `test/fixtures/vite-smoke/index.html`
- Create: `test/fixtures/vite-smoke/src/main.tsx`
- Create: `scripts/test-packed-fixture.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 2 public entry and CSS exports.
- Produces: a repo-owned dev lab using the package entry plus a tarball consumer contract that installs only public exports.

- [ ] **Step 1: Build the lab shell against the package entry**

Create `lab/src/app.tsx`:

```tsx
import { BASE_THEME_ATTRIBUTE } from "@calebhill/base";
import "@calebhill/base/styles.css";

export function App() {
  return (
    <main style={{ display: "grid", gap: "1rem", maxWidth: "40rem", margin: "4rem auto" }}>
      <section className="base-theme-probe" {...{ [BASE_THEME_ATTRIBUTE]: "light" }}>
        <h1>Base package foundation</h1>
        <p>Light theme tokens loaded through the public stylesheet export.</p>
      </section>
      <section className="base-theme-probe" {...{ [BASE_THEME_ATTRIBUTE]: "dark" }}>
        <h2>Dark theme contract</h2>
        <p>The lab uses the same package entry future components will use.</p>
      </section>
    </main>
  );
}
```

Create `lab/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `lab/vite.config.ts` so the package name resolves to local source during development with exact subpath matching ahead of the bare package alias:

```ts
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@calebhill/base/styles.css",
        replacement: fileURLToPath(new URL("../src/styles/styles.css", import.meta.url)),
      },
      {
        find: "@calebhill/base/tokens.css",
        replacement: fileURLToPath(new URL("../src/styles/tokens.css", import.meta.url)),
      },
      {
        find: /^@calebhill\/base$/,
        replacement: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
      },
    ],
  },
  root: fileURLToPath(new URL("./", import.meta.url)),
});
```

Create a plain `lab/index.html` with a single `#root` mount.

- [ ] **Step 2: Write the packed fixture before the orchestration script**

Create `test/fixtures/vite-smoke/package.json`:

```json
{
  "name": "vite-smoke",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^7.0.0"
  }
}
```

Create `test/fixtures/vite-smoke/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";

import { BASE_THEME_ATTRIBUTE, isBaseTheme } from "@calebhill/base";
import "@calebhill/base/styles.css";

function FixtureApp() {
  const theme = "light";

  return (
    <div className="base-theme-probe" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      fixture:{isBaseTheme(theme) ? theme : "invalid"}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<FixtureApp />);
```

Create `test/fixtures/vite-smoke/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

Create `test/fixtures/vite-smoke/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
```

Create `test/fixtures/vite-smoke/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite Smoke Fixture</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Implement tarball installation and verification with temp staging outside the fixture template**

Create `scripts/test-packed-fixture.mjs`:

```js
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const fixtureTemplateRoot = resolve(root, "test/fixtures/vite-smoke");
const tempRoot = resolve(root, ".tmp/packed-fixture");
const runRoot = resolve(tempRoot, "run");

rmSync(tempRoot, { force: true, recursive: true });
mkdirSync(tempRoot, { recursive: true });

execFileSync("pnpm", ["pack", "--pack-destination", tempRoot], { stdio: "inherit" });

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const tarballBaseName = packageJson.name.replace(/^@/, "").replace(/\//g, "-");
const tarball = join(tempRoot, `${tarballBaseName}-${packageJson.version}.tgz`);

if (!existsSync(tarball)) {
  throw new Error(`Expected tarball at ${tarball}`);
}

cpSync(fixtureTemplateRoot, runRoot, { recursive: true });

const fixturePackageJsonPath = resolve(runRoot, "package.json");
const fixturePackage = JSON.parse(readFileSync(fixturePackageJsonPath, "utf8"));
fixturePackage.dependencies["@calebhill/base"] = `file:${tarball}`;
writeFileSync(fixturePackageJsonPath, `${JSON.stringify(fixturePackage, null, 2)}\n`);

execFileSync("pnpm", ["install", "--ignore-workspace"], { cwd: runRoot, stdio: "inherit" });
execFileSync("pnpm", ["typecheck"], { cwd: runRoot, stdio: "inherit" });
execFileSync("pnpm", ["build"], { cwd: runRoot, stdio: "inherit" });
```

- [ ] **Step 4: Verify the lab and packed fixture**

Run: `pnpm lab:build` and `pnpm fixture:test`

Expected: PASS. The lab resolves the local package entry, and the fixture installs the actual tarball, typechecks, and builds without Tailwind configuration.

- [ ] **Step 5: Commit**

```bash
git add lab test/fixtures/vite-smoke scripts/test-packed-fixture.mjs package.json
git commit -m "feat: add base lab and packed fixture"
```

### Task 5: Add tarball assertions, CI, and release-prep docs

**Files:**
- Create: `.changeset/config.json`
- Create: `.changeset/README.md`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Create: `test/contracts/tarball-contents.test.ts`
- Create: `scripts/assert-tarball-contents.mjs`
- Create: `docs/releasing.md`
- Modify: `README.md`
- Create: `LICENSE`

**Interfaces:**
- Consumes: Tasks 1 through 4 scripts and verification commands.
- Produces: repeatable CI, a Changesets-managed release foundation, an enforced tarball file-list contract, CLB-705 handoff docs for trusted publishing, and user-facing package docs.

- [ ] **Step 1: Add the tarball assertion script and script entry**

Add to `package.json`:

```json
"scripts": {
  "test:tarball": "vitest run test/contracts/tarball-contents.test.ts",
  "verify": "pnpm lint && pnpm tsc --noEmit && pnpm test && pnpm build && pnpm lab:build && pnpm test:tarball && pnpm fixture:test"
}
```

Create `scripts/assert-tarball-contents.mjs`:

```js
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const tempRoot = resolve(".tmp/tarball-check");
rmSync(tempRoot, { force: true, recursive: true });
mkdirSync(tempRoot, { recursive: true });

execFileSync("pnpm", ["pack", "--pack-destination", tempRoot], { stdio: "inherit" });

const tarballName = readdirSync(tempRoot).find((entry) => entry.endsWith(".tgz"));
if (!tarballName) {
  throw new Error("Expected pnpm pack to create a tarball");
}

const listing = execFileSync("tar", ["-tf", join(tempRoot, tarballName)], {
  encoding: "utf8",
});

const actual = listing
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .sort();

const expected = [
  "package/LICENSE",
  "package/README.md",
  "package/dist/index.d.ts",
  "package/dist/index.js",
  "package/dist/styles.css",
  "package/dist/tokens.css",
  "package/package.json",
].sort();

if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(`Tarball contents mismatch.\nExpected: ${expected.join(", ")}\nActual: ${actual.join(", ")}`);
}
```

Create `test/contracts/tarball-contents.test.ts`:

```ts
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("tarball contents", () => {
  it("publishes only the approved package files", () => {
    expect(() =>
      execFileSync("node", ["scripts/assert-tarball-contents.mjs"], {
        stdio: "inherit",
      }),
    ).not.toThrow();
  });
});
```

Run: `pnpm test:tarball`

Expected: PASS and fail loudly on any extra `src`, `lab`, `test`, sourcemap, or declaration-map files in the tarball.

- [ ] **Step 2: Lock the full local verification sequence before writing CI**

Before adding workflows, run:

```bash
pnpm verify
```

Expected: PASS locally. This locks the command sequence the workflows must run. If any command fails here, fix it before writing YAML so CI does not encode broken assumptions.

- [ ] **Step 3: Add Changesets foundation**

Create `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Create `.changeset/README.md` with the exact local release flow:

```md
1. Run `pnpm verify`.
2. Create a changeset for user-facing changes with `pnpm changeset`.
3. Merge the Changesets version PR.
4. In CLB-705, let the dedicated release workflow publish with `npm publish --provenance --tag next`.
5. If a prerelease is bad, deprecate it and publish a corrected prerelease; never overwrite a published version.
```

Add to `package.json` if missing:

```json
"scripts": {
  "changeset": "changeset",
  "version-packages": "changeset version"
}
```

- [ ] **Step 4: Add CI workflow**

Create `.github/workflows/ci.yml`:

```yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.3
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm verify
```

- [ ] **Step 5: Add release-prep docs without activating publishing**

Create `docs/releasing.md` with:

```md
# Releasing @calebhill/base

1. Verify locally with `pnpm verify`.
2. Add a changeset describing the consumer-visible change.
3. Merge the version PR generated by Changesets when CLB-705 is ready to publish.
4. In CLB-705, add the dedicated trusted-publishing workflow that publishes to npm with the `next` tag and provenance.
5. Roll back by deprecating the broken version and publishing a corrected prerelease.
```

Create `LICENSE` with the standard MIT text and `Copyright (c) 2026 Caleb Hill`.

- [ ] **Step 6: Replace the root README placeholder**

Update `README.md` so it documents:

```md
- `pnpm install`
- `pnpm verify`
- `pnpm lab:dev`
- `pnpm fixture:test`
- `import "@calebhill/base/styles.css"`
- `data-base-theme="light" | "dark"`
- future component issues CLB-692, CLB-694, and CLB-695 as follow-on work
```

- [ ] **Step 7: Re-run the full local verification**

Run: `pnpm lint`, `pnpm tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm lab:build`, `pnpm test:tarball`, `pnpm fixture:test`, and `pnpm verify`

Expected: PASS for every command, with `pnpm verify` acting as the exact CI/release gate.

- [ ] **Step 8: Commit**

```bash
git add .changeset .github/workflows README.md LICENSE docs/releasing.md scripts/assert-tarball-contents.mjs test/contracts/tarball-contents.test.ts package.json
git commit -m "chore: add ci and release prep docs"
```

### Task 6: Final packaging checks, PR hygiene, and Linear completion

**Files:**
- Modify: `package.json` if final metadata corrections are needed
- Modify: `README.md` only if verification reveals missing consumer guidance

**Interfaces:**
- Consumes: the complete package scaffold from Tasks 1 through 5.
- Produces: a clean branch ready for `/simplify`, PR creation, and Linear state updates.

- [ ] **Step 1: Re-run the explicit tarball contract**

Run: `pnpm test:tarball`

Expected: PASS and the script asserts a tarball containing only:

```text
package/dist/index.js
package/dist/index.d.ts
package/dist/tokens.css
package/dist/styles.css
package/README.md
package/LICENSE
package/package.json
```

- [ ] **Step 2: Perform the final repository verification sweep**

Run: `pnpm verify` and `pnpm tsc --noEmit`

Expected: PASS twice in a row. The second explicit typecheck satisfies the repository-wide Next.js safety rule and proves no drift after tarball verification.

- [ ] **Step 3: Simplify and open the PR**

Run `/simplify`, then prepare the branch for PR creation with a concise summary of:

```text
- package metadata and exports
- minimal runtime/theme public entry
- CSS build contract
- lab and packed fixture
- CI, Changesets, and release docs
```

Expected: the diff remains scaffold-only and ready for review without component migrations mixed in.

- [ ] **Step 4: Complete Linear workflow**

Update Linear issue `CLB-691` before and after merge:

```text
Before PR:
- attach this plan
- set the estimate if it is empty
- move the issue to In Progress

After merge:
- verify the CI and release-prep files are on `main`
- move CLB-691 to Done
- note that CLB-692, CLB-694, CLB-695, CLB-703 child work, CLB-704 child work, and CLB-705 publishing now depend on this scaffold
```

- [ ] **Step 5: Commit any last metadata-only correction**

```bash
git add package.json README.md
git commit -m "chore: finalize base package scaffold"
```

## Plan self-review

- Spec coverage: this plan covers the single-package architecture, explicit exports, peer dependencies, deterministic CSS output, minimal ESM entry, a lab, a packed Vite fixture, lint/typecheck/test/build gates, forbidden imports, Changesets foundation, rollback docs, MIT licensing, and Linear completion. It intentionally defers active trusted publishing workflow work to CLB-705 and intentionally does not migrate alpha components, which remain in CLB-692, CLB-694, and CLB-695.
- Placeholder scan: no task uses `TODO`, `TBD`, fake “appropriate” work, manual “tighten if needed” escape hatches, or invented red steps that are not grounded in the actual tool behavior. Every task names concrete files, commands, and expected outcomes.
- Type and interface consistency: the only CLB-691 public runtime interface is `BASE_THEME_ATTRIBUTE`, `BaseTheme`, and `isBaseTheme`; the lab, tests, fixture, and packed tarball contract all consume that same contract. The forbidden-import contract now asserts the exact `no-restricted-imports` rule hit through ESLint’s programmatic API, and `pnpm build` always means `tsup` first, then `pnpm build:css`, so later tasks rely on the same final `dist` shape.
