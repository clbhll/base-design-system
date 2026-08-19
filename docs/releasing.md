# Releasing `@calebhill/base`

Base prereleases are immutable artifacts published by `.github/workflows/release.yml` through npm trusted publishing. The workflow builds and verifies one tarball in an unprivileged job, passes that exact artifact and its SHA-256 digest to the only OIDC-enabled job, then verifies the registry copy in clean Vite and Next.js consumers. No npm token belongs in the repository or workflow.

Use Node 24, npm 11.19.0, and pnpm 10.30.3 for release work. The package publishes to the public npm registry under `next`; an alpha must never receive `latest`.

## One-time package bootstrap

npm requires the package to exist before a trusted publisher can be configured. This exception happens once, from verified merged `main` while `package.json` is still `0.0.0`:

1. Run `pnpm install --frozen-lockfile`, `pnpm verify`, and `pnpm tsc --noEmit`.
2. Create one task-owned directory, run `pnpm pack --pack-destination <directory>`, and inspect the single tarball with the supplied-tarball package gate.
3. Authenticate interactively as the `calebhill` npm maintainer. Publish only the inspected tarball:

   ```sh
   npm publish <exact-tarball.tgz> --access public --tag bootstrap --provenance=false
   ```

4. Confirm `bootstrap` and npm's required `latest` tag both point to `@calebhill/base@0.0.0`, while `next` is absent. npm requires every package document to retain a `latest` tag, including a newly bootstrapped package; do not move `latest` to an alpha.
5. With npm 11.19.0 and account-level 2FA enabled, configure only the release workflow and publish permission:

   ```sh
   npm trust github @calebhill/base \
     --repo clbhll/base-design-system \
     --file release.yml \
     --allow-publish
   npm trust list @calebhill/base
   ```

   The configured values must be repository `clbhll/base-design-system`, workflow filename `release.yml`, no environment, and allowed action `npm publish` only.

6. Run `npm logout`, confirm no persistent CLI publishing credential remains, and never add a replacement automation token.

## First alpha and later alphas

The automation PR enters Changesets `alpha` pre-mode but deliberately leaves `package.json` at `0.0.0` and does not consume the three foundation changesets.

For the version PR:

1. Start from current `main`, run `pnpm install --frozen-lockfile`, then `pnpm version-packages`.
2. For the first alpha, require exactly `0.1.0-alpha.0`, the intended changelog entries, no pending top-level `.changeset/*.md` files, the three consumed changesets retained under `.changeset/pre`, and retained `.changeset/pre.json` alpha mode. Later alpha version PRs follow the same review and advance the prerelease number without rewriting a published version.
3. Run the simplification pass, `pnpm verify`, `pnpm tsc --noEmit`, and `git diff --check`. Review and merge the exact verified head.
4. On clean, current `main`, create an annotated tag at the exact merge commit and push only that tag:

   ```sh
   git tag -a v0.1.0-alpha.0 -m "@calebhill/base@0.1.0-alpha.0"
   git push origin v0.1.0-alpha.0
   ```

The tag must match `v${package.version}`, match `v*-alpha.*`, and point to a commit contained in `origin/main`. The candidate-preparation job rejects pending release changesets, wrong package metadata, a non-alpha version, a mismatched tag, or a registry version that already exists.

## Workflow and verification

The release workflow has three jobs:

- `verify` has read-only repository access. It runs the full offline gate, validates release state, packs once, applies the exact package gate, builds both installed fixtures, and uploads the tarball with its digest.
- `publish` has only `contents: read` and `id-token: write`. It installs no project dependencies, downloads the candidate, verifies the handed-off digest and version absence, and publishes that exact tarball with public access, `next`, and provenance.
- `verify-registry` has read-only repository access. It waits for bounded registry propagation, requires exact npm metadata and `next`, verifies official-registry origin, SHA-512 SRI, registry signatures, provenance claims for this repository/workflow/tag/commit, package boundaries, installed-file parity, and clean Vite and Next.js builds.

After the workflow succeeds, independently run:

```sh
npm view @calebhill/base@0.1.0-alpha.0 version dist-tags repository dist --json
pnpm fixture:registry -- 0.1.0-alpha.0
```

The npm provenance view must identify `clbhll/base-design-system`, `.github/workflows/release.yml`, the release tag, and its exact commit. `StatusTag` must remain absent from runtime exports, declarations, CSS, tarball files, and consumer fixtures.

After the first alpha is proven, clean up the bootstrap exception:

```sh
npm deprecate @calebhill/base@0.0.0 "Bootstrap-only package; use the current next prerelease."
npm dist-tag rm @calebhill/base bootstrap
```

Confirm `next` points to the verified alpha and `latest` still points to the deprecated `0.0.0` bootstrap until a separately approved stable release replaces it. An alpha must never receive `latest`.

## Failure and rollback policy

- Before publication, a failed run may be retried only after the registry proves the version is absent. If candidate identity or tag state changed, create and review a new version commit/tag.
- After publication, never rerun publication, overwrite, or unpublish that version. Deprecate the bad prerelease, add a corrective changeset, publish the next alpha, and migrate consumers forward.
- If a tag was pushed but publication never occurred, verify registry absence before removing the remote and local tag. Record the failed run and review a corrected commit before creating a replacement tag.
- If registry verification fails after publication, treat the version as published and immutable even if the workflow is red.

## Stable handoff

Stable release policy requires a separately reviewed change: exit Changesets pre-mode, choose the stable dist-tag and workflow trigger, verify both supported consumers, and update lifecycle/release guidance. Do not make an alpha workflow publish `latest`, and do not repurpose an existing alpha tag for a stable artifact.

References: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/), [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/), and [npm signature/provenance verification](https://docs.npmjs.com/cli/v11/commands/npm-audit/).
