import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
];

export const expectedExports = [".", "./styles.css", "./tokens.css"].sort();
export const expectedSideEffects = ["./dist/styles.css", "./dist/tokens.css"].sort();
export const expectedPeerDependencies = ["react@>=19.0.0", "react-dom@>=19.0.0"].sort();

const forbiddenContent = [
  [/@\//, "application alias @/"],
  [/~\//, "application alias ~/"],
  [/"next"\s*:/i, "Next.js"],
  [/(?:from|import\()\s*["']next(?:\/|["'])/i, "Next.js"],
  [/@vercel\//i, "Vercel"],
  [/photos-me/i, "photos-me"],
  [/calebhill\.me/i, "calebhill.me"],
  [/status[-_]?tag/i, "StatusTag"],
  [/@tailwind\b/i, "Tailwind directive"],
  [/@import\s+(?:url\()?\s*["']tailwindcss(?:["']|\))/i, "Tailwind import"],
  [/tailwind\.config(?:\.[cm]?[jt]s)?/i, "Tailwind config"],
  [/--lab-status-(?:warning|beta)-/i, "lab warning/beta variable"],
  [/\blab-status-(?:warning|beta)\b/i, "lab warning/beta content"],
  [/(?:\.\.\/|\.\/)+src\//, "source path"],
  [/sourceMappingURL\s*=/i, "source map"],
  [/@calebhill\/base\/(?:src|dist)\//i, "source package path"],
  [/--base-(?:color-)?warning\b/i, "public warning variable"],
  [/--base-(?:color-)?beta\b/i, "public beta variable"],
];

function assertSame(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} mismatch.\nExpected: ${expected.join(", ")}\nActual: ${actual.join(", ")}`,
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
    for (const [pattern, label] of forbiddenContent) {
      if (pattern.test(content)) {
        throw new Error(`Forbidden packed content: ${label} in ${fileName}`);
      }
    }
  }
}

function assertDeclarationSurface(declarations) {
  const missing = expectedDeclarationNames.filter(
    (name) => !new RegExp(`\\b${name}\\b`).test(declarations),
  );

  if (missing.length > 0) {
    throw new Error(`Packed declarations are missing: ${missing.join(", ")}`);
  }
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
  if (packageJson.dependencies !== undefined) {
    throw new Error(
      `Packed runtime dependencies mismatch. Expected: absent\nActual: ${Object.keys(packageJson.dependencies).sort().join(", ") || "present"}`,
    );
  }
}

function assertCssContract(tokens, styles) {
  const componentClasses = [".base-button", ".base-text-input", ".base-progress-bar"];

  if (!/:root/.test(tokens) || componentClasses.some((className) => tokens.includes(className))) {
    throw new Error("tokens.css must remain token-only");
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
  assertSame(Object.keys(packageJson.exports ?? {}).sort(), expectedExports, "Packed package exports");
  assertSame([...(packageJson.sideEffects ?? [])].sort(), expectedSideEffects, "Packed CSS side effects");
  assertCssContract(tokens, styles);
}

export async function runTarballCheck({
  packageRoot = process.cwd(),
  onTemporaryRootCreated,
} = {}) {
  const resolvedPackageRoot = resolve(packageRoot);
  const tempParent = join(resolvedPackageRoot, ".tmp");
  mkdirSync(tempParent, { recursive: true });
  const tempRoot = mkdtempSync(join(tempParent, "tarball-check-"));
  onTemporaryRootCreated?.(tempRoot);

  try {
    execFileSync("pnpm", ["pack", "--pack-destination", tempRoot], {
      cwd: resolvedPackageRoot,
      stdio: "inherit",
    });

    const tarballName = readdirSync(tempRoot).find((entry) => entry.endsWith(".tgz"));
    if (!tarballName) {
      throw new Error("Expected pnpm pack to create a tarball");
    }

    const tarball = join(tempRoot, tarballName);
    const listing = execFileSync("tar", ["-tf", tarball], { encoding: "utf8" });
    assertTarballContents(listing);

    const extractedPackageRoot = join(tempRoot, "package");
    execFileSync("tar", ["-xf", tarball, "-C", tempRoot]);
    await assertPackedPackage(extractedPackageRoot);
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  await runTarballCheck();
}
