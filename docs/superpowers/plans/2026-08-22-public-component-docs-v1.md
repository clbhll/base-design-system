# Public Base Component Documentation V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single scrolling Base lab with a public-facing, linkable component reference that has persistent navigation and focused documents for every current public component.

**Architecture:** Keep the existing React and Vite lab, add a small native hash-location layer, and drive both navigation and document rendering from one typed registry. Each document renders production components through `@calebhill/base`, while shared lab-only primitives provide headers, specimens, theme controls, code blocks, props tables, and accessibility sections.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Base semantic CSS, Vitest, Testing Library, user-event, PostCSS, vitest-axe.

**Spec:** `docs/superpowers/specs/2026-08-22-public-component-docs-v1-design.md`

## Global Constraints

- Work only in `/Users/clbhll/code/base-design-system/.worktrees/chill-clb-703-public-docs-v1` on `chill/clb-703-public-docs-v1`.
- Keep V1 inside the existing `lab/`; do not add Storybook, MDX, React Router, search, prop controls, or a hosting dependency.
- Import consumable components only from `@calebhill/base` and import `@calebhill/base/styles.css`.
- Document component behavior, API, states, accessibility, and lifecycle; do not add product-level usage guidance.
- Use static-host-safe hash paths rooted at `#/foundations`.
- Keep all documentation components, CSS, and status colors lab-local and outside the npm artifact.
- Use Base semantic tokens and type roles for the documentation shell; add no public package tokens or styles.
- Keep native semantics, visible focus, 200 percent zoom, narrow layouts, browser history, and reduced motion working.
- Add no Changeset because the public package contract does not change.
- Begin each behavior task with a failing test.
- Run `pnpm verify`, `pnpm tsc --noEmit`, and `git diff --check` before claiming completion.

## File map

- `lab/src/app.tsx` — application shell, skip link, grouped navigation, active document, page title, and DevTools mount.
- `lab/src/routing.ts` — pure hash parsing plus the browser hash subscription hook.
- `lab/src/component-registry.tsx` — typed document inventory and lookup shared by navigation and rendering.
- `lab/src/components/document-header.tsx` — title, behavioral summary, import statement, and optional lifecycle tag.
- `lab/src/components/specimen.tsx` — section heading, theme control, and themed live-preview surface.
- `lab/src/components/code-sample.tsx` — semantic preformatted consumer code.
- `lab/src/components/props-table.tsx` — horizontally contained semantic table for public props.
- `lab/src/components/accessibility-notes.tsx` — consistent accessibility-contract section.
- `lab/src/components/status-tag.tsx` — move the existing lab-only status tag without changing its public boundary.
- `lab/src/documents/foundations.tsx` — semantic tokens, typography, links, focus/press, and scoped override proof.
- `lab/src/documents/button.tsx` — Button variants, sizes, disabled state, code, API, and accessibility.
- `lab/src/documents/button-link.tsx` — ButtonLink variants, icon label requirement, code, API, and accessibility.
- `lab/src/documents/text-input.tsx` — default, filled, disabled, error states, code, API, and accessibility.
- `lab/src/documents/progress-bar.tsx` — determinate values, normalization contract, code, API, and accessibility.
- `lab/src/documents/icons.tsx` — MoreIcon and TrashIcon specimens, SVG props, code, and accessibility.
- `lab/src/lab.css` — responsive two-column shell and all documentation-only presentation.
- `test/react/lab-routing.test.tsx` — hash parsing, defaulting, browser history, and active navigation behavior.
- `test/react/lab-documents.test.tsx` — exact registry inventory, document content, public-import boundary, and representative accessibility.
- `test/react/lab-components.test.tsx` — adapt existing canonical specimen assertions to focused documents.
- `test/react/lab-foundations.test.tsx` — adapt foundation assertions to the Foundations document.
- `README.md` — describe the public documentation lab and its V1 navigation contract.

---

### Task 1: Add the hash-location contract

**Files:**
- Create: `lab/src/routing.ts`
- Create: `test/react/lab-routing.test.tsx`

**Interfaces:**
- Produces: `DEFAULT_LAB_PATH: "/foundations"`.
- Produces: `resolveLabPath(hash: string, validPaths: ReadonlySet<string>): string`.
- Produces: `labHref(path: string): string`.
- Produces: `useLabPath(validPaths: ReadonlySet<string>): string`.
- Consumes: browser `location.hash`, `hashchange`, and `history.replaceState` only inside `useLabPath`.

- [ ] **Step 1: Write failing pure routing tests**

Create `test/react/lab-routing.test.tsx` with the exact route inventory used by V1:

```ts
import { describe, expect, it } from "vitest";

import { DEFAULT_LAB_PATH, labHref, resolveLabPath } from "../../lab/src/routing";

const paths = new Set([
  "/foundations",
  "/components/button",
  "/components/button-link",
  "/components/text-input",
  "/components/progress-bar",
  "/components/icons",
]);

describe("lab hash routing", () => {
  it("resolves valid hashes and defaults invalid locations", () => {
    expect(resolveLabPath("#/components/button", paths)).toBe("/components/button");
    expect(resolveLabPath("", paths)).toBe(DEFAULT_LAB_PATH);
    expect(resolveLabPath("#components/button", paths)).toBe(DEFAULT_LAB_PATH);
    expect(resolveLabPath("#/components/unknown", paths)).toBe(DEFAULT_LAB_PATH);
  });

  it("creates static-host-safe hrefs", () => {
    expect(labHref("/components/text-input")).toBe("#/components/text-input");
  });
});
```

- [ ] **Step 2: Run the routing test and verify the missing module fails**

Run:

```sh
pnpm exec vitest run test/react/lab-routing.test.tsx
```

Expected: FAIL because `lab/src/routing.ts` does not exist.

- [ ] **Step 3: Implement pure routing and the browser subscription hook**

Create `lab/src/routing.ts`:

```ts
import { useEffect, useState } from "react";

export const DEFAULT_LAB_PATH = "/foundations" as const;

export function resolveLabPath(hash: string, validPaths: ReadonlySet<string>) {
  const path = hash.startsWith("#/") ? hash.slice(1) : DEFAULT_LAB_PATH;
  return validPaths.has(path) ? path : DEFAULT_LAB_PATH;
}

export function labHref(path: string) {
  return `#${path}`;
}

export function useLabPath(validPaths: ReadonlySet<string>) {
  const readPath = () => resolveLabPath(window.location.hash, validPaths);
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const updatePath = () => setPath(readPath());
    window.addEventListener("hashchange", updatePath);

    const normalizedHash = labHref(readPath());
    if (window.location.hash !== normalizedHash) {
      window.history.replaceState(null, "", normalizedHash);
    }

    return () => window.removeEventListener("hashchange", updatePath);
  }, [validPaths]);

  return path;
}
```

Keep `validPaths` referentially stable in the registry so this effect does not resubscribe on every render.

- [ ] **Step 4: Run focused routing and TypeScript checks**

Run:

```sh
pnpm exec vitest run test/react/lab-routing.test.tsx
pnpm tsc --noEmit
```

Expected: both PASS.

- [ ] **Step 5: Commit the routing contract**

```sh
git add lab/src/routing.ts test/react/lab-routing.test.tsx
git commit -m "feat: add component lab hash routing"
```

---

### Task 2: Build the typed registry and navigable shell

**Files:**
- Create: `lab/src/component-registry.tsx`
- Create: `lab/src/documents/foundations.tsx`
- Create: `lab/src/documents/button.tsx`
- Create: `lab/src/documents/button-link.tsx`
- Create: `lab/src/documents/text-input.tsx`
- Create: `lab/src/documents/progress-bar.tsx`
- Create: `lab/src/documents/icons.tsx`
- Modify: `lab/src/app.tsx`
- Modify: `test/react/lab-routing.test.tsx`

**Interfaces:**
- Consumes: `useLabPath(validPaths)` and `labHref(path)` from Task 1.
- Produces: `LabDocumentGroup = "foundations" | "components"`.
- Produces: `LabDocumentDefinition` with `path`, `label`, `group`, and `Document`.
- Produces: stable `labDocuments`, `labDocumentPaths`, and `getLabDocument(path)`.
- Produces: one named React document component from each `lab/src/documents/*.tsx` file.

- [ ] **Step 1: Extend the routing test with failing shell behavior**

Mock DevTools, reset the hash before each test, render `App`, and assert the exact navigation plus selection behavior:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";

vi.mock("../../lab/src/dev-tools", () => ({ DevTools: () => null }));

beforeEach(() => window.history.replaceState(null, "", "#/foundations"));
afterEach(cleanup);

it("lists the complete current catalog and marks the active document", () => {
  render(<App />);

  expect(screen.getByRole("navigation", { name: "Base documentation" })).toBeVisible();
  for (const label of [
    "Foundations",
    "Button",
    "Button Link",
    "Text Input",
    "Progress Bar",
    "Icons",
  ]) {
    expect(screen.getByRole("link", { name: label })).toBeVisible();
  }
  expect(screen.getByRole("link", { name: "Foundations" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

it("selects a document without reloading and follows history", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("link", { name: "Button" }));
  expect(window.location.hash).toBe("#/components/button");
  expect(await screen.findByRole("heading", { level: 1, name: "Button" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute("aria-current", "page");

  window.history.back();
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  expect(await screen.findByRole("heading", { level: 1, name: "Foundations" })).toBeVisible();
});
```

Also assert a visible skip link targeting `#lab-document`, a `main` landmark with that ID, grouped headings named Foundations and Components, and one level-one heading at a time.

Add one invalid-location test that starts at `#/components/unknown`, renders Foundations, normalizes the hash to `#/foundations` without adding a history entry, and marks Foundations current. Assert the source link points to `https://github.com/clbhll/base-design-system` and the document title changes from `Foundations — Base` to `Button — Base` after selection.

- [ ] **Step 2: Run the shell tests and verify they fail against the scrolling lab**

Run:

```sh
pnpm exec vitest run test/react/lab-routing.test.tsx
```

Expected: FAIL because the existing app has no navigation, registry, hash selection, or focused document.

- [ ] **Step 3: Move the legacy lab into Foundations and create the remaining document modules**

Move the current `typeRoles`, `linkSurfaces`, `buttonVariants`, `FoundationSpecimens`, and `ComponentPanel` definitions from `app.tsx` into `FoundationsDocument`. Change the page-level heading to a single level-one `Foundations` heading, but preserve the two theme panels and every existing component specimen at this intermediate boundary so the current canonical lab tests remain green.

Each other file exports one named component with a single `h1`, for example:

```tsx
export function ButtonDocument() {
  return <h1 className="base-type-display">Button</h1>;
}
```

Use these exact exports: `FoundationsDocument`, `ButtonDocument`, `ButtonLinkDocument`, `TextInputDocument`, `ProgressBarDocument`, and `IconsDocument`.

- [ ] **Step 4: Implement the registry**

Create `lab/src/component-registry.tsx`:

```tsx
import type { ComponentType } from "react";

import { ButtonDocument } from "./documents/button";
import { ButtonLinkDocument } from "./documents/button-link";
import { FoundationsDocument } from "./documents/foundations";
import { IconsDocument } from "./documents/icons";
import { ProgressBarDocument } from "./documents/progress-bar";
import { TextInputDocument } from "./documents/text-input";

export type LabDocumentGroup = "foundations" | "components";

export interface LabDocumentDefinition {
  path: string;
  label: string;
  group: LabDocumentGroup;
  Document: ComponentType;
}

export const labDocuments = [
  { path: "/foundations", label: "Foundations", group: "foundations", Document: FoundationsDocument },
  { path: "/components/button", label: "Button", group: "components", Document: ButtonDocument },
  { path: "/components/button-link", label: "Button Link", group: "components", Document: ButtonLinkDocument },
  { path: "/components/text-input", label: "Text Input", group: "components", Document: TextInputDocument },
  { path: "/components/progress-bar", label: "Progress Bar", group: "components", Document: ProgressBarDocument },
  { path: "/components/icons", label: "Icons", group: "components", Document: IconsDocument },
] as const satisfies ReadonlyArray<LabDocumentDefinition>;

export const labDocumentPaths = new Set(labDocuments.map(({ path }) => path));

export function getLabDocument(path: string) {
  return labDocuments.find((document) => document.path === path) ?? labDocuments[0];
}
```

Format the array across lines as needed to satisfy lint and readability.

- [ ] **Step 5: Replace the scrolling app with the accessible shell**

Refactor `lab/src/app.tsx` to:

```tsx
import { useEffect } from "react";

import { DevTools } from "./dev-tools";
import { getLabDocument, labDocumentPaths, labDocuments } from "./component-registry";
import { labHref, useLabPath } from "./routing";

const groupLabels = { foundations: "Foundations", components: "Components" } as const;

export function App() {
  const path = useLabPath(labDocumentPaths);
  const activeDocument = getLabDocument(path);
  const { Document } = activeDocument;

  useEffect(() => {
    document.title = `${activeDocument.label} — Base`;
  }, [activeDocument.label]);

  return (
    <>
      <a className="lab-skip-link base-focus-ring" href="#lab-document">Skip to document</a>
      <div className="lab-app-shell">
        <aside className="lab-sidebar">
          <header className="lab-brand">
            <span className="base-type-heading-md">Base</span>
            <span className="base-type-caption">Alpha React component library</span>
          </header>
          <nav aria-label="Base documentation">
            {(Object.keys(groupLabels) as Array<keyof typeof groupLabels>).map((group) => (
              <section className="lab-nav-group" key={group}>
                <h2 className="base-type-caption">{groupLabels[group]}</h2>
                <ul>
                  {labDocuments.filter((item) => item.group === group).map((item) => (
                    <li key={item.path}>
                      <a
                        aria-current={item.path === path ? "page" : undefined}
                        className="lab-nav-link base-focus-ring base-type-body-sm"
                        href={labHref(item.path)}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
          <a
            className="lab-repository-link base-focus-ring base-type-body-sm"
            href="https://github.com/clbhll/base-design-system"
          >
            View source
          </a>
        </aside>
        <main className="lab-document" id="lab-document">
          <Document />
        </main>
      </div>
      <DevTools />
    </>
  );
}
```

Do not add `role="menu"`; this is site navigation, not an application menu.

- [ ] **Step 6: Run shell, existing lab, and TypeScript checks**

Run:

```sh
pnpm exec vitest run test/react/lab-routing.test.tsx test/react/lab-components.test.tsx test/react/lab-foundations.test.tsx
pnpm tsc --noEmit
```

Expected: all focused routing, existing lab, and TypeScript checks PASS. The legacy specimens remain available inside Foundations only until Task 3 distributes them into their final documents.

- [ ] **Step 7: Commit the shell and registry**

```sh
git add lab/src/app.tsx lab/src/component-registry.tsx lab/src/documents test/react/lab-routing.test.tsx
git commit -m "feat: add navigable component lab shell"
```

---

### Task 3: Add shared document primitives and canonical component documents

**Files:**
- Create: `lab/src/components/accessibility-notes.tsx`
- Create: `lab/src/components/code-sample.tsx`
- Create: `lab/src/components/document-header.tsx`
- Create: `lab/src/components/props-table.tsx`
- Create: `lab/src/components/specimen.tsx`
- Create: `lab/src/components/theme-control.tsx`
- Move: `lab/src/status-tag.tsx` to `lab/src/components/status-tag.tsx`
- Modify: every file under `lab/src/documents/`
- Create: `test/react/lab-documents.test.tsx`
- Modify: `test/react/lab-components.test.tsx`
- Modify: `test/react/lab-foundations.test.tsx`

**Interfaces:**
- Consumes: public Base exports `BASE_THEME_ATTRIBUTE`, `Button`, `ButtonLink`, `MoreIcon`, `ProgressBar`, `TextInput`, `TrashIcon`, `BaseTheme`, and `ButtonVariant`.
- Produces: `DocumentHeader`, `Specimen`, `CodeSample`, `PropsTable`, `AccessibilityNotes`, `ThemeControl`, and relocated `StatusTag` for lab-only use.
- Produces: complete document content while preserving the named document exports from Task 2.

- [ ] **Step 1: Write failing registry and document-contract tests**

Create `test/react/lab-documents.test.tsx`. Mock DevTools and reset the hash. Assert:

```tsx
expect(labDocuments.map(({ path }) => path)).toEqual([
  "/foundations",
  "/components/button",
  "/components/button-link",
  "/components/text-input",
  "/components/progress-bar",
  "/components/icons",
]);
expect(new Set(labDocuments.map(({ path }) => path)).size).toBe(labDocuments.length);
```

For each component hash, render `App` and assert one level-one heading, an import code sample, a `StatusTag` label of `Beta`, a theme group named `Preview theme`, a Props heading, and an Accessibility heading. Use these representative live assertions:

```tsx
window.history.replaceState(null, "", "#/components/button");
render(<App />);
expect(screen.getByRole("button", { name: "Primary" })).toBeVisible();
expect(screen.getByRole("button", { name: "Unavailable action" })).toBeDisabled();

window.history.replaceState(null, "", "#/components/text-input");
render(<App />);
expect(screen.getByRole("textbox", { name: "Error input" })).toHaveAttribute(
  "aria-invalid",
  "true",
);

window.history.replaceState(null, "", "#/components/progress-bar");
render(<App />);
expect(screen.getByRole("progressbar", { name: "Upload progress" })).toHaveAttribute(
  "aria-valuenow",
  "45",
);
```

Read every document source file and assert it contains `from "@calebhill/base"` where it renders package primitives. Across all lab source, reject `../../src`, `src/components`, `next/`, `vercel`, `tailwind`, `photos-me`, and `calebhill.me`. Assert `StatusTag` remains absent from `src/index.ts`, package CSS, and `package.json`.

Run axe against Button, Text Input, and Foundations documents with jsdom color-contrast disabled, matching the existing test convention.

On Button, press Dark and assert the preview surface changes to `data-base-theme="dark"`. Select Text Input, assert its preview begins at `data-base-theme="light"`, then return to Button and assert its newly mounted preview also begins in light.

- [ ] **Step 2: Run the document tests and verify focused failures**

Run:

```sh
pnpm exec vitest run test/react/lab-documents.test.tsx
```

Expected: FAIL because the minimal document modules contain only headings.

- [ ] **Step 3: Implement the shared document primitives**

Use these exact public shapes:

```tsx
export function DocumentHeader(props: {
  title: string;
  summary: string;
  importStatement?: string;
  status?: LabStatus;
}): ReactElement;

export function ThemeControl(props: {
  theme: BaseTheme;
  onChange: (theme: BaseTheme) => void;
}): ReactElement;

export function Specimen(props: {
  title: string;
  theme: BaseTheme;
  onThemeChange: (theme: BaseTheme) => void;
  children: ReactNode;
}): ReactElement;

export function CodeSample(props: { code: string }): ReactElement;

export interface PropDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export function PropsTable(props: { props: ReadonlyArray<PropDefinition> }): ReactElement;

export function AccessibilityNotes(props: { children: ReactNode }): ReactElement;
```

`ThemeControl` renders a labelled group with native buttons named Light and Dark and `aria-pressed`. `Specimen` applies `{ [BASE_THEME_ATTRIBUTE]: theme }` to `.lab-preview-surface`. `CodeSample` uses `<pre><code>`. `PropsTable` uses a caption of `Public props` plus Name, Type, Default, and Description column headers. `AccessibilityNotes` renders a section with a level-two `Accessibility` heading and a list supplied by the document.

Move the existing status tag into `lab/src/components/status-tag.tsx`, update imports, preserve the `LabStatus` union and visible labels, and do not export it from package source.

- [ ] **Step 4: Finalize Foundations and Button documents**

Remove the intermediate component panels from `FoundationsDocument` while retaining both foundation theme panels because foundation parity is the subject of that document. Preserve semantic colors, all type roles, link surfaces, inline code, tabular numerals, press/focus specimen, and scoped consumer accent override.

Implement `ButtonDocument` with one document-level `useState<BaseTheme>("light")`. Render all six exact variants, default and icon sizes, More and Trash icon controls with accessible names, a disabled Button, code:

```tsx
<Button variant="primary">Primary</Button>
```

Document Base-owned props `variant`, `size`, `aria-label` for icon size, `disabled`, `className`, and `ref`, plus native button attribute forwarding. Accessibility notes cover native button semantics, required icon-control names, visible focus, native disabled behavior, and reduced-motion press feedback.

- [ ] **Step 5: Implement Button Link, Text Input, Progress Bar, and Icons documents**

Use one `useState<BaseTheme>("light")` per component document.

- Button Link: six variants, default and icon sizes, real `href`, accessible icon label, no disabled example, public props and native anchor forwarding. State explicitly in the behavior summary—not as usage advice—that Base exposes no disabled anchor contract.
- Text Input: default, filled, disabled, and error specimens; show `error`, native input props, ref, className, and description composition; accessibility notes cover `aria-invalid`, `aria-describedby`, alert semantics, focus, and native disabled behavior.
- Progress Bar: values 0, 45, and 100; show accessible-name branches, normalization, `aria-valuetext`, native div props, and ref; accessibility notes cover determinate ARIA semantics and reduced motion.
- Icons: MoreIcon and TrashIcon in visible labelled specimens; show SVG prop forwarding, `currentColor`, default dimensions/view box, ref behavior only if public, and default decorative semantics. Do not invent an icon registry or size API.

Use concise factual summaries. Do not add “when to use,” “best for,” “avoid when,” recommendation callouts, product examples, or product compositions.

- [ ] **Step 6: Adapt existing canonical specimen tests**

Update `test/react/lab-components.test.tsx` so it visits the relevant hash before asserting each focused document rather than expecting two copies of everything on one page. Preserve assertions for all variants, icon accessible names, disabled state, TextInput error association, normalized progress value, lifecycle labels, public import paths, lab-only status colors, and representative axe coverage.

Update `test/react/lab-foundations.test.tsx` to set `#/foundations` before rendering. Preserve its accent/on-accent declaration and axe assertions.

- [ ] **Step 7: Run all lab tests and TypeScript**

Run:

```sh
pnpm exec vitest run test/react/lab-routing.test.tsx test/react/lab-documents.test.tsx test/react/lab-components.test.tsx test/react/lab-foundations.test.tsx
pnpm tsc --noEmit
```

Expected: PASS.

- [ ] **Step 8: Commit the complete document catalog**

```sh
git add lab/src/components lab/src/documents test/react/lab-documents.test.tsx test/react/lab-components.test.tsx test/react/lab-foundations.test.tsx
git commit -m "feat: document the Base component catalog"
```

---

### Task 4: Finish the public documentation presentation and responsive contracts

**Files:**
- Modify: `lab/src/lab.css`
- Modify: `test/react/lab-documents.test.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: all `lab-` classes rendered by Tasks 2 and 3.
- Produces: a sticky desktop rail, restrained reading column, explicit preview workbench, stacked narrow layout, props-table containment, focus treatment, and reduced-motion behavior.
- Produces: README instructions that continue to use `pnpm lab:dev`.

- [ ] **Step 1: Add failing CSS structure and responsive tests**

Parse `lab/src/lab.css` with PostCSS and assert declarations for:

```ts
expect(declarationsFor(".lab-app-shell").get("grid-template-columns")).toContain("rem");
expect(declarationsFor(".lab-sidebar").get("position")).toBe("sticky");
expect(declarationsFor(".lab-document").get("min-width")).toBe("0");
expect(declarationsFor(".lab-preview-surface").get("background")).toContain("--base-");
expect(declarationsFor(".lab-props-table-wrap").get("overflow-x")).toBe("auto");
```

Walk media queries and require:

- one `max-width` query that changes `.lab-app-shell` to one column;
- wrapping narrow navigation;
- no fixed pixel/rem `width` on the app shell or document;
- a `prefers-reduced-motion: reduce` rule covering lab transitions.

- [ ] **Step 2: Run the focused CSS test and verify it fails**

Run:

```sh
pnpm exec vitest run test/react/lab-documents.test.tsx
```

Expected: FAIL because the new shell and documentation classes are not styled yet.

- [ ] **Step 3: Replace the old page layout with the documentation shell styles**

Refactor `lab/src/lab.css` around these requirements:

```css
:root {
  color: var(--base-color-text-primary);
  background: var(--base-color-background);
}

.lab-app-shell {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  min-height: 100dvh;
}

.lab-sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100dvh;
  overflow-y: auto;
}

.lab-document {
  min-width: 0;
  width: min(100%, 64rem);
  margin-inline: auto;
}

.lab-props-table-wrap {
  max-width: 100%;
  overflow-x: auto;
}

@media (max-width: 48rem) {
  .lab-app-shell { grid-template-columns: minmax(0, 1fr); }
  .lab-sidebar { position: static; height: auto; overflow: visible; }
}

@media (prefers-reduced-motion: reduce) {
  .lab-nav-link,
  .lab-theme-button { transition: none; }
}
```

Derive colors, borders, radii, spacing, and type from existing Base custom properties. Keep the rail quiet and let `.lab-preview-surface` be the visually distinct workbench. Reuse the existing readable lifecycle colors and contrast tests. Remove obsolete two-panel page-layout selectors after their specimens move into focused documents.

- [ ] **Step 4: Update README lab documentation**

Keep the existing `pnpm lab:dev` command and describe the lab as the public component reference with hash-linkable documents. State that it consumes public package paths and remains excluded from the npm artifact. Do not claim `base.calebhill.me` is deployed; link that work to CLB-726 only if the README already references delivery tickets.

- [ ] **Step 5: Run focused UI contracts and build**

Run:

```sh
pnpm exec vitest run test/react/lab-routing.test.tsx test/react/lab-documents.test.tsx test/react/lab-components.test.tsx test/react/lab-foundations.test.tsx
pnpm lab:build
pnpm tsc --noEmit
git diff --check
```

Expected: all PASS.

- [ ] **Step 6: Commit the public documentation presentation**

```sh
git add lab/src/lab.css test/react/lab-documents.test.tsx README.md
git commit -m "feat: style the public Base documentation lab"
```

---

### Task 5: Simplify, verify, and visually review V1

**Files:**
- Modify only files already changed by Tasks 1-4 when simplification or verification finds a scoped issue.

**Interfaces:**
- Consumes: the complete CLB-703 implementation.
- Produces: a clean, verified branch ready for pull-request delivery.

- [ ] **Step 1: Run the required simplification pass**

Review `git diff main...HEAD` for duplicate document markup, speculative abstractions, repeated registry data, unused CSS, brittle tests, and prose that crosses into consumer usage policy. Preserve the explicit routing, registry, per-document, and public-package boundaries from the spec.

Apply only scoped simplifications with `apply_patch`, then inspect:

```sh
git diff --stat main...HEAD
git diff --check main...HEAD
```

- [ ] **Step 2: Run the complete repository verification gate**

Run:

```sh
pnpm verify
pnpm tsc --noEmit
git diff --check main...HEAD
```

Expected: lint, explicit TypeScript,  all tests, package build, lab build, tarball contracts, and clean Vite/Next consumer fixtures PASS.

- [ ] **Step 3: Run the lab and complete manual acceptance**

Start:

```sh
pnpm lab:dev
```

Review the real lab at the printed URL and verify:

- desktop sticky left navigation and focused right document;
- narrow one-column navigation and no horizontal page overflow;
- 200 percent zoom;
- all six hash URLs, refresh, browser back, and browser forward;
- skip link, keyboard traversal, visible focus, and active navigation state;
- every current document and live specimen;
- light and dark preview controls;
- props-table containment;
- reduced-motion emulation;
- no product-level usage recommendations.

Stop the dev server after review. Record any environment limitation honestly rather than substituting a build for unavailable interaction review.

- [ ] **Step 4: Commit verification fixes if needed**

If Steps 1-3 changed files:

```sh
git add <only-the-scoped-files-changed-during-review>
git commit -m "fix: polish public component documentation"
```

If no files changed, do not create an empty commit.

- [ ] **Step 5: Prepare the delivery record**

Record for CLB-703:

- worktree branch and head commit;
- exact automated verification results;
- manual desktop, narrow, zoom, keyboard, history, themes, and reduced-motion results;
- confirmation that documentation imports only public package paths;
- confirmation that package exports, CSS, and tarball are unchanged;
- confirmation that CLB-726 still owns deployment and `base.calebhill.me`.

Then open the pull request, wait for green checks, merge the verified head, mark CLB-703 Done, fast-forward the clean root `main`, and remove only `chill/clb-703-public-docs-v1` and its worktree according to the repository delivery workflow.
