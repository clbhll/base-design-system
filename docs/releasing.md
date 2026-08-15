# Releasing @calebhill/base

1. Verify locally with `pnpm verify`.
2. In CLB-705, enter alpha prerelease mode with `pnpm prerelease:enter` and commit the generated `.changeset/pre.json` before creating the first release changeset or version PR.
3. Add the first release changeset with `pnpm changeset`, selecting a minor release and describing the consumer-visible package foundation.
4. Run `pnpm version-packages`, then create and merge the version PR after confirming it sets `@calebhill/base` to `0.1.0-alpha.0`.
5. In CLB-705, add the dedicated trusted-publishing workflow that publishes to npm with the `next` tag and provenance.
6. Roll back by deprecating the broken version and publishing a corrected prerelease; never overwrite a published version.
