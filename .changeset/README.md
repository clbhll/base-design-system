1. Run `pnpm verify`.
2. In CLB-705, run `pnpm prerelease:enter` and commit the generated `.changeset/pre.json` before creating the first release changeset or version PR.
3. Run `pnpm changeset` and select a minor release for the first public package.
4. Run `pnpm version-packages`, then create and merge the version PR that sets `0.1.0-alpha.0`.
5. Let the dedicated CLB-705 release workflow publish with `npm publish --provenance --tag next`.
6. If a prerelease is bad, deprecate it and publish a corrected prerelease; never overwrite a published version.
