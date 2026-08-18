# Base Alpha Package Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the exact packed Base alpha artifact exposes only the approved runtime, type, CSS, metadata, and dependency contract in a standalone Vite consumer.

**Architecture:** Extend the existing real-`pnpm pack` gate instead of testing source aliases. One package-contract script packs and extracts the artifact, then validates its exact file list, package metadata, runtime keys, declarations, CSS entries, and forbidden strings. The standalone fixture installs that tarball offline, imports every public alpha component/type through documented exports, and typechecks/builds without Tailwind or application aliases.

**Tech Stack:** Node.js ESM scripts, pnpm pack, tar, React 19, TypeScript, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-17-alpha-component-slice-design.md`

## Global Constraints

- Inspect the actual `.tgz` created by `pnpm pack`; source-only assertions are insufficient.
- The exact runtime exports are `BASE_THEME_ATTRIBUTE`, `Button`, `ButtonLink`, `MoreIcon`, `ProgressBar`, `TextInput`, `TrashIcon`, and `isBaseTheme`.
- The declaration surface includes the approved runtime declarations plus `BaseTheme`, `ButtonProps`, `ButtonLinkProps`, `ButtonVariant`, `ButtonSize`, `TextInputProps`, and `ProgressBarProps`.
- The package exports only `.`, `./tokens.css`, and `./styles.css`; CSS side effects are exactly the two public CSS entries.
- The tarball contains only `LICENSE`, `README.md`, `package.json`, and the four built files under `dist/`.
- The fixture must not use source imports, application aliases, Tailwind, Next.js, Vercel modules, product modules, or `StatusTag`.
- `StatusTag` and warning/beta documentation colors remain lab-only under CLB-716 and must be absent from runtime, declarations, public CSS, metadata, and fixture.
- Do not add a Changeset because this ticket strengthens release gates without changing the public package API.
- Temporary directories must be uniquely owned by each command and removed on both success and failure.
- Run `pnpm verify`, `pnpm tsc --noEmit`, and `git diff --check` before committing.

---

### Task 1: Strengthen the real-tarball contract and standalone consumer

**Files:**
- Modify: `scripts/assert-tarball-contents.mjs`
- Modify: `scripts/test-packed-fixture.mjs`
- Modify: `test/contracts/tarball-contents.test.ts`
- Create: `test/contracts/packed-package.test.ts`
- Modify: `test/contracts/forbidden-imports.test.ts`
- Modify: `test/fixtures/vite-smoke/src/main.tsx`
- Modify: `test/fixtures/vite-smoke/package.json`
- Modify: `test/fixtures/vite-smoke/pnpm-lock.yaml` only if the fixture dependency graph changes

**Interfaces:**
- Consumes the packed `@calebhill/base@0.0.0` artifact produced by the current branch.
- Produces one exact artifact contract and one independent Vite consumer proof.
- Does not modify public source, CSS, exports, package metadata, or Changesets unless a failing artifact contract proves the existing package is incorrect; report that before changing it.

- [ ] **Step 1: Write failing packed-artifact contract tests**

Create `test/contracts/packed-package.test.ts` that invokes the pack assertion script and mutation-proves its contract. Refactor the script to accept an optional package-root argument only if that makes mutations deterministic; production execution must still default to the repository root.

The tests must fail when a temporary extracted package is mutated to:

- add a runtime export;
- remove an approved declaration;
- add `StatusTag` to declarations or CSS;
- add a fourth export path;
- remove a CSS side effect;
- add a forbidden dependency or product string;
- add an unexpected tarball file.

Prefer exported pure assertion helpers in a test-only or script module over shell string matching. Each mutation must fail for the expected contract reason.

Run:

```sh
pnpm exec vitest run test/contracts/packed-package.test.ts test/contracts/tarball-contents.test.ts
```

Expected: FAIL because the current script checks only the file list.

- [ ] **Step 2: Extend the pack assertion script**

Enhance `scripts/assert-tarball-contents.mjs` so one command:

1. creates a unique temporary directory under `.tmp/`;
2. runs `pnpm pack --pack-destination <dir>`;
3. lists and checks the exact files;
4. extracts the tarball;
5. reads packed `package.json`, `dist/index.js`, `dist/index.d.ts`, `dist/tokens.css`, and `dist/styles.css`;
6. dynamically imports packed `dist/index.js` and compares sorted runtime keys to:

```js
[
  "BASE_THEME_ATTRIBUTE",
  "Button",
  "ButtonLink",
  "MoreIcon",
  "ProgressBar",
  "TextInput",
  "TrashIcon",
  "isBaseTheme",
]
```

7. verifies declarations for the approved types and no `StatusTag`;
8. verifies exact exports and side effects:

```js
const expectedExports = [".", "./styles.css", "./tokens.css"];
const expectedSideEffects = ["./dist/styles.css", "./dist/tokens.css"];
```

9. verifies `tokens.css` remains token-only and `styles.css` contains all three component sentinels/classes;
10. scans packed JS, declarations, CSS, and metadata for forbidden application aliases, Next.js, Vercel, product module names, `StatusTag`, and public warning/beta variables;
11. removes its exact temporary directory in `finally`.

Do not parse minified implementation details beyond the stable public contract.

- [ ] **Step 3: Lock cleanup and failure behavior**

Extend `test/contracts/tarball-contents.test.ts` to assert the new uniquely named temporary root is removed after both success and a shimmed `pnpm pack` failure. Do not use a repository-wide glob for deletion. Run the two tarball contract files and verify GREEN.

- [ ] **Step 4: Expand the standalone fixture through public imports**

Update `test/fixtures/vite-smoke/src/main.tsx` to import every runtime component and representative public types from `@calebhill/base`, plus only the complete public stylesheet:

```tsx
import {
  BASE_THEME_ATTRIBUTE,
  Button,
  ButtonLink,
  MoreIcon,
  ProgressBar,
  TextInput,
  TrashIcon,
  type ButtonProps,
  type ProgressBarProps,
  type TextInputProps,
} from "@calebhill/base";
import "@calebhill/base/styles.css";
```

Render representative light-theme components with native props and accessible names:

```tsx
<Button data-fixture="button">Save</Button>
<ButtonLink href="#fixture">Button link</ButtonLink>
<Button aria-label="More" size="icon"><MoreIcon /></Button>
<Button aria-label="Delete" size="icon" variant="destructive"><TrashIcon /></Button>
<TextInput aria-label="Caption" error="Caption is required" />
<ProgressBar aria-label="Upload progress" value={45} />
```

Use the imported prop types in real typed constants so the generated declarations are exercised by `tsc`. Do not import `StatusTag`, source paths, aliases, or individual CSS internals.

- [ ] **Step 5: Add fixture source and dependency boundary checks**

Extend `test/contracts/forbidden-imports.test.ts` or the new packed contract file to read the fixture source and package metadata. Assert:

- only `@calebhill/base` and `@calebhill/base/styles.css` Base imports occur;
- all approved runtime component identifiers and public types appear;
- `StatusTag`, `@/`, `~/`, `../../src`, Tailwind, Next.js, Vercel, `photos-me`, and `calebhill.me` do not appear;
- fixture dependencies contain React/ReactDOM and build tooling only before the tarball is installed by the script.

Run:

```sh
pnpm exec vitest run test/contracts/forbidden-imports.test.ts test/contracts/packed-package.test.ts
```

Expected: PASS after the fixture and contract updates.

- [ ] **Step 6: Verify the installed tarball consumer**

Run:

```sh
pnpm build
pnpm test:tarball
pnpm fixture:test
```

Expected: the script packs the current artifact, installs it into a fresh isolated fixture without Tailwind, then the fixture typechecks and builds from the installed tarball.

- [ ] **Step 7: Run mutation checks for the publish blocker**

Temporarily apply each mutation named in Step 1 to the extracted-package test fixture or helper input and capture the expected RED result. Restore the clean tree after each mutation. Record the commands and failure reasons in the implementation report so reviewers can distinguish real mutation evidence from assertions that only ever passed.

- [ ] **Step 8: Run the delivery gate and commit**

Run:

```sh
pnpm verify
pnpm tsc --noEmit
git diff --check
```

Commit only this ticket's package gate, fixture, tests, and plan:

```sh
git add docs/superpowers/plans/2026-08-17-alpha-package-gate.md scripts test
git commit -m "test: harden the Base alpha package gate"
```

Record in Linear that the actual tarball runtime, declarations, CSS, metadata, exact file list, forbidden dependencies, and standalone Vite consumer are green. Publication remains blocked on CLB-716 until both tickets are Done.
