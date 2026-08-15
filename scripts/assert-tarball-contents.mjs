import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const tempRoot = resolve(".tmp/tarball-check");
rmSync(tempRoot, { force: true, recursive: true });
mkdirSync(tempRoot, { recursive: true });

execFileSync("pnpm", ["pack", "--pack-destination", tempRoot], {
  stdio: "inherit",
});

const tarballName = readdirSync(tempRoot).find((entry) => entry.endsWith(".tgz"));
if (!tarballName) {
  throw new Error("Expected pnpm pack to create a tarball");
}

const listing = execFileSync("tar", ["-tf", join(tempRoot, tarballName)], {
  encoding: "utf8",
});

const actual = listing
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .sort();

const expected = [
  "package/LICENSE",
  "package/README.md",
  "package/dist/index.d.ts",
  "package/dist/index.js",
  "package/dist/styles.css",
  "package/dist/tokens.css",
  "package/package.json",
].sort();

if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(
    `Tarball contents mismatch.\nExpected: ${expected.join(", ")}\nActual: ${actual.join(", ")}`,
  );
}
