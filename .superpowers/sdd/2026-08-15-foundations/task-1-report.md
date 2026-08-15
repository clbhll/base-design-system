# Task 1 report: token and theme contract

## What changed

- Added the foundation CSS contract tests for semantic vocabulary, light/dark accent aliases, reduced-motion interaction overrides, and forbidden global/Tailwind rules.
- Updated the CSS build contract assertions for the new reference-root structure and foundation class output.
- Replaced the placeholder token sheet with the approved `--base-ref-*` reference scales, semantic light/dark theme aliases, portable font stacks, and reduced-motion interaction overrides.

## Files

- `src/styles/tokens.css`
- `test/contracts/foundations-css.test.ts`
- `test/contracts/css-build.test.ts`

## RED

Command:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts test/contracts/css-build.test.ts
```

Result: expected failure. The new foundation contract had 3 failures for missing semantic tokens, accent aliases, and reduced-motion interaction tokens; the updated CSS build assertion also failed against the placeholder token sheet.

## GREEN

Command:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts
```

Result: pass (1 file, 4 tests).

Command:

```sh
pnpm tsc --noEmit
```

Result: pass.

## Final tests

- Foundation CSS contract: PASS (4/4).
- TypeScript: PASS.
- `git diff --check`: PASS.
- Combined foundation and CSS build contract command: currently fails only because `src/styles/styles.css` is still the pre-foundation placeholder and lacks `.base-type-display`, which is owned by a later task and was intentionally not implemented here.

## Self-review

- Confirmed all exact reference values and semantic aliases from the task brief are present.
- Confirmed light and dark selectors retain the documented `data-base-theme` contract.
- Confirmed reduced-motion overrides remove spatial press feedback while retaining opacity token availability.
- Confirmed no unrelated source files were changed.

## Concerns

The class-sheet assertion is intentionally left at `.base-theme-probe` for Task 1; Task 2 owns changing it to `.base-type-display` when that class is implemented.

## Fix Round 1

Changed file: `test/contracts/css-build.test.ts`

Restored the existing `.base-theme-probe` assertion so Task 1 does not require the later class-sheet implementation.

Covering commands:

```sh
pnpm exec vitest run test/contracts/foundations-css.test.ts test/contracts/css-build.test.ts
pnpm tsc --noEmit
```

Output: both commands passed. Vitest reported 2 files and 6 tests passed; TypeScript completed with no errors.
