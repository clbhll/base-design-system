import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";

import { assertPackageTarball } from "./assert-tarball-contents.mjs";
import { runInstalledFixture } from "./test-packed-fixture.mjs";

const packageName = "@calebhill/base";
const officialRegistry = "https://registry.npmjs.org";
const repositoryUrl = "git+https://github.com/clbhll/base-design-system.git";
const alphaVersionPattern = /^0\.1\.0-alpha\.\d+$/;

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch. Expected: ${expected}. Actual: ${actual}`);
  }
}

export function assertReleaseState({
  tag,
  packageJson,
  preState,
  pendingChangesets,
  ci = false,
  containedInMain = true,
}) {
  assertEqual(packageJson.name, packageName, "Package name");
  if (!alphaVersionPattern.test(packageJson.version)) {
    throw new Error(`Release version must match 0.1.0-alpha.N: ${packageJson.version}`);
  }
  assertEqual(tag, `v${packageJson.version}`, "Release tag and package version");
  if (preState?.mode !== "pre" || preState?.tag !== "alpha") {
    throw new Error("Changesets must be in alpha prerelease mode");
  }
  if (pendingChangesets.length !== 0) {
    throw new Error(`Pending release changesets remain: ${pendingChangesets.join(", ")}`);
  }

  assertEqual(packageJson.publishConfig?.registry, officialRegistry, "Public npm registry");
  assertEqual(packageJson.publishConfig?.access, "public", "Package access must be public");
  assertEqual(packageJson.publishConfig?.tag, "next", "Prerelease dist-tag");
  if (packageJson.publishConfig?.provenance !== true) {
    throw new Error("Package publishConfig must enable provenance");
  }
  if (
    packageJson.repository?.type !== "git" ||
    packageJson.repository?.url !== repositoryUrl
  ) {
    throw new Error(`Package repository must be ${repositoryUrl}`);
  }
  if (ci && !containedInMain) {
    throw new Error("Tagged release commit must be contained in origin/main");
  }
}

export function assertVersionAbsent(packageDocument, version) {
  if (Object.hasOwn(packageDocument?.versions ?? {}, version)) {
    throw new Error(`Registry version already exists and is immutable: ${packageName}@${version}`);
  }
}

function defaultPackCandidate(packageRoot, destination) {
  execFileSync("pnpm", ["pack", "--pack-destination", destination], {
    cwd: packageRoot,
    stdio: "inherit",
  });
  const tarballs = readdirSync(destination).filter((entry) => entry.endsWith(".tgz"));
  if (tarballs.length !== 1) {
    throw new Error(`Expected exactly one release candidate tarball, found ${tarballs.length}`);
  }
  return join(destination, tarballs[0]);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export async function prepareReleaseCandidate({
  packageRoot = process.cwd(),
  tag,
  preState,
  pendingChangesets,
  containedInMain,
  registryDocument,
  outputDirectory,
  onTemporaryRootCreated,
  packCandidate = defaultPackCandidate,
  validateTarball = assertPackageTarball,
  runFixture = async (fixtureTemplate, tarball, root) =>
    runInstalledFixture({ fixtureTemplate, packageRoot: root, packageSpec: tarball }),
} = {}) {
  const root = resolve(packageRoot);
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assertReleaseState({
    tag,
    packageJson,
    preState,
    pendingChangesets,
    ci: process.env.CI === "true",
    containedInMain,
  });
  assertVersionAbsent(registryDocument, packageJson.version);

  const tempParent = resolve(root, ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, "release-prepare-"));
  const finalDirectory = resolve(outputDirectory ?? join(tempParent, "release-candidate"));

  try {
    onTemporaryRootCreated?.(tempRoot);
    const candidate = resolve(packCandidate(root, tempRoot));
    if (!candidate.startsWith(`${tempRoot}/`) || !candidate.endsWith(".tgz")) {
      throw new Error(`Release candidate must be a .tgz inside its task root: ${candidate}`);
    }
    await validateTarball(candidate);
    for (const fixtureTemplate of ["vite-smoke", "next-smoke"]) {
      await runFixture(fixtureTemplate, candidate, root);
    }

    mkdirSync(finalDirectory, { recursive: true });
    const existing = readdirSync(finalDirectory);
    if (existing.length !== 0) {
      throw new Error(`Release candidate output directory must be empty: ${finalDirectory}`);
    }
    const finalPath = join(finalDirectory, basename(candidate));
    copyFileSync(candidate, finalPath);
    return {
      digest: sha256(finalPath),
      path: finalPath,
      version: packageJson.version,
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function readRegistryDocument() {
  const response = await fetch(`${officialRegistry}/@calebhill%2fbase`, {
    headers: { accept: "application/vnd.npm.install-v1+json" },
  });
  if (response.status === 404) return { versions: {} };
  if (!response.ok) {
    throw new Error(`Registry version lookup failed with HTTP ${response.status}`);
  }
  return response.json();
}

function pendingChangesetFiles(root) {
  return readdirSync(join(root, ".changeset"))
    .filter((entry) => entry.endsWith(".md") && entry !== "README.md")
    .sort();
}

function isTaggedCommitContainedInMain(root) {
  if (process.env.CI !== "true") return true;
  const sha = process.env.GITHUB_SHA;
  if (!sha) throw new Error("GITHUB_SHA is required in CI");
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sha, "origin/main"], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function appendGitHubOutputs(result) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  writeFileSync(
    outputPath,
    `version=${result.version}\npath=${result.path}\ndigest=${result.digest}\n`,
    { flag: "a" },
  );
}

async function main() {
  const root = process.cwd();
  const tag = process.env.RELEASE_TAG ?? process.argv[2];
  if (!tag) throw new Error("Provide RELEASE_TAG or a tag argument");
  const prePath = join(root, ".changeset/pre.json");
  if (!existsSync(prePath)) throw new Error("Changesets alpha state is missing");
  const result = await prepareReleaseCandidate({
    packageRoot: root,
    tag,
    preState: JSON.parse(readFileSync(prePath, "utf8")),
    pendingChangesets: pendingChangesetFiles(root),
    containedInMain: isTaggedCommitContainedInMain(root),
    registryDocument: await readRegistryDocument(),
    outputDirectory: process.env.RELEASE_OUTPUT_DIRECTORY,
  });
  appendGitHubOutputs(result);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  await main();
}
