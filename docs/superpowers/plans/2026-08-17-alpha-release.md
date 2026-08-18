# CLB-705 Base alpha release plan

**Goal:** Publish `@calebhill/base@0.1.0-alpha.0` under npm's `next` tag through GitHub Actions trusted publishing, prove its provenance and exact registry artifact, and leave a repeatable prerelease process.

**Architecture:** Deliver release automation before versioning. The repository creates and verifies one immutable candidate tarball in an unprivileged job, passes it by digest to a narrow OIDC publish job, then verifies the registry copy in clean Vite and Next.js consumers. Because npm cannot configure a trusted publisher for a package that does not exist, bootstrap `0.0.0` once through an interactive maintainer session under a non-default `bootstrap` tag; every real prerelease uses OIDC.

**Tech stack:** Changesets, pnpm 10.30.3, Node 24, npm 11.19.0, GitHub Actions OIDC, npm provenance, Vitest, Vite, Next.js App Router.

**Source contracts:** `AGENTS.md`, `DESIGN.md`, `docs/superpowers/specs/2026-08-14-base-design-system-alpha-design.md`, Linear CLB-705, npm trusted-publishing and provenance documentation.

## Boundaries

- The public alpha is exactly `0.1.0-alpha.0`; `StatusTag` remains lab-only and is never packed.
- No npm automation token or `NODE_AUTH_TOKEN` may appear in the release workflow.
- Only the publish job receives `id-token: write`; build, tests, and registry verification do not.
- The publish job publishes the exact candidate tarball verified by the prior job, not a rebuilt package.
- The release workflow accepts only a tag matching `v${package.version}`, only alpha prereleases, and only commits contained in `main`.
- The release workflow fails if the registry already contains the version.
- Post-publish failures never overwrite or unpublish a version; deprecate and publish a correction.
- Registry fixture verification is release-only and must not make ordinary `pnpm verify` depend on an unpublished version or the network.
- Vite and Next fixtures install an exact registry semver with no local/file/workspace/git source, Tailwind, aliases, Next/Vercel imports in the package, product modules, or `StatusTag`.
- Use unique task-owned temporary roots and exact-target `finally` cleanup.

## Task 1: Lock release and registry-fixture contracts

**Files**

- Create `test/contracts/release-workflow.test.ts`
- Create `test/contracts/registry-fixtures.test.ts`
- Modify `test/contracts/forbidden-imports.test.ts`
- Modify `test/contracts/packed-package.test.ts` only when a reusable exact-tarball seam needs contract coverage

1. Add failing contracts for release workflow triggers, exact pinned actions, minimal permissions, no npm secret/token, Node/npm/pnpm versions, exact-candidate artifact handoff, digest verification, version-absence check, and three-job ordering.
2. Add failing contracts for tag/version/main/prestate validation and exact prerelease policy.
3. Add failing offline contracts for exact registry semver only, official registry origin, integrity/provenance requirements, installed-path containment, installed-file parity with the registry tarball, and cleanup on success/failure.
4. Add fixture boundary tests for both Vite and Next templates: public imports only, all runtime exports and representative types, complete public CSS, no Tailwind/aliases/source/product/`StatusTag` leakage.
5. Run focused contracts and record RED evidence before implementation.

## Task 2: Generalize exact-artifact fixture verification

**Files**

- Modify `scripts/assert-tarball-contents.mjs`
- Modify `scripts/test-packed-fixture.mjs`
- Modify `test/fixtures/vite-smoke/src/main.tsx`
- Create `test/fixtures/next-smoke/package.json`
- Create `test/fixtures/next-smoke/pnpm-lock.yaml`
- Create `test/fixtures/next-smoke/tsconfig.json`
- Create `test/fixtures/next-smoke/next-env.d.ts`
- Create `test/fixtures/next-smoke/app/layout.tsx`
- Create `test/fixtures/next-smoke/app/page.tsx`

1. Export a validator for a supplied `.tgz` without invoking `pnpm pack`; retain the existing local pack wrapper.
2. Generalize the fixture runner to accept a supplied exact tarball or package spec and a fixture template, while retaining isolated installs, typecheck/build, and cleanup.
3. Expand Vite coverage to every public runtime export and all representative public types; fix its in-page link target.
4. Add the smallest Next.js 16 App Router fixture with React 19, no Tailwind/PostCSS/aliases, public stylesheet import in the root layout, and a client page exercising every public runtime export/type.
5. Run both fixtures against one locally packed candidate and all focused contracts; record GREEN evidence.

## Task 3: Add deterministic release preparation and registry verification

**Files**

- Create `scripts/prepare-release.mjs`
- Create `scripts/verify-registry-package.mjs`
- Modify `package.json`

1. `prepare-release.mjs` validates:
   - exact tag/version equality;
   - `0.1.0-alpha.N` prerelease format and `.changeset/pre.json` alpha mode;
   - no pending release changesets;
   - public npm registry/access, `next` tag, provenance enabled, and exact public repository;
   - tagged commit is contained in `origin/main` when run in CI;
   - requested registry version is absent.
2. It creates one candidate tarball, applies the CLB-717 exact artifact gate, runs both installed-tarball fixtures, computes SHA-256, and emits machine-readable version/path/digest outputs.
3. `verify-registry-package.mjs` requires an exact version, retries bounded registry propagation, requires `next` to equal it, downloads only the official registry tarball, verifies SRI integrity and provenance metadata, applies the exact artifact gate, hashes installed files against the registry artifact, runs clean Vite and Next fixtures, and verifies signatures with `npm audit signatures`.
4. Add manual scripts such as `release:prepare` and `fixture:registry`; do not add registry verification to `pnpm verify`.
5. Mutation-test validation and cleanup seams without live registry calls.

## Task 4: Add the privileged release workflow and documentation

**Files**

- Create `.github/workflows/release.yml`
- Modify `docs/releasing.md`
- Modify `.changeset/README.md`
- Modify `README.md`

1. Trigger only on `v*-alpha.*` tag pushes; disable cancellation with release concurrency.
2. `verify` job: read-only contents, full checkout, Node 24, npm 11.19.0, pnpm 10.30.3, frozen install, full verification, release preparation, candidate upload, version/digest outputs.
3. `publish` job: only `contents: read` and `id-token: write`; download candidate, verify digest, install no project dependencies, confirm version absence, and run `npm publish <candidate> --access public --tag next --provenance` with no token.
4. `verify-registry` job: read-only contents, clean install, exact registry verification, provenance/signature check, Vite build, and Next build.
5. Pin every third-party action by full commit SHA and explain the tag in a comment.
6. Document the one-time `0.0.0` bootstrap, trust configuration, prerelease/version PR/tag sequence, verification, subsequent alphas, rollback, tag removal/deprecation, and stable handoff.
7. Run workflow contracts, `actionlint` if available, `pnpm verify`, explicit TypeScript, and diff checks.

## Task 5: Review and merge release automation

1. Enter Changesets alpha mode with `pnpm prerelease:enter`; commit `.changeset/pre.json` while leaving version `0.0.0` and existing changesets unconsumed.
2. Run the required independent simplification pass.
3. Complete a fresh security/release review focused on OIDC permissions, candidate identity, action pinning, untrusted-code isolation, immutable-version failure behavior, and fixture truthfulness.
4. Push `chill/clb-705-alpha-release`, open the CLB-705 automation PR, wait for CI, merge the exact reviewed head, and fast-forward clean `main`.

## Task 6: Bootstrap npm and configure trusted publishing

1. From verified merged `main@0.0.0`, create and inspect one exact tarball.
2. Authenticate interactively as `calebhill`; publish only that tarball with public access under the non-default `bootstrap` tag and provenance explicitly disabled.
3. Install npm 11.19.0 for trust management if needed and configure:
   - package `@calebhill/base`;
   - repository `clbhll/base-design-system`;
   - workflow filename `release.yml`;
   - allowed action `npm publish`.
4. Verify the trust relationship, then log out locally so no persistent CLI credential remains.

## Task 7: Version, publish, and verify the alpha

1. Create `chill/clb-705-alpha-version` from updated `main`.
2. Run `pnpm version-packages`; verify exactly `0.1.0-alpha.0`, the three intended changelog entries, consumed changesets, and retained alpha prerelease mode.
3. Run simplification, independent review, full verification, open/merge the version PR, and fast-forward `main`.
4. Create and push annotated tag `v0.1.0-alpha.0` at the exact verified merge commit.
5. Watch the release workflow through verify, OIDC publish, and registry verification. Do not retry publication unless the registry proves the version absent.
6. Independently verify npm metadata, `next`, provenance/source workflow, exact tarball files/exports/types/CSS, Vite and Next installs/builds, and `npm audit signatures`.
7. Deprecate `0.0.0`, remove its `bootstrap` dist-tag, confirm no `latest` tag points at an alpha, update Linear CLB-705 to Done with links/evidence, and clean branches/worktrees.

## Final verification

```sh
pnpm verify
pnpm tsc --noEmit
git diff --check
npm view @calebhill/base@0.1.0-alpha.0 version dist-tags repository dist --json
pnpm fixture:registry -- 0.1.0-alpha.0
```

Expected: `next` resolves to `0.1.0-alpha.0`; the exact package has provenance from `clbhll/base-design-system/.github/workflows/release.yml`, only approved files/exports/types/CSS, and clean Vite/Next consumers. `StatusTag` is absent.
