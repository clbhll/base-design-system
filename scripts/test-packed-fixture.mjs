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
const expectedFixtureRuntimeImports = [
  "BASE_THEME_ATTRIBUTE",
  "Button",
  "ButtonLink",
  "MoreIcon",
  "ProgressBar",
  "TextInput",
  "TrashIcon",
  "isBaseTheme",
].sort();
const expectedFixtureTypeImports = [
  "BaseTheme",
  "ButtonLinkProps",
  "ButtonProps",
  "ButtonSize",
  "ButtonVariant",
  "ProgressBarProps",
  "TextInputProps",
].sort();
const fixtureContracts = {
  "next-smoke": {
    dependencies: ["next", "react", "react-dom"],
    devDependencies: ["@types/node", "@types/react", "@types/react-dom", "typescript"],
    imports: {
      "app/layout.tsx": [
        {
          form: "static-side-effect",
          specifier: "@calebhill/base/styles.css",
          typeNames: [],
          valueNames: [],
        },
      ],
      "app/page.tsx": [
        {
          form: "static-named",
          specifier: "@calebhill/base",
          typeNames: expectedFixtureTypeImports,
          valueNames: expectedFixtureRuntimeImports,
        },
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
        {
          form: "static-named",
          specifier: "@calebhill/base",
          typeNames: expectedFixtureTypeImports,
          valueNames: expectedFixtureRuntimeImports,
        },
        {
          form: "static-side-effect",
          specifier: "@calebhill/base/styles.css",
          typeNames: [],
          valueNames: [],
        },
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

const fixtureCodeExtension = /\.(?:[cm]?[jt]sx?)$/;
const ignoredFixtureDirectories = new Set([".next", "dist", "node_modules"]);

function listFixtureCodeFiles(root, prefix = "") {
  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = join(prefix, entry.name);
      const path = join(root, entry.name);
      if (entry.isDirectory()) {
        return prefix === "" && ignoredFixtureDirectories.has(entry.name)
          ? []
          : listFixtureCodeFiles(path, relativePath);
      }
      return fixtureCodeExtension.test(entry.name) ? [relativePath] : [];
    })
    .sort();
}

function isBaseSpecifier(value) {
  return (
    typeof value === "string" &&
    (value === "@calebhill/base" || value.startsWith("@calebhill/base/"))
  );
}

function readFixtureBaseReferences(sourcePath, fixtureRelativePath) {
  const source = readFileSync(sourcePath, "utf8");
  const scriptKind = /\.[cm]?tsx$/.test(sourcePath)
    ? ts.ScriptKind.TSX
    : /\.[cm]?jsx$/.test(sourcePath)
      ? ts.ScriptKind.JSX
      : /\.[cm]?js$/.test(sourcePath)
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    false,
    scriptKind,
  );
  const references = [];

  function addReference(
    form,
    specifier,
    { typeNames = [], valueNames = [] } = {},
  ) {
    if (!isBaseSpecifier(specifier)) return;
    references.push({
      file: fixtureRelativePath,
      form,
      specifier,
      typeNames: [...typeNames].sort(),
      valueNames: [...valueNames].sort(),
    });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!node.importClause) {
        addReference("static-side-effect", specifier);
      } else if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        const elements = node.importClause.namedBindings.elements;
        const defaultName = node.importClause.name?.text;
        addReference(defaultName ? "static-default-named" : "static-named", specifier, {
          typeNames: [
            ...(defaultName && node.importClause.isTypeOnly ? [defaultName] : []),
            ...elements
            .filter((element) => node.importClause.isTypeOnly || element.isTypeOnly)
            .map((element) => element.propertyName?.text ?? element.name.text),
          ],
          valueNames: [
            ...(defaultName && !node.importClause.isTypeOnly ? [defaultName] : []),
            ...elements
            .filter((element) => !node.importClause.isTypeOnly && !element.isTypeOnly)
            .map((element) => element.propertyName?.text ?? element.name.text),
          ],
        });
      } else if (node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
        const defaultName = node.importClause.name?.text;
        addReference(defaultName ? "static-default-namespace" : "static-namespace", specifier, {
          [node.importClause.isTypeOnly ? "typeNames" : "valueNames"]: [
            ...(defaultName ? [defaultName] : []),
            node.importClause.namedBindings.name.text,
          ],
        });
      } else if (node.importClause.name) {
        addReference("static-default", specifier, {
          [node.importClause.isTypeOnly ? "typeNames" : "valueNames"]: [
            node.importClause.name.text,
          ],
        });
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      addReference("export-from", node.moduleSpecifier.text, {
        [node.isTypeOnly ? "typeNames" : "valueNames"]:
          node.exportClause && ts.isNamedExports(node.exportClause)
            ? node.exportClause.elements.map((element) => element.propertyName?.text ?? element.name.text)
            : ["*"],
      });
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      addReference("import-equals", node.moduleReference.expression.text, {
        [node.isTypeOnly ? "typeNames" : "valueNames"]: [node.name.text],
      });
    } else if (ts.isImportTypeNode(node)) {
      const literal = ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined;
      if (literal && ts.isStringLiteral(literal)) {
        addReference("import-type", literal.text);
      }
    } else if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const argument = node.arguments[0];
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
          addReference("dynamic-import", argument.text);
        } else if (ts.isTemplateExpression(argument)) {
          const basePrefix = [argument.head.text, argument.head.rawText].find(isBaseSpecifier);
          if (basePrefix) addReference("dynamic-import-expression", basePrefix);
        }
      } else if (
        ts.isStringLiteral(argument) ||
        ts.isNoSubstitutionTemplateLiteral(argument)
      ) {
        if (
          (ts.isIdentifier(node.expression) && node.expression.text === "require") ||
          (ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            ((node.expression.expression.text === "require" &&
              node.expression.name.text === "resolve") ||
              node.expression.name.text === "require"))
        ) {
          addReference("require", argument.text);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return references;
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

  const expectedReferences = Object.entries(contract.imports)
    .flatMap(([file, imports]) => imports.map((entry) => ({ file, ...entry })))
    .sort((left, right) =>
      `${left.file}:${left.specifier}:${left.form}`.localeCompare(
        `${right.file}:${right.specifier}:${right.form}`,
      ),
    );
  const actualReferences = listFixtureCodeFiles(fixtureTemplateRoot)
    .flatMap((file) =>
      readFixtureBaseReferences(join(fixtureTemplateRoot, file), file),
    )
    .sort((left, right) =>
      `${left.file}:${left.specifier}:${left.form}`.localeCompare(
        `${right.file}:${right.specifier}:${right.form}`,
      ),
    );
  if (JSON.stringify(actualReferences) !== JSON.stringify(expectedReferences)) {
    throw new Error(
      `${fixtureTemplate} fixture Base imports mismatch.\nExpected: ${JSON.stringify(expectedReferences)}\nActual: ${JSON.stringify(actualReferences)}`,
    );
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
