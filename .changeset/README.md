# Changesets release flow

1. Add a consumer-visible changeset with `pnpm changeset`; Base uses semantic versioning even during prereleases.
2. Keep `.changeset/pre.json` in `alpha` mode while publishing alphas.
3. In a dedicated version PR, run `pnpm version-packages`, inspect the changelog/version, and confirm intended changesets were consumed.
4. Run the simplification pass, `pnpm verify`, `pnpm tsc --noEmit`, and `git diff --check` before merge.
5. Tag the exact verified merge commit with `v${package.version}`. `.github/workflows/release.yml` publishes the one digest-bound candidate to npm under `next` through OIDC.
6. Verify the registry copy with `pnpm fixture:registry -- <exact-version>`.

Never overwrite or unpublish a released version. Deprecate a bad prerelease, add a corrective changeset, and publish the next alpha. See [the full release runbook](../docs/releasing.md) for bootstrap, trust, tag, rollback, and stable-handoff procedures.
