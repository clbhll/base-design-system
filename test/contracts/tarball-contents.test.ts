import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const tarballAssertionModule = pathToFileURL(resolve("scripts/assert-tarball-contents.mjs")).href;

function runTarballCheckWithMarker(env = process.env) {
  const markerRoot = mkdtempSync(join(tmpdir(), "base-tarball-marker-"));
  const marker = join(markerRoot, "temporary-root.txt");
  const script = [
    'import { writeFileSync } from "node:fs";',
    `import { runTarballCheck } from ${JSON.stringify(tarballAssertionModule)};`,
    `await runTarballCheck({ onTemporaryRootCreated: (root) => writeFileSync(${JSON.stringify(marker)}, root) });`,
  ].join("\n");

  return {
    markerRoot,
    run: () =>
      execFileSync("node", ["--input-type=module", "--eval", script], {
        env,
        stdio: "inherit",
      }),
    temporaryRoot: () => readFileSync(marker, "utf8"),
  };
}

describe("tarball contents", () => {
  it("publishes only the approved package files", () => {
    const check = runTarballCheckWithMarker();

    try {
      expect(check.run).not.toThrow();
      expect(existsSync(check.temporaryRoot())).toBe(false);
    } finally {
      rmSync(check.markerRoot, { force: true, recursive: true });
    }
  });

  it("cleans its temporary directory when packing fails", () => {
    const shimRoot = mkdtempSync(join(tmpdir(), "base-tarball-pnpm-"));
    const pnpmShim = join(shimRoot, "pnpm");
    writeFileSync(pnpmShim, "#!/bin/sh\nexit 1\n");
    chmodSync(pnpmShim, 0o755);
    const check = runTarballCheckWithMarker({
      ...process.env,
      PATH: `${shimRoot}${delimiter}${process.env.PATH ?? ""}`,
    });

    try {
      expect(check.run).toThrow();
      expect(existsSync(check.temporaryRoot())).toBe(false);
    } finally {
      rmSync(shimRoot, { force: true, recursive: true });
      rmSync(check.markerRoot, { force: true, recursive: true });
    }
  });
});
