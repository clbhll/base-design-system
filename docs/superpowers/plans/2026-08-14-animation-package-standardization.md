# CLB-697 Animation Package Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize the shared motion package around the public npm identity `@calebhill/animations`, remove its published `framer-motion` dependency surface, prove its public structural types still compile in current `framer-motion` consumers, and migrate `calebhill.me` off the historical `@clbhll/animations` GitHub Packages dependency.

**Architecture:** `clb-animations` owns the package contract, compatibility fixture, release prep, and npm publish. `calebhill.me` owns the consumer migration after the package release is merged and published. The package keeps the same runtime exports, replaces its declaration-time `framer-motion` types with package-owned structural types, removes the published peer dependency, and proves compatibility by typechecking a fixture that consumes the built package alongside `framer-motion`.

**Tech Stack:** pnpm 10, TypeScript 5, tsup, Node `node:test`, Next.js 16, React 19, `framer-motion` 12 for compatibility testing only

**Spec:** `docs/superpowers/specs/2026-08-14-base-design-system-alpha-design.md`

## Global Constraints

- CLB-697 precedes package scaffolding and locks the canonical identity to `@calebhill/animations` on the public npm registry.
- `calebhill.me` moves off the historical `@clbhll/animations` GitHub Packages release.
- `@calebhill/animations` remains the canonical source for reusable motion constants and will become a direct runtime dependency when the first exported animated component needs it.
- CLB-697 must document that the current package's `framer-motion` reference is type-only and decide its long-term public type contract before animated base components ship.
- The published `@calebhill/animations` package must have no runtime dependency and no peer dependency on `framer-motion`.
- `framer-motion` may remain a dev-only dependency in `clb-animations` solely to compile the compatibility fixture.
- Never publish from an unmerged branch. Publish only after the package PR merges, `main` is updated locally, and the merged commit is checked out.
- Preserve unrelated dirty files. Today `calebhill.me` already has unrelated tracked and untracked changes, and `clb-animations` has an unrelated untracked `.claude/` directory.

---

## File Map

### Execution Repo: `/Users/clbhll/code/clb-animations`

- Modify: `/Users/clbhll/code/clb-animations/package.json` — remove the published `framer-motion` peer dependency, keep it dev-only for tests, and bump the package version to `0.6.0`.
- Modify: `/Users/clbhll/code/clb-animations/src/index.ts` — replace exported `framer-motion` type annotations with package-owned structural types.
- Create: `/Users/clbhll/code/clb-animations/src/public-types.ts` — define the stable public motion types.
- Modify: `/Users/clbhll/code/clb-animations/tsup.config.ts` — remove the stale `external: ["framer-motion"]` setting once source imports are gone.
- Modify: `/Users/clbhll/code/clb-animations/README.md` — document the npm identity, zero published `framer-motion` dependency surface, and the structural type contract.
- Modify: `/Users/clbhll/code/clb-animations/test/exports.test.mjs` — keep the runtime export regression.
- Create: `/Users/clbhll/code/clb-animations/test/public-types.test.mjs` — assert the built declaration file and built package metadata no longer reference `framer-motion`.
- Create: `/Users/clbhll/code/clb-animations/test/fixtures/framer-motion-consumer/package.json` — isolated consumer fixture manifest with `framer-motion`, `react`, `react-dom`, and `typescript`.
- Create: `/Users/clbhll/code/clb-animations/test/fixtures/framer-motion-consumer/tsconfig.json` — compile-only fixture config.
- Create: `/Users/clbhll/code/clb-animations/test/fixtures/framer-motion-consumer/index.ts` — assignability fixture proving current consumers can pass package exports to `framer-motion` APIs.

### Execution Repo: `/Users/clbhll/code/calebhill.me`

- Delete: `/Users/clbhll/code/calebhill.me/.npmrc` — it currently contains only the obsolete `@clbhll` GitHub Packages registry and auth-token lines.
- Modify: `/Users/clbhll/code/calebhill.me/package.json` — remove `@clbhll/animations` and add `@calebhill/animations@^0.6.0`.
- Modify: `/Users/clbhll/code/calebhill.me/pnpm-lock.yaml` — replace the GitHub Packages tarball with the public npm package.
- Modify: `/Users/clbhll/code/calebhill.me/src/components/hero.tsx` — retarget the animation import.
- Modify: `/Users/clbhll/code/calebhill.me/src/components/project-list.tsx` — retarget the animation import.
- Modify: `/Users/clbhll/code/calebhill.me/src/components/inspiration-grid.tsx` — retarget the animation import.
- Modify: `/Users/clbhll/code/calebhill.me/src/components/experiments/experiment-grid.tsx` — retarget the animation import.
- Modify: `/Users/clbhll/code/calebhill.me/src/styles/globals.css` — update the motion-token comment to the new package name.

### Plan Repo: `/Users/clbhll/code/base-design-system/.worktrees/chill-clb-691-package-foundation`

- Create: `docs/superpowers/plans/2026-08-14-animation-package-standardization.md` — this execution plan only; no production code lands here.

## Worktree And Branch Boundaries

Use fresh execution worktrees so the existing unrelated edits stay untouched. Do not create project-local `.worktrees` directories unless the executor first uses `superpowers:using-git-worktrees` to verify or safely add the needed ignore rules. This plan instead uses sibling worktree directories under `/Users/clbhll/code/` to avoid unignored project-local folders.

### `clb-animations`

- Base branch today: `main`
- Existing unrelated state today: `?? .claude/`
- Create a dedicated worktree and branch:

```bash
git -C /Users/clbhll/code/clb-animations worktree add /Users/clbhll/code/chill-clb-697-standardize-animations -b chill/clb-697-standardize-animations main
```

### `calebhill.me`

- Base branch today: `main`
- Existing unrelated state today:
  - ` M .gitignore`
  - ` M content/atlas.mdx`
  - ` M docs/superpowers/specs/2026-07-28-about-page-positioning-design.md`
  - ` M src/components/experiments/examples/success-button-example.tsx`
  - ` M src/components/experiments/success-button.tsx`
  - `?? AGENTS.md`
  - `?? content/design-system-qa-skill-outline.md`
  - `?? content/maybe-figma-is-the-source-of-truth-outline.md`
  - `?? docs/superpowers/plans/2026-08-05-atlas-coming-soon.md`
- Create a dedicated worktree and branch:

```bash
git -C /Users/clbhll/code/calebhill.me worktree add /Users/clbhll/code/chill-clb-697-animation-migration -b chill/clb-697-animation-migration main
```

Do all execution inside those new worktrees. Never stage, revert, or format files outside the paths listed in this plan.

## PR Boundaries

1. `clb-animations` PR: package-owned public types, zero published `framer-motion` dependency surface, compatibility fixture, tests, docs, version bump.
2. `calebhill.me` PR: `.npmrc` removal, dependency migration to the published npm package, import rewrites, lockfile refresh, and app verification.

Merge and publish in this order only:

1. Merge the `clb-animations` PR after CI passes.
2. Update local `main` in the `clb-animations` repo to that merged commit.
3. Publish `@calebhill/animations@0.6.0` from updated `main`.
4. Verify npm registry state.
5. Prepare or update the `calebhill.me` PR against the published version.
6. Merge the `calebhill.me` PR after verification passes.

### Task 1: Set Up Safe Execution Surfaces

**Files:**
- Modify: none
- Test: none

**Interfaces:**
- Consumes:
  - `/Users/clbhll/code/clb-animations` on branch `main`
  - `/Users/clbhll/code/calebhill.me` on branch `main`
- Produces:
  - `/Users/clbhll/code/chill-clb-697-standardize-animations`
  - `/Users/clbhll/code/chill-clb-697-animation-migration`

- [ ] **Step 1: Create the `clb-animations` execution worktree**

Run: `git -C /Users/clbhll/code/clb-animations worktree add /Users/clbhll/code/chill-clb-697-standardize-animations -b chill/clb-697-standardize-animations main`
Expected: new clean worktree on `chill/clb-697-standardize-animations`

- [ ] **Step 2: Create the `calebhill.me` execution worktree**

Run: `git -C /Users/clbhll/code/calebhill.me worktree add /Users/clbhll/code/chill-clb-697-animation-migration -b chill/clb-697-animation-migration main`
Expected: new clean worktree on `chill/clb-697-animation-migration`

- [ ] **Step 3: Verify unrelated dirty files stay out of scope**

Run: `git -C /Users/clbhll/code/calebhill.me status --short`
Expected: the existing dirty files remain in the original repo checkout, not in `/Users/clbhll/code/chill-clb-697-animation-migration`

Run: `git -C /Users/clbhll/code/clb-animations status --short`
Expected: `?? .claude/` remains only in the original repo checkout, not in `/Users/clbhll/code/chill-clb-697-standardize-animations`

- [ ] **Step 4: Commit**

No commit for this task. Proceed once both worktrees are clean and isolated.

### Task 2: Replace Package Types And Remove Published `framer-motion` Dependency Surface

**Files:**
- Create: `/Users/clbhll/code/chill-clb-697-standardize-animations/src/public-types.ts`
- Modify: `/Users/clbhll/code/chill-clb-697-standardize-animations/src/index.ts`
- Modify: `/Users/clbhll/code/chill-clb-697-standardize-animations/package.json`
- Modify: `/Users/clbhll/code/chill-clb-697-standardize-animations/tsup.config.ts`
- Test: `/Users/clbhll/code/chill-clb-697-standardize-animations/test/public-types.test.mjs`

**Interfaces:**
- Consumes: current runtime exports from `src/index.ts`
- Produces:
  - `export type MotionEasing = [number, number, number, number]`
  - `export interface MotionTransition { type?: "tween" | "spring"; duration?: number; ease?: MotionEasing; stiffness?: number; damping?: number; staggerChildren?: number; delayChildren?: number }`
  - `export interface MotionVariantState { opacity?: number; filter?: string; transform?: string; transition?: MotionTransition }`
  - `export type MotionVariants = Record<string, MotionVariantState>`
  - `getHeaderItemVariants(reduceMotion: boolean | null): MotionVariants`
  - `getContentItemVariants(reduceMotion: boolean | null): MotionVariants`
  - published `package.json` with no `peerDependencies.framer-motion`

- [ ] **Step 1: Write the failing package-surface test**

```js
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("dist declarations and package metadata no longer reference framer-motion", async () => {
  const dts = await fs.readFile(new URL("../dist/index.d.ts", import.meta.url), "utf8");
  const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.match(dts, /export type MotionEasing = \[number, number, number, number\]/);
  assert.match(dts, /export interface MotionTransition/);
  assert.match(dts, /export type MotionVariants = Record<string, MotionVariantState>/);
  assert.doesNotMatch(dts, /from "framer-motion"/);
  assert.equal(pkg.peerDependencies?.["framer-motion"], undefined);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL because `dist/index.d.ts` still imports from `framer-motion` and `package.json` still declares `peerDependencies.framer-motion`

- [ ] **Step 3: Implement the package-owned structural types**

```ts
// src/public-types.ts
export type MotionEasing = [number, number, number, number];

export interface MotionTransition {
  type?: "tween" | "spring";
  duration?: number;
  ease?: MotionEasing;
  stiffness?: number;
  damping?: number;
  staggerChildren?: number;
  delayChildren?: number;
}

export interface MotionVariantState {
  opacity?: number;
  filter?: string;
  transform?: string;
  transition?: MotionTransition;
}

export type MotionVariants = Record<string, MotionVariantState>;
```

```ts
// src/index.ts
import type {
  MotionEasing,
  MotionTransition,
  MotionVariants,
} from "./public-types";

export type {
  MotionEasing,
  MotionTransition,
  MotionVariantState,
  MotionVariants,
} from "./public-types";
```

- [ ] **Step 4: Replace `framer-motion` type annotations and remove the published dependency surface**

```ts
const weightedEaseOut: MotionEasing = [0.22, 1, 0.36, 1];

export const easingConfigs = {
  general: { type: "tween", duration: 0.72, ease: weightedEaseOut } as MotionTransition,
  headerStagger: { type: "tween", duration: 1.8, ease: weightedEaseOut } as MotionTransition,
  listStagger: { type: "tween", duration: 1.2, ease: weightedEaseOut } as MotionTransition,
} as const;

export const headerContainerVariants: MotionVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};
```

```json
{
  "version": "0.6.0",
  "devDependencies": {
    "framer-motion": "^12.34.5"
  }
}
```

Remove this block from `package.json`:

```json
"peerDependencies": {
  "framer-motion": ">=11.0.0"
}
```

Remove this line from `tsup.config.ts`:

```ts
external: ["framer-motion"],
```

- [ ] **Step 5: Run the package tests and typecheck**

Run: `pnpm test`
Expected: PASS for `test/exports.test.mjs` and `test/public-types.test.mjs`

Run: `pnpm typecheck`
Expected: PASS with no source-level `framer-motion` type imports

- [ ] **Step 6: Commit**

```bash
git -C /Users/clbhll/code/chill-clb-697-standardize-animations add src/public-types.ts src/index.ts package.json tsup.config.ts test/public-types.test.mjs test/exports.test.mjs
git -C /Users/clbhll/code/chill-clb-697-standardize-animations commit -m "feat: own animation package public types"
```

### Task 3: Prove Compatibility For Current `framer-motion` Consumers

**Files:**
- Create: `/Users/clbhll/code/chill-clb-697-standardize-animations/test/fixtures/framer-motion-consumer/package.json`
- Create: `/Users/clbhll/code/chill-clb-697-standardize-animations/test/fixtures/framer-motion-consumer/tsconfig.json`
- Create: `/Users/clbhll/code/chill-clb-697-standardize-animations/test/fixtures/framer-motion-consumer/index.ts`
- Modify: `/Users/clbhll/code/chill-clb-697-standardize-animations/package.json`

**Interfaces:**
- Consumes:
  - built package declarations from `dist/index.d.ts`
  - `framer-motion` dev dependency in the repo root for test-only compatibility checks
- Produces:
  - compile-only fixture that typechecks these assignments:
    - `const transition: Transition = easingConfigs.general`
    - `const variants: Variants = getContentItemVariants(false)`

- [ ] **Step 1: Write the failing compatibility fixture**

```ts
// test/fixtures/framer-motion-consumer/index.ts
import type { Transition, Variants } from "framer-motion";
import {
  easingConfigs,
  getContentItemVariants,
} from "../../../dist/index.js";

const transition: Transition = easingConfigs.general;
const variants: Variants = getContentItemVariants(false);

void transition;
void variants;
```

```json
// test/fixtures/framer-motion-consumer/package.json
{
  "private": true,
  "type": "module",
  "dependencies": {
    "framer-motion": "^12.34.5",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "typescript": "^5.8.2"
  }
}
```

```json
// test/fixtures/framer-motion-consumer/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["index.ts"]
}
```

- [ ] **Step 2: Add the compatibility command to the root package scripts**

```json
{
  "scripts": {
    "test:compat": "pnpm --dir test/fixtures/framer-motion-consumer exec tsc -p tsconfig.json"
  }
}
```

- [ ] **Step 3: Install the fixture after Task 2 is complete**

Run: `pnpm --dir test/fixtures/framer-motion-consumer install`
Expected: fixture dependencies installed locally under the fixture only

Run: `pnpm test:compat`
Expected: PASS, proving current `framer-motion` consumers can assign package exports to native `framer-motion` types

- [ ] **Step 4: Commit**

```bash
git -C /Users/clbhll/code/chill-clb-697-standardize-animations add package.json test/fixtures/framer-motion-consumer/package.json test/fixtures/framer-motion-consumer/tsconfig.json test/fixtures/framer-motion-consumer/index.ts
git -C /Users/clbhll/code/chill-clb-697-standardize-animations commit -m "test: add animation consumer compatibility fixture"
```

### Task 4: Document, Pack, And Validate The Package Before PR

**Files:**
- Modify: `/Users/clbhll/code/chill-clb-697-standardize-animations/README.md`
- Modify: `/Users/clbhll/code/chill-clb-697-standardize-animations/package.json`
- Test: `/Users/clbhll/code/chill-clb-697-standardize-animations/test/public-types.test.mjs`

**Interfaces:**
- Consumes:
  - Task 2 structural types
  - Task 3 compatibility fixture
- Produces:
  - README install command `npm install @calebhill/animations`
  - README language: no published runtime or peer dependency on `framer-motion`
  - validated tarball for `@calebhill/animations@0.6.0`

- [ ] **Step 1: Add the failing README assertions**

```js
test("README explains the npm install and zero published framer-motion dependency surface", async () => {
  const readme = await fs.readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.match(readme, /npm install @calebhill\/animations/);
  assert.doesNotMatch(readme, /npm install @calebhill\/animations framer-motion/);
  assert.match(readme, /no published runtime dependency or peer dependency on framer-motion/i);
  assert.match(readme, /MotionTransition/);
  assert.match(readme, /MotionVariants/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL because the current README still tells consumers to install `framer-motion`

- [ ] **Step 3: Update the README**

```md
## Install

    npm install @calebhill/animations

This package publishes plain JavaScript motion constants and package-owned
TypeScript structural types. It has no published runtime dependency and no peer
dependency on `framer-motion`.

## Compatibility with framer-motion

Current `framer-motion` consumers can keep assigning `easingConfigs` and
`getContentItemVariants()` to `Transition` and `Variants`. The compatibility
fixture under `test/fixtures/framer-motion-consumer/` typechecks that contract.
```

- [ ] **Step 4: Build and validate the local artifact**

Run: `pnpm build`
Expected: PASS and regenerate `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, and `dist/index.d.cts`

Run: `pnpm test`
Expected: PASS

Run: `pnpm test:compat`
Expected: PASS

Run: `pnpm pack --pack-destination /tmp/clb-animations-pack`
Expected: creates `/tmp/clb-animations-pack/calebhill-animations-0.6.0.tgz`

Run: `tar -tf /tmp/clb-animations-pack/calebhill-animations-0.6.0.tgz`
Expected: includes `package/dist/index.js`, `package/dist/index.cjs`, `package/dist/index.d.ts`, `package/dist/index.d.cts`, `package/README.md`, and `package/package.json`

Run: `tar -xOf /tmp/clb-animations-pack/calebhill-animations-0.6.0.tgz package/package.json | rg -n "\"peerDependencies\"|\"framer-motion\""`
Expected: no output

Run: `tar -xOf /tmp/clb-animations-pack/calebhill-animations-0.6.0.tgz package/dist/index.d.ts | rg -n "framer-motion"`
Expected: no output

- [ ] **Step 5: Run `/simplify`, then commit and open the package PR**

Run: `/simplify`
Expected: any obvious local code/documentation simplifications are applied before the PR is opened

```bash
git -C /Users/clbhll/code/chill-clb-697-standardize-animations add README.md package.json
git -C /Users/clbhll/code/chill-clb-697-standardize-animations commit -m "docs: codify animation package contract"
```

PR scope: only `clb-animations`; title it `CLB-697 standardize @calebhill/animations contract`

### Task 5: Merge, Update `main`, Publish, And Verify npm

**Files:**
- Modify: none
- Test: none

**Interfaces:**
- Consumes:
  - merged `clb-animations` PR from Task 4
  - local `main` updated to the merged commit
- Produces:
  - published `@calebhill/animations@0.6.0`
  - registry verification that the live artifact has no `framer-motion` runtime or peer dependency surface

- [ ] **Step 1: Wait for CI and merge the package PR**

Run: `gh pr checks --watch`
Expected: all required checks pass for the `clb-animations` PR

Run: `gh pr merge --squash --delete-branch`
Expected: PR merged; branch deleted on the remote

- [ ] **Step 2: Update local `main` to the merged commit**

Run: `git -C /Users/clbhll/code/clb-animations switch main`
Expected: current branch is `main`

Run: `git -C /Users/clbhll/code/clb-animations pull --ff-only`
Expected: local `main` matches the merged remote commit

- [ ] **Step 3: Publish from updated `main`**

Run: `pnpm build`
Expected: PASS on local `main`

Run: `npm view @calebhill/animations version dist-tags --json`
Expected: shows the pre-publish live version before release

Run: `npm publish --access public`
Expected: publish `@calebhill/animations@0.6.0` from local `main`

- [ ] **Step 4: Verify the published registry artifact**

Run: `npm view @calebhill/animations version dist-tags --json`
Expected: `version` and `dist-tags.latest` resolve to `0.6.0`

Run: `npm view @calebhill/animations peerDependencies dependencies --json`
Expected: no `framer-motion` entry in either object

- [ ] **Step 5: Update Linear**

Use the Linear issue `CLB-697`:

1. Set or confirm the estimate before opening the package PR.
2. Add a progress comment after the package PR merges and `0.6.0` is published.
3. Keep the issue open until the consumer migration merges.

### Task 6: Remove Obsolete GitHub Packages Auth And Swap The Consumer Dependency

**Files:**
- Delete: `/Users/clbhll/code/chill-clb-697-animation-migration/.npmrc`
- Modify: `/Users/clbhll/code/chill-clb-697-animation-migration/package.json`
- Modify: `/Users/clbhll/code/chill-clb-697-animation-migration/pnpm-lock.yaml`
- Modify: `/Users/clbhll/code/chill-clb-697-animation-migration/src/components/hero.tsx`
- Modify: `/Users/clbhll/code/chill-clb-697-animation-migration/src/components/project-list.tsx`
- Modify: `/Users/clbhll/code/chill-clb-697-animation-migration/src/components/inspiration-grid.tsx`
- Modify: `/Users/clbhll/code/chill-clb-697-animation-migration/src/components/experiments/experiment-grid.tsx`
- Modify: `/Users/clbhll/code/chill-clb-697-animation-migration/src/styles/globals.css`

**Interfaces:**
- Consumes:
  - published package `@calebhill/animations@^0.6.0`
  - current consumer imports from `@clbhll/animations`
- Produces:
  - no `.npmrc` GitHub Packages config
  - dependency line `"@calebhill/animations": "^0.6.0"`
  - no remaining `@clbhll/animations` references in app source or lockfile

- [ ] **Step 1: Verify the `.npmrc` file still contains only obsolete GitHub Packages config**

Run: `sed -n '1,20p' /Users/clbhll/code/chill-clb-697-animation-migration/.npmrc`
Expected:

```text
@clbhll:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

If the file contents differ, update this task before deleting anything.

- [ ] **Step 2: Remove the old package and add the new one before editing imports**

Run: `pnpm remove @clbhll/animations`
Expected: removes the dependency from `package.json`

Run: `pnpm add @calebhill/animations@^0.6.0`
Expected: adds the public npm package and updates `pnpm-lock.yaml`

- [ ] **Step 3: Remove the obsolete auth file with `apply_patch`**

Use `apply_patch`:

```diff
*** Begin Patch
*** Delete File: /Users/clbhll/code/chill-clb-697-animation-migration/.npmrc
*** End Patch
```

Expected: `.npmrc` deleted because it contained only the obsolete GitHub Packages config verified in Step 1

- [ ] **Step 4: Rewrite the imports and motion comment**

```ts
import {
  blurHierarchy,
  easingConfigs,
  getHeaderItemVariants,
} from "@calebhill/animations";
```

```ts
import { getContentItemVariants } from "@calebhill/animations";
```

```css
/* Motion — weighted ease-out, mirrors easingConfigs.general (@calebhill/animations) */
```

- [ ] **Step 5: Verify the legacy scope is fully gone**

Run: `rg -n "@clbhll/animations|npm\\.pkg\\.github\\.com" /Users/clbhll/code/chill-clb-697-animation-migration`
Expected: no matches

- [ ] **Step 6: Commit**

```bash
git -C /Users/clbhll/code/chill-clb-697-animation-migration add .npmrc package.json pnpm-lock.yaml src/components/hero.tsx src/components/project-list.tsx src/components/inspiration-grid.tsx src/components/experiments/experiment-grid.tsx src/styles/globals.css
git -C /Users/clbhll/code/chill-clb-697-animation-migration commit -m "chore: migrate to @calebhill/animations"
```

### Task 7: Verify `calebhill.me` Against The Published Package

**Files:**
- Modify: none
- Test: `/Users/clbhll/code/chill-clb-697-animation-migration/package.json`
- Test: `/Users/clbhll/code/chill-clb-697-animation-migration/pnpm-lock.yaml`

**Interfaces:**
- Consumes:
  - Task 6 dependency and import migration
  - existing scripts in `package.json`
- Produces:
  - successful lint, typecheck, and production build against the public package
  - evidence that GitHub Packages auth is no longer required

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 2: Run the required typecheck**

Run: `pnpm tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `pnpm build`
Expected: PASS, including Next.js compile and type validation

- [ ] **Step 4: Verify the installed dependency source**

Run: `pnpm why @calebhill/animations`
Expected: resolves to `@calebhill/animations@0.6.0`

Run: `pnpm why @clbhll/animations`
Expected: no dependency path found

- [ ] **Step 5: Run `/simplify`, then open the consumer PR**

Run: `/simplify`
Expected: any obvious local code/documentation simplifications are applied before the PR is opened

Run: `git -C /Users/clbhll/code/chill-clb-697-animation-migration status --short`
Expected: only the migration files above are present

PR scope: only `calebhill.me`; title it `CLB-697 migrate calebhill.me to public animations package`

### Task 8: Merge Consumer PR, Finish Linear, And Clean Up

**Files:**
- Modify: none
- Test: none

**Interfaces:**
- Consumes:
  - merged `calebhill.me` PR with passing CI
  - published `@calebhill/animations@0.6.0`
- Produces:
  - CLB-697 marked `Done` in Linear
  - both local worktrees removed after merge
  - final issue note summarizing the dependency and type-contract decision

- [ ] **Step 1: Merge the consumer PR after checks pass**

Run: `gh pr checks --watch`
Expected: all required checks pass for the `calebhill.me` PR

Run: `gh pr merge --squash --delete-branch`
Expected: PR merged; branch deleted on the remote

- [ ] **Step 2: Mark Linear complete**

Use the Linear issue `CLB-697`:

1. Add a final comment after the consumer PR merges.
2. Mark the issue `Done`.

- [ ] **Step 3: Remove the local worktrees**

```bash
git -C /Users/clbhll/code/clb-animations worktree remove /Users/clbhll/code/chill-clb-697-standardize-animations
git -C /Users/clbhll/code/calebhill.me worktree remove /Users/clbhll/code/chill-clb-697-animation-migration
```

- [ ] **Step 4: Post the final verification note in Linear**

```text
Standardized the shared motion package on public npm as @calebhill/animations, published 0.6.0 with package-owned structural motion types and no published framer-motion runtime or peer dependency, and migrated calebhill.me off the legacy @clbhll/animations GitHub Packages dependency. Verified lint, pnpm tsc --noEmit, and pnpm build in calebhill.me against the published package.
```
