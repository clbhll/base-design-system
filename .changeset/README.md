1. Run `pnpm verify`.
2. Create a changeset for user-facing changes with `pnpm changeset`.
3. Merge the Changesets version PR.
4. In CLB-705, let the dedicated release workflow publish with `npm publish --provenance --tag next`.
5. If a prerelease is bad, deprecate it and publish a corrected prerelease; never overwrite a published version.
