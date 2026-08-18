import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export function runPackedFixture({
  packageRoot = process.cwd(),
  onTemporaryRootCreated,
} = {}) {
  const root = resolve(packageRoot);
  const fixtureTemplateRoot = resolve(root, "test/fixtures/vite-smoke");
  const tempParent = resolve(root, ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, "packed-fixture-"));
  const runRoot = resolve(tempRoot, "run");

  try {
    onTemporaryRootCreated?.(tempRoot);
    execFileSync("pnpm", ["pack", "--pack-destination", tempRoot], { cwd: root, stdio: "inherit" });

    const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    const tarballBaseName = packageJson.name.replace(/^@/, "").replace(/\//g, "-");
    const tarball = join(tempRoot, `${tarballBaseName}-${packageJson.version}.tgz`);

    if (!existsSync(tarball)) {
      throw new Error(`Expected tarball at ${tarball}`);
    }

    cpSync(fixtureTemplateRoot, runRoot, { recursive: true });

    execFileSync(
      "pnpm",
      ["install", "--frozen-lockfile", "--ignore-workspace", "--config.node-linker=isolated"],
      { cwd: runRoot, stdio: "inherit" },
    );

    const fixturePackageJsonPath = resolve(runRoot, "package.json");
    const fixturePackage = JSON.parse(readFileSync(fixturePackageJsonPath, "utf8"));
    fixturePackage.dependencies["@calebhill/base"] = `file:${tarball}`;
    writeFileSync(fixturePackageJsonPath, `${JSON.stringify(fixturePackage, null, 2)}\n`);

    execFileSync(
      "pnpm",
      ["install", "--offline", "--no-lockfile", "--ignore-workspace", "--config.node-linker=isolated"],
      { cwd: runRoot, stdio: "inherit" },
    );
    execFileSync("pnpm", ["typecheck"], { cwd: runRoot, stdio: "inherit" });
    execFileSync("pnpm", ["build"], { cwd: runRoot, stdio: "inherit" });
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  runPackedFixture();
}
