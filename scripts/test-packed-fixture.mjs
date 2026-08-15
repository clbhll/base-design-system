import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const fixtureTemplateRoot = resolve(root, "test/fixtures/vite-smoke");
const tempRoot = resolve(root, ".tmp/packed-fixture");
const runRoot = resolve(tempRoot, "run");

rmSync(tempRoot, { force: true, recursive: true });
mkdirSync(tempRoot, { recursive: true });

try {
  execFileSync("pnpm", ["pack", "--pack-destination", tempRoot], { stdio: "inherit" });

  const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  const tarballBaseName = packageJson.name.replace(/^@/, "").replace(/\//g, "-");
  const tarball = join(tempRoot, `${tarballBaseName}-${packageJson.version}.tgz`);

  if (!existsSync(tarball)) {
    throw new Error(`Expected tarball at ${tarball}`);
  }

  cpSync(fixtureTemplateRoot, runRoot, { recursive: true });

  const fixturePackageJsonPath = resolve(runRoot, "package.json");
  const fixturePackage = JSON.parse(readFileSync(fixturePackageJsonPath, "utf8"));
  fixturePackage.dependencies["@calebhill/base"] = `file:${tarball}`;
  writeFileSync(fixturePackageJsonPath, `${JSON.stringify(fixturePackage, null, 2)}\n`);

  execFileSync("pnpm", ["install", "--ignore-workspace"], { cwd: runRoot, stdio: "inherit" });
  execFileSync("pnpm", ["typecheck"], { cwd: runRoot, stdio: "inherit" });
  execFileSync("pnpm", ["build"], { cwd: runRoot, stdio: "inherit" });
} finally {
  rmSync(tempRoot, { force: true, recursive: true });
}
