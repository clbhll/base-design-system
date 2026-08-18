import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import { assertPackageTarball } from "./assert-tarball-contents.mjs";

const exactVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/;

export function assertExactPackageSpec(packageSpec) {
  if (exactVersionPattern.test(packageSpec)) {
    return packageSpec;
  }

  if (
    isAbsolute(packageSpec) &&
    packageSpec.endsWith(".tgz") &&
    existsSync(packageSpec) &&
    statSync(packageSpec).isFile()
  ) {
    return packageSpec;
  }

  throw new Error(
    `Base fixture package spec must be an exact version or an existing absolute .tgz tarball: ${packageSpec}`,
  );
}

export function assertPathContained(targetPath, taskRoot) {
  const containedPath = relative(resolve(taskRoot), resolve(targetPath));
  if (containedPath.startsWith("..") || isAbsolute(containedPath)) {
    throw new Error(`Installed package path is outside the task-owned root: ${targetPath}`);
  }
}

function listFiles(root, prefix = "") {
  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(root, entry.name);
      const relativePath = join(prefix, entry.name);
      return entry.isDirectory() ? listFiles(path, relativePath) : [relativePath];
    })
    .sort();
}

function fileDigest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function assertInstalledFileParity(tarballPath, installedPackageRoot) {
  const tempParent = resolve(process.cwd(), ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, "installed-parity-"));

  try {
    execFileSync("tar", ["-xf", resolve(tarballPath), "-C", tempRoot]);
    const artifactRoot = join(tempRoot, "package");
    const artifactFiles = listFiles(artifactRoot);
    const installedFiles = listFiles(installedPackageRoot);
    const expected = artifactFiles.map((path) => `${path}:${fileDigest(join(artifactRoot, path))}`);
    const actual = installedFiles.map((path) => `${path}:${fileDigest(join(installedPackageRoot, path))}`);

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Installed package file parity mismatch.\nExpected: ${expected.join(", ")}\nActual: ${actual.join(", ")}`,
      );
    }
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

function createPackageTarball(packageRoot, destination) {
  execFileSync("pnpm", ["pack", "--pack-destination", destination], {
    cwd: packageRoot,
    stdio: "inherit",
  });
  const tarballs = readdirSync(destination).filter((entry) => entry.endsWith(".tgz"));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one package tarball, found ${tarballs.length}`);
  }

  return join(destination, tarballs[0]);
}

export async function runInstalledFixture({
  fixtureTemplate = "vite-smoke",
  packageRoot = process.cwd(),
  packageSpec,
  onInstalledPackage,
  onTemporaryRootCreated,
} = {}) {
  const root = resolve(packageRoot);
  const fixtureTemplateRoot = resolve(root, "test/fixtures", fixtureTemplate);
  if (!lstatSync(fixtureTemplateRoot).isDirectory()) {
    throw new Error(`Expected fixture template directory: ${fixtureTemplateRoot}`);
  }

  const tempParent = resolve(root, ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, `${fixtureTemplate}-fixture-`));
  const runRoot = resolve(tempRoot, "run");

  try {
    onTemporaryRootCreated?.(tempRoot);
    const resolvedSpec = assertExactPackageSpec(
      packageSpec ? (isAbsolute(packageSpec) ? resolve(packageSpec) : packageSpec) : createPackageTarball(root, tempRoot),
    );
    const tarball = isAbsolute(resolvedSpec) ? resolvedSpec : undefined;
    if (tarball) {
      await assertPackageTarball(tarball);
    }

    cpSync(fixtureTemplateRoot, runRoot, { recursive: true });

    execFileSync(
      "pnpm",
      ["install", "--frozen-lockfile", "--ignore-workspace", "--config.node-linker=isolated"],
      { cwd: runRoot, stdio: "inherit" },
    );

    const fixturePackageJsonPath = resolve(runRoot, "package.json");
    const fixturePackage = JSON.parse(readFileSync(fixturePackageJsonPath, "utf8"));
    fixturePackage.dependencies["@calebhill/base"] = tarball ? `file:${tarball}` : resolvedSpec;
    writeFileSync(fixturePackageJsonPath, `${JSON.stringify(fixturePackage, null, 2)}\n`);

    const installArgs = ["install"];
    if (tarball) installArgs.push("--offline");
    installArgs.push("--no-lockfile", "--ignore-workspace", "--config.node-linker=isolated");
    if (!tarball) installArgs.push("--registry=https://registry.npmjs.org/");
    execFileSync("pnpm", installArgs, { cwd: runRoot, stdio: "inherit" });

    const installedPackagePath = resolve(runRoot, "node_modules/@calebhill/base");
    assertPathContained(installedPackagePath, tempRoot);
    const installedPackageRoot = realpathSync(installedPackagePath);
    assertPathContained(installedPackageRoot, tempRoot);
    if (tarball) assertInstalledFileParity(tarball, installedPackageRoot);
    onInstalledPackage?.(installedPackageRoot);

    execFileSync("pnpm", ["typecheck"], { cwd: runRoot, stdio: "inherit" });
    execFileSync("pnpm", ["build"], { cwd: runRoot, stdio: "inherit" });
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

export async function runPackedFixture(options = {}) {
  return runInstalledFixture({ fixtureTemplate: "vite-smoke", ...options });
}

export async function runPackedFixtures({ packageRoot = process.cwd() } = {}) {
  const root = resolve(packageRoot);
  const tempParent = resolve(root, ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, "packed-fixtures-"));

  try {
    const tarball = createPackageTarball(root, tempRoot);
    await assertPackageTarball(tarball);
    for (const fixtureTemplate of ["vite-smoke", "next-smoke"]) {
      await runInstalledFixture({ fixtureTemplate, packageRoot: root, packageSpec: tarball });
    }
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  await runPackedFixtures();
}
