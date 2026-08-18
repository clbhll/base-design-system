import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import postcss from "postcss";
import ts from "typescript";

export const expectedTarballFiles = [
  "package/LICENSE",
  "package/README.md",
  "package/dist/index.d.ts",
  "package/dist/index.js",
  "package/dist/styles.css",
  "package/dist/tokens.css",
  "package/package.json",
].sort();

export const expectedRuntimeExports = [
  "BASE_THEME_ATTRIBUTE",
  "Button",
  "ButtonLink",
  "MoreIcon",
  "ProgressBar",
  "TextInput",
  "TrashIcon",
  "isBaseTheme",
].sort();

export const expectedDeclarationNames = [
  "BASE_THEME_ATTRIBUTE",
  "BaseTheme",
  "Button",
  "ButtonProps",
  "ButtonLink",
  "ButtonLinkProps",
  "ButtonVariant",
  "ButtonSize",
  "MoreIcon",
  "ProgressBar",
  "TextInput",
  "TextInputProps",
  "ProgressBarProps",
  "TrashIcon",
  "isBaseTheme",
].sort();

export const expectedExports = {
  ".": { import: "./dist/index.js", types: "./dist/index.d.ts" },
  "./styles.css": "./dist/styles.css",
  "./tokens.css": "./dist/tokens.css",
};
export const expectedSideEffects = ["./dist/styles.css", "./dist/tokens.css"].sort();
export const expectedPeerDependencies = ["react@>=19.0.0", "react-dom@>=19.0.0"].sort();

const forbiddenContent = [
  [/@\//, "application alias @/"],
  [/~\//, "application alias ~/"],
  [/"next"\s*:/i, "Next.js"],
  [/(?:from|import\()\s*["']next(?:\/|["'])/i, "Next.js"],
  [/\bnext\/[a-z0-9._-]+/i, "Next.js"],
  [/@vercel\//i, "Vercel"],
  [/\bvercel\b/i, "Vercel"],
  [/photos-me/i, "photos-me"],
  [/calebhill\.me/i, "calebhill.me"],
  [/status[-_]?tag/i, "StatusTag"],
  [/@tailwind\b/i, "Tailwind directive"],
  [/@import\s+(?:url\()?\s*["']tailwindcss(?:["']|\))/i, "Tailwind import"],
  [/tailwind\.config(?:\.[cm]?[jt]s)?/i, "Tailwind config"],
  [/\btailwindcss\b/i, "Tailwind"],
  [/--lab-status-(?:warning|beta)-/i, "lab warning/beta variable"],
  [/\blab-status-(?:warning|beta)\b/i, "lab warning/beta content"],
  [/@calebhill\/base\/(?:src|dist)\//i, "source package path"],
  [/(?:\.\.\/|\.\/)+src\//, "source path"],
  [/\bsrc\//i, "source path"],
  [/sourceMappingURL\s*=/i, "source map"],
  [/--base-(?:color-)?warning\b/i, "public warning variable"],
  [/--base-(?:color-)?beta\b/i, "public beta variable"],
];

// tsup emits these exact source-section labels in the approved ESM bundle. They are
// build annotations, not importable paths; any other `src/` content remains forbidden.
const approvedTsupSourceLabels = new Set([
  "src/theme.ts",
  "src/components/button.tsx",
  "src/components/text-input.tsx",
  "src/components/progress-bar.tsx",
  "src/components/icons/more-icon.tsx",
  "src/components/icons/trash-icon.tsx",
]);

function assertSame(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} mismatch.\nExpected: ${expected.join(", ")}\nActual: ${actual.join(", ")}`,
    );
  }
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeValue(entry)]),
    );
  }

  return value;
}

function assertExactValue(actual, expected, label) {
  const normalizedActual = normalizeValue(actual);
  const normalizedExpected = normalizeValue(expected);

  if (JSON.stringify(normalizedActual) !== JSON.stringify(normalizedExpected)) {
    throw new Error(
      `${label} mismatch.\nExpected: ${JSON.stringify(normalizedExpected)}\nActual: ${JSON.stringify(normalizedActual)}`,
    );
  }
}

export function assertTarballContents(listing) {
  const actual = listing
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();

  assertSame(actual, expectedTarballFiles, "Tarball contents");
}

function readPackageFile(packageRoot, path) {
  return readFileSync(join(packageRoot, path), "utf8");
}

function assertForbiddenContent(files) {
  for (const [fileName, content] of Object.entries(files)) {
    const scannedContent =
      fileName === "dist/index.js"
        ? content
            .split(/\r?\n/)
            .map((line) => {
              const sourceLabel = /^\/\/ (src\/[^\r\n]+)$/.exec(line)?.[1];
              return sourceLabel && approvedTsupSourceLabels.has(sourceLabel) ? "" : line;
            })
            .join("\n")
        : content;

    for (const [pattern, label] of forbiddenContent) {
      if (pattern.test(scannedContent)) {
        throw new Error(`Forbidden packed content: ${label} in ${fileName}`);
      }
    }
  }
}

function assertDeclarationSurface(declarations) {
  const names = new Set();
  const sourceFile = ts.createSourceFile("dist/index.d.ts", declarations, ts.ScriptTarget.Latest, false);
  const allowedTopLevelStatementKinds = new Set([
    ts.SyntaxKind.ImportDeclaration,
    ts.SyntaxKind.VariableStatement,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.TypeAliasDeclaration,
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.ExportDeclaration,
  ]);
  const hasExportModifier = (node) =>
    node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

  for (const statement of sourceFile.statements) {
    if (!allowedTopLevelStatementKinds.has(statement.kind)) {
      throw new Error(
        `Packed declaration exports mismatch. Unexpected top-level ${ts.SyntaxKind[statement.kind]} statement`,
      );
    }

    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
        names.add("*");
        continue;
      }

      for (const element of statement.exportClause.elements) {
        names.add(element.name.text);
      }
      continue;
    }

    if (!hasExportModifier(statement)) {
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          names.add(declaration.name.text);
        }
      }
      continue;
    }

    if ("name" in statement && statement.name && ts.isIdentifier(statement.name)) {
      names.add(statement.name.text);
    }
  }

  assertSame([...names].sort(), expectedDeclarationNames, "Packed declaration exports");
}

function assertPackageMetadata(packageJson) {
  if (packageJson.name !== "@calebhill/base") {
    throw new Error(`Packed package name mismatch. Expected: @calebhill/base\nActual: ${packageJson.name}`);
  }

  if (packageJson.type !== "module") {
    throw new Error(`Packed package module type mismatch. Expected: module\nActual: ${packageJson.type}`);
  }

  const actualPeers = Object.entries(packageJson.peerDependencies ?? {})
    .map(([name, range]) => `${name}@${range}`)
    .sort();
  assertSame(actualPeers, expectedPeerDependencies, "Packed peer dependencies");

}

function assertRuntimeDependencies(packageJson) {
  const runtimeChannels = [
    "dependencies",
    "optionalDependencies",
    "bundledDependencies",
    "bundleDependencies",
    "peerDependenciesMeta",
  ];
  const presentChannels = runtimeChannels.filter((channel) => Object.hasOwn(packageJson, channel));

  if (presentChannels.length > 0) {
    throw new Error(
      `Packed runtime dependencies mismatch. Expected absent channels: ${runtimeChannels.join(", ")}\nActual: ${presentChannels.join(", ")}`,
    );
  }
}

function assertCssContract(tokens, styles) {
  const allowedTokenSelectors = new Set([
    ":root",
    '[data-base-theme="light"]',
    '[data-base-theme="dark"]',
  ]);
  const tokenRoot = postcss.parse(tokens);
  let tokenRuleCount = 0;

  const assertTokenRule = (rule) => {
    if (!rule.selectors || rule.selectors.some((selector) => !allowedTokenSelectors.has(selector))) {
      throw new Error("tokens.css must remain token-only: selectors must be root or Base theme selectors");
    }

    if (!rule.nodes?.length) {
      throw new Error("tokens.css must contain approved token rules: every allowed rule needs --base-* declarations");
    }

    if (rule.nodes.some((node) => node.type !== "decl" || !node.prop.startsWith("--base-"))) {
      throw new Error("tokens.css must remain token-only: declarations must be --base-* custom properties");
    }

    tokenRuleCount += 1;
  };

  for (const node of tokenRoot.nodes ?? []) {
    if (node.type === "comment") {
      continue;
    }

    if (node.type === "rule") {
      assertTokenRule(node);
      continue;
    }

    if (node.type === "atrule" && node.name === "media" && node.params === "(prefers-reduced-motion: reduce)") {
      for (const child of node.nodes ?? []) {
        if (child.type !== "rule") {
          throw new Error("tokens.css must remain token-only: media blocks may contain token rules only");
        }
        assertTokenRule(child);
      }
      continue;
    }

    throw new Error("tokens.css must remain token-only: only root or Base theme token rules are allowed");
  }

  if (tokenRuleCount === 0) {
    throw new Error("tokens.css must contain approved token rules");
  }

  const missingComponents = [
    ["button", ".base-button"],
    ["text-input", ".base-text-input"],
    ["progress-bar", ".base-progress-bar"],
  ].filter(([name, className]) =>
    !styles.includes(`base-component: ${name}`) || !styles.includes(className),
  );

  if (missingComponents.length > 0) {
    throw new Error(
      `styles.css is missing component sentinels: ${missingComponents.map(([name]) => name).join(", ")}`,
    );
  }
}

export async function assertPackedPackage(packageRoot) {
  const packageJson = JSON.parse(readPackageFile(packageRoot, "package.json"));
  const declarations = readPackageFile(packageRoot, "dist/index.d.ts");
  const source = readPackageFile(packageRoot, "dist/index.js");
  const tokens = readPackageFile(packageRoot, "dist/tokens.css");
  const styles = readPackageFile(packageRoot, "dist/styles.css");

  assertPackageMetadata(packageJson);
  assertForbiddenContent({
    "package.json": JSON.stringify(packageJson),
    "dist/index.js": source,
    "dist/index.d.ts": declarations,
    "dist/tokens.css": tokens,
    "dist/styles.css": styles,
  });
  assertRuntimeDependencies(packageJson);
  const runtimeModule = await import(pathToFileURL(join(packageRoot, "dist/index.js")).href);
  assertSame(Object.keys(runtimeModule).sort(), expectedRuntimeExports, "Packed runtime exports");
  assertDeclarationSurface(declarations);
  assertExactValue(packageJson.exports, expectedExports, "Packed package exports");
  assertSame([...(packageJson.sideEffects ?? [])].sort(), expectedSideEffects, "Packed CSS side effects");
  assertCssContract(tokens, styles);
}

export async function assertPackageTarball(
  tarballPath,
  { onTemporaryRootCreated } = {},
) {
  const tarball = resolve(tarballPath);
  if (!tarball.endsWith(".tgz")) {
    throw new Error(`Expected a .tgz package tarball: ${tarball}`);
  }

  const tempParent = resolve(process.cwd(), ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, "supplied-tarball-check-"));

  try {
    onTemporaryRootCreated?.(tempRoot);
    const listing = execFileSync("tar", ["-tf", tarball], { encoding: "utf8" });
    assertTarballContents(listing);
    execFileSync("tar", ["-xf", tarball, "-C", tempRoot]);
    await assertPackedPackage(join(tempRoot, "package"));
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

export async function runTarballCheck({
  packageRoot = process.cwd(),
  onTemporaryRootCreated,
} = {}) {
  const resolvedPackageRoot = resolve(packageRoot);
  const tempParent = join(resolvedPackageRoot, ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, "tarball-check-"));

  try {
    onTemporaryRootCreated?.(tempRoot);
    execFileSync("pnpm", ["pack", "--pack-destination", tempRoot], {
      cwd: resolvedPackageRoot,
      stdio: "inherit",
    });

    const tarballName = readdirSync(tempRoot).find((entry) => entry.endsWith(".tgz"));
    if (!tarballName) {
      throw new Error("Expected pnpm pack to create a tarball");
    }

    await assertPackageTarball(join(tempRoot, tarballName));
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  await runTarballCheck();
}
