import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

const tarballCheckRoot = resolve(".tmp/tarball-check");

describe("tarball contents", () => {
  it("publishes only the approved package files", () => {
    expect(() =>
      execFileSync("node", ["scripts/assert-tarball-contents.mjs"], {
        stdio: "inherit",
      }),
    ).not.toThrow();
    expect(existsSync(tarballCheckRoot)).toBe(false);
  });

  it("cleans its temporary directory when packing fails", () => {
    const shimRoot = mkdtempSync(join(tmpdir(), "base-tarball-pnpm-"));
    const pnpmShim = join(shimRoot, "pnpm");
    writeFileSync(pnpmShim, "#!/bin/sh\nexit 1\n");
    chmodSync(pnpmShim, 0o755);

    try {
      expect(() =>
        execFileSync("node", ["scripts/assert-tarball-contents.mjs"], {
          env: {
            ...process.env,
            PATH: `${shimRoot}${delimiter}${process.env.PATH ?? ""}`,
          },
          stdio: "ignore",
        }),
      ).toThrow();
      expect(existsSync(tarballCheckRoot)).toBe(false);
    } finally {
      rmSync(shimRoot, { force: true, recursive: true });
    }
  });
});
