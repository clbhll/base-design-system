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
import ts from "typescript";

import { assertPackageTarball } from "./assert-tarball-contents.mjs";

const exactVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/;
const expectedFixtureImports = [
  "BASE_THEME_ATTRIBUTE",
  "BaseTheme",
  "Button",
  "ButtonLink",
  "ButtonLinkProps",
  "ButtonProps",
  "ButtonSize",
  "ButtonVariant",
  "MoreIcon",
  "ProgressBar",
  "ProgressBarProps",
  "TextInput",
  "TextInputProps",
  "TrashIcon",
  "isBaseTheme",
].sort();
const fixtureContracts = {
  "next-smoke": {
    dependencies: ["next", "react", "react-dom"],
    devDependencies: ["@types/node", "@types/react", "@types/react-dom", "typescript"],
    imports: {
      "app/layout.tsx": [
        { names: [], specifier: "@calebhill/base/styles.css" },
      ],
      "app/page.tsx": [
        { names: expectedFixtureImports, specifier: "@calebhill/base" },
      ],
    },
  },
  "vite-smoke": {
    dependencies: ["react", "react-dom"],
    devDependencies: [
      "@types/react",
      "@types/react-dom",
      "@vitejs/plugin-react",
      "typescript",
      "vite",
    ],
    imports: {
      "src/main.tsx": [
        { names: expectedFixtureImports, specifier: "@calebhill/base" },
        { names: [], specifier: "@calebhill/base/styles.css" },
      ],
    },
  },
};

function assertSame(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} mismatch.\nExpected: ${expected.join(", ")}\nActual: ${actual.join(", ")}`);
  }
}

function readPackageManifest(packageRoot) {
  return JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
}

function readStaticBaseImports(sourcePath) {
  const source = readFileSync(sourcePath, "utf8");
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );

  return sourceFile.statements
    .filter(ts.isImportDeclaration)
    .flatMap((declaration) => {
      if (!ts.isStringLiteral(declaration.moduleSpecifier)) return [];
      const specifier = declaration.moduleSpecifier.text;
      if (specifier !== "@calebhill/base" && !specifier.startsWith("@calebhill/base/")) {
        return [];
      }

      if (!declaration.importClause) {
        return [{ names: [], specifier }];
      }

      if (
        declaration.importClause.name ||
        !declaration.importClause.namedBindings ||
        !ts.isNamedImports(declaration.importClause.namedBindings)
      ) {
        throw new Error(`Fixture Base import must use named exports only: ${sourcePath}`);
      }

      const names = declaration.importClause.namedBindings.elements
        .map((element) => element.propertyName?.text ?? element.name.text)
        .sort();
      return [{ names, specifier }];
    })
    .sort((left, right) => left.specifier.localeCompare(right.specifier));
}

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

export function assertInstalledPackageIdentity(installedPackageRoot, expectedVersion) {
  const manifest = readPackageManifest(installedPackageRoot);
  if (manifest.name !== "@calebhill/base") {
    throw new Error(
      `Installed package identity name mismatch. Expected: @calebhill/base\nActual: ${manifest.name}`,
    );
  }
  if (manifest.version !== expectedVersion) {
    throw new Error(
      `Installed package identity version mismatch. Expected: ${expectedVersion}\nActual: ${manifest.version}`,
    );
  }
}

export function assertFixtureTemplateContract(fixtureTemplateRoot, fixtureTemplate) {
  const contract = fixtureContracts[fixtureTemplate];
  if (!contract) {
    throw new Error(`Unknown installed fixture template: ${fixtureTemplate}`);
  }

  const fixturePackage = readPackageManifest(fixtureTemplateRoot);
  assertSame(
    Object.keys(fixturePackage.dependencies ?? {}).sort(),
    contract.dependencies,
    `${fixtureTemplate} fixture dependencies`,
  );
  assertSame(
    Object.keys(fixturePackage.devDependencies ?? {}).sort(),
    contract.devDependencies,
    `${fixtureTemplate} fixture devDependencies`,
  );

  for (const version of [
    ...Object.values(fixturePackage.dependencies ?? {}),
    ...Object.values(fixturePackage.devDependencies ?? {}),
  ]) {
    if (!exactVersionPattern.test(version)) {
      throw new Error(`${fixtureTemplate} fixture dependencies must use exact versions: ${version}`);
    }
  }

  for (const [sourceFile, expectedImports] of Object.entries(contract.imports)) {
    const actualImports = readStaticBaseImports(join(fixtureTemplateRoot, sourceFile));
    if (JSON.stringify(actualImports) !== JSON.stringify(expectedImports)) {
      throw new Error(
        `${fixtureTemplate} fixture Base imports mismatch in ${sourceFile}.\nExpected: ${JSON.stringify(expectedImports)}\nActual: ${JSON.stringify(actualImports)}`,
      );
    }
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
  if (!existsSync(fixtureTemplateRoot) || !lstatSync(fixtureTemplateRoot).isDirectory()) {
    throw new Error(`Expected fixture template directory: ${fixtureTemplateRoot}`);
  }
  assertFixtureTemplateContract(fixtureTemplateRoot, fixtureTemplate);

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
    let expectedVersion = resolvedSpec;
    if (tarball) {
      await assertPackageTarball(tarball);
      const artifactManifest = JSON.parse(
        execFileSync("tar", ["-xOf", tarball, "package/package.json"], { encoding: "utf8" }),
      );
      if (artifactManifest.name !== "@calebhill/base") {
        throw new Error(
          `Candidate package identity name mismatch. Expected: @calebhill/base\nActual: ${artifactManifest.name}`,
        );
      }
      expectedVersion = artifactManifest.version;
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
    onInstalledPackage?.(installedPackageRoot);
    assertInstalledPackageIdentity(installedPackageRoot, expectedVersion);
    if (tarball) assertInstalledFileParity(tarball, installedPackageRoot);

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
