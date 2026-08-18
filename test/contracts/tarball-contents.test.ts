import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const tarballAssertionModule = pathToFileURL(resolve("scripts/assert-tarball-contents.mjs")).href;
const packedFixtureModule = pathToFileURL(resolve("scripts/test-packed-fixture.mjs")).href;

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

function runThrowingCallbackProbe(moduleUrl: string, functionName: string) {
  const markerRoot = mkdtempSync(join(tmpdir(), "base-tarball-callback-"));
  const marker = join(markerRoot, "temporary-root.txt");
  const script = [
    'import { writeFileSync } from "node:fs";',
    `import { ${functionName} } from ${JSON.stringify(moduleUrl)};`,
    `${functionName}({ onTemporaryRootCreated: (root) => { writeFileSync(${JSON.stringify(marker)}, root); throw new Error("callback failure"); } });`,
  ].join("\n");

  return {
    markerRoot,
    run: () => execFileSync("node", ["--input-type=module", "--eval", script], { stdio: "ignore" }),
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

  it.each([
    ["tarball assertion", tarballAssertionModule, "runTarballCheck"],
    ["packed fixture", packedFixtureModule, "runPackedFixture"],
  ])("cleans its temporary directory when the %s callback throws", (_name, moduleUrl, functionName) => {
    const check = runThrowingCallbackProbe(moduleUrl, functionName);

    try {
      expect(check.run).toThrow();
      expect(existsSync(check.temporaryRoot())).toBe(false);
    } finally {
      rmSync(check.markerRoot, { force: true, recursive: true });
    }
  });

  it("validates a supplied tarball without invoking pnpm pack", () => {
    const candidateRoot = mkdtempSync(join(tmpdir(), "base-supplied-tarball-"));
    const shimRoot = mkdtempSync(join(tmpdir(), "base-supplied-tarball-pnpm-"));
    const pnpmShim = join(shimRoot, "pnpm");
    execFileSync("pnpm", ["pack", "--pack-destination", candidateRoot], { stdio: "ignore" });
    const tarball = resolve(candidateRoot, readdirSync(candidateRoot).find((name) => name.endsWith(".tgz"))!);
    writeFileSync(pnpmShim, "#!/bin/sh\nexit 99\n");
    chmodSync(pnpmShim, 0o755);
    const script = [
      `import { assertPackageTarball } from ${JSON.stringify(tarballAssertionModule)};`,
      `await assertPackageTarball(${JSON.stringify(tarball)});`,
    ].join("\n");

    try {
      expect(() =>
        execFileSync("node", ["--input-type=module", "--eval", script], {
          env: { ...process.env, PATH: `${shimRoot}${delimiter}${process.env.PATH ?? ""}` },
          stdio: "ignore",
        }),
      ).not.toThrow();
    } finally {
      rmSync(candidateRoot, { force: true, recursive: true });
      rmSync(shimRoot, { force: true, recursive: true });
    }
  });
});
