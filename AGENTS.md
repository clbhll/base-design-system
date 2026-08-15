# Repository Instructions

`@calebhill/base` is a framework-independent React design-system package. Read the [AI-first design contract](DESIGN.md) before changing tokens, components, motion, accessibility behavior, public exports, or package boundaries.

## Authority

- `DESIGN.md` owns design intent, boundaries, sources of truth, and change criteria.
- `README.md` owns installation and consumer setup.
- Source and tests own public behavior, accessibility, packaging, and API contracts.
- The canonical lab owns executable component examples.
- Figma owns approved visual specifications.
- Linear owns issue scope, approval history, estimates, and delivery status.

If these artifacts disagree, follow the conflict-resolution process in `DESIGN.md`; do not silently choose one.

## Commands

Use pnpm 10.30.3.

```sh
pnpm install
pnpm verify
pnpm tsc --noEmit
pnpm lab:dev
pnpm fixture:test
```

`pnpm verify` is the fail-fast CI and release-preparation gate. Run the explicit TypeScript check again before committing, as required for web-package work.

## Package boundaries

- Do not import Next.js, Vercel modules, application aliases, product code, or product types.
- Do not require consumer Tailwind configuration or ship global reset or `body` styles.
- Public custom properties use the `--base-` prefix and semantic names.
- Shared motion primitives come from `@calebhill/animations`; do not duplicate them.
- Preserve native element props, ref forwarding, keyboard behavior, focus visibility, and reduced-motion behavior in public components.

## Delivery workflow

1. Confirm or update the Linear issue, including an estimate.
2. Inspect `DESIGN.md`, relevant source/tests, the lab, Figma, and supported consumers.
3. Classify the change as Base, animation-package, or product-owned work.
4. For behavior changes, write and run the failing test before implementation.
5. Keep the diff scoped and run the simplification pass before opening a PR.
6. Run `pnpm verify` and `pnpm tsc --noEmit` before committing and again before claiming completion.
7. Use a changeset for consumer-visible package changes when the release workflow requires one.
8. Open a PR, wait for checks, merge, mark the Linear issue Done, and clean up the branch.

Never overwrite local configuration or unrelated work. When working in a linked worktree, verify `pwd` and use paths inside that worktree for edits.
