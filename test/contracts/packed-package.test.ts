import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

const tarballAssertionScript = resolve("scripts/assert-tarball-contents.mjs");

interface ExtractedPackageManifest {
  dependencies?: Record<string, string>;
  exports: Record<string, unknown>;
  name: string;
  peerDependencies: Record<string, string>;
  sideEffects: string[];
  type: string;
}

function readExtractedPackageManifest(packageJsonPath: string): ExtractedPackageManifest {
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as ExtractedPackageManifest;
}

function writeExtractedPackage(root: string) {
  mkdirSync(join(root, "dist"), { recursive: true });
  writeFileSync(join(root, "LICENSE"), "MIT\n");
  writeFileSync(join(root, "README.md"), "# Base\n");
  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify(
      {
        name: "@calebhill/base",
        version: "0.0.0",
        type: "module",
        files: ["dist", "LICENSE", "README.md"],
        exports: {
          ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
          "./styles.css": "./dist/styles.css",
          "./tokens.css": "./dist/tokens.css",
        },
        sideEffects: ["./dist/styles.css", "./dist/tokens.css"],
        peerDependencies: { react: ">=19.0.0", "react-dom": ">=19.0.0" },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(root, "dist/index.js"),
    [
      'export const BASE_THEME_ATTRIBUTE = "data-base-theme";',
      "export const Button = null;",
      "export const ButtonLink = null;",
      "export const MoreIcon = null;",
      "export const ProgressBar = null;",
      "export const TextInput = null;",
      "export const TrashIcon = null;",
      "export const isBaseTheme = () => true;",
    ].join("\n"),
  );
  writeFileSync(
    join(root, "dist/index.d.ts"),
    [
      'export declare const BASE_THEME_ATTRIBUTE: "data-base-theme";',
      "export type BaseTheme = 'light' | 'dark';",
      "export declare const Button: unknown;",
      "export type ButtonProps = {};",
      "export declare const ButtonLink: unknown;",
      "export type ButtonLinkProps = {};",
      "export type ButtonVariant = 'primary';",
      "export type ButtonSize = 'default';",
      "export declare const MoreIcon: unknown;",
      "export declare const ProgressBar: unknown;",
      "export declare const TextInput: unknown;",
      "export type TextInputProps = {};",
      "export type ProgressBarProps = {};",
      "export declare const TrashIcon: unknown;",
      "export declare function isBaseTheme(value: string): value is BaseTheme;",
    ].join("\n"),
  );
  writeFileSync(join(root, "dist/tokens.css"), ":root { --base-color-text-primary: black; }\n");
  writeFileSync(
    join(root, "dist/styles.css"),
    [
      "/* base-component: button */ .base-button {}",
      "/* base-component: text-input */ .base-text-input {}",
      "/* base-component: progress-bar */ .base-progress-bar {}",
    ].join("\n"),
  );
}

function runTarballAssertion(root: string) {
  try {
    execFileSync("node", [tarballAssertionScript], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const failure = error as { stderr?: Buffer | string };
    throw new Error(String(failure.stderr ?? error));
  }
}

function mutatePackage(mutator: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), "base-packed-package-"));
  writeExtractedPackage(root);
  mutator(root);

  try {
    runTarballAssertion(root);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

describe("packed package contract", () => {
  it("rejects a runtime export outside the approved alpha surface", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(
          join(root, "dist/index.js"),
          "export const UnexpectedRuntimeExport = null;\n",
          { flag: "a" },
        );
      }),
    ).toThrow(/runtime exports/i);
  });

  it("rejects an extracted package missing an approved declaration", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/index.d.ts"), "export type BaseTheme = 'light' | 'dark';\n");
      }),
    ).toThrow(/declarations/i);
  });

  it("rejects an extracted package missing an approved runtime declaration", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(
          join(root, "dist/index.d.ts"),
          [
            "export type BaseTheme = 'light' | 'dark';",
            "export type ButtonProps = {};",
            "export type ButtonLinkProps = {};",
            "export type ButtonVariant = 'primary';",
            "export type ButtonSize = 'default';",
            "export type TextInputProps = {};",
            "export type ProgressBarProps = {};",
          ].join("\n"),
        );
      }),
    ).toThrow(/declarations/i);
  });

  it("rejects StatusTag in packed declarations", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/index.d.ts"), "\nexport type StatusTag = {};\n", { flag: "a" });
      }),
    ).toThrow(/forbidden packed content.*StatusTag/i);
  });

  it("rejects StatusTag in packed CSS", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/styles.css"), "\n.base-status-tag {}\n", { flag: "a" });
      }),
    ).toThrow(/forbidden packed content.*StatusTag/i);
  });

  it("rejects a fourth package export path", () => {
    expect(() =>
      mutatePackage((root) => {
        const packageJsonPath = join(root, "package.json");
        const packageJson = readExtractedPackageManifest(packageJsonPath);
        packageJson.exports["./internal.css"] = "./dist/styles.css";
        writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }),
    ).toThrow(/exports/i);
  });

  it("rejects a missing CSS side effect", () => {
    expect(() =>
      mutatePackage((root) => {
        const packageJsonPath = join(root, "package.json");
        const packageJson = readExtractedPackageManifest(packageJsonPath);
        packageJson.sideEffects = ["./dist/styles.css"];
        writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }),
    ).toThrow(/side effects/i);
  });

  it("rejects an application dependency or product string", () => {
    expect(() =>
      mutatePackage((root) => {
        const packageJsonPath = join(root, "package.json");
        const packageJson = readExtractedPackageManifest(packageJsonPath);
        packageJson.dependencies = { next: "16.0.0" };
        writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }),
    ).toThrow(/forbidden packed content.*next/i);
  });

  it.each([
    ["a Tailwind directive", "dist/styles.css", "\n@tailwind utilities;\n", /Tailwind directive/i],
    ["a Tailwind import", "dist/tokens.css", '\n@import "tailwindcss";\n', /Tailwind import/i],
    ["a Tailwind config reference", "dist/index.d.ts", "\n// tailwind.config.ts\n", /Tailwind config/i],
    [
      "a lab warning variable",
      "dist/tokens.css",
      "\n:root { --lab-status-warning-background: orange; }\n",
      /lab warning\/beta variable/i,
    ],
    ["lab beta content", "dist/index.js", "\n// lab-status-beta\n", /lab warning\/beta content/i],
    [
      "a relative source path",
      "dist/index.d.ts",
      '\nexport * from "../../src/components/button";\n',
      /source path/i,
    ],
    ["a source map reference", "dist/index.js", "\n//# sourceMappingURL=index.js.map\n", /source map/i],
    [
      "a source package path",
      "dist/index.d.ts",
      '\nimport type {} from "@calebhill/base/src/components/button";\n',
      /source package path/i,
    ],
  ])("rejects %s from the packed artifact", (_name, file, content, expectedError) => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, file), content, { flag: "a" });
      }),
    ).toThrow(expectedError);
  });

  it("rejects a package name outside the approved identity", () => {
    expect(() =>
      mutatePackage((root) => {
        const packageJsonPath = join(root, "package.json");
        const packageJson = readExtractedPackageManifest(packageJsonPath);
        packageJson.name = "@calebhill/other";
        writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }),
    ).toThrow(/package name/i);
  });

  it("rejects a non-ESM package module type", () => {
    expect(() =>
      mutatePackage((root) => {
        const packageJsonPath = join(root, "package.json");
        const packageJson = readExtractedPackageManifest(packageJsonPath);
        packageJson.type = "commonjs";
        writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }),
    ).toThrow(/module type/i);
  });

  it("rejects a peer dependency range outside the approved React contract", () => {
    expect(() =>
      mutatePackage((root) => {
        const packageJsonPath = join(root, "package.json");
        const packageJson = readExtractedPackageManifest(packageJsonPath);
        packageJson.peerDependencies.react = "^18.0.0";
        writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }),
    ).toThrow(/peer dependencies/i);
  });

  it("rejects an arbitrary runtime dependency", () => {
    expect(() =>
      mutatePackage((root) => {
        const packageJsonPath = join(root, "package.json");
        const packageJson = readExtractedPackageManifest(packageJsonPath);
        packageJson.dependencies = { "tiny-invariant": "1.3.3" };
        writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }),
    ).toThrow(/runtime dependencies/i);
  });

  it("rejects an unexpected packed tarball file", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/unexpected.js"), "export {};\n");
      }),
    ).toThrow(/Tarball contents mismatch/i);
  });
});
