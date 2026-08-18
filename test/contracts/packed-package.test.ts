import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const tarballAssertionScript = resolve("scripts/assert-tarball-contents.mjs");

interface ExtractedPackageManifest {
  bundleDependencies?: string[];
  bundledDependencies?: string[];
  dependencies?: Record<string, string>;
  exports: Record<string, unknown>;
  name: string;
  optionalDependencies?: Record<string, string>;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta?: Record<string, unknown>;
  sideEffects: string[];
  type: string;
}

function readExtractedPackageManifest(packageJsonPath: string): ExtractedPackageManifest {
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as ExtractedPackageManifest;
}

function updateExtractedPackageManifest(
  root: string,
  update: (packageJson: ExtractedPackageManifest) => void,
) {
  const packageJsonPath = join(root, "package.json");
  const packageJson = readExtractedPackageManifest(packageJsonPath);

  update(packageJson);
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
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

function runPackedArtifactAssertion(packageRoot: string) {
  const script = [
    `import { assertPackedPackage } from ${JSON.stringify(pathToFileURL(tarballAssertionScript).href)};`,
    `await assertPackedPackage(${JSON.stringify(packageRoot)});`,
  ].join("\n");

  try {
    execFileSync("node", ["--input-type=module", "--eval", script], {
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

function mutateExtractedTarball(mutator: (root: string) => void) {
  const sourceRoot = mkdtempSync(join(tmpdir(), "base-packed-package-source-"));
  const tarballRoot = mkdtempSync(join(tmpdir(), "base-packed-package-tarball-"));
  writeExtractedPackage(sourceRoot);

  try {
    execFileSync("pnpm", ["pack", "--pack-destination", tarballRoot], {
      cwd: sourceRoot,
      stdio: "ignore",
    });
    const tarballName = readdirSync(tarballRoot).find((entry) => entry.endsWith(".tgz"));
    if (!tarballName) {
      throw new Error("Expected pnpm pack to create a packed mutation artifact");
    }

    execFileSync("tar", ["-xf", join(tarballRoot, tarballName), "-C", tarballRoot]);
    const packageRoot = join(tarballRoot, "package");
    mutator(packageRoot);
    runPackedArtifactAssertion(packageRoot);
  } finally {
    rmSync(sourceRoot, { force: true, recursive: true });
    rmSync(tarballRoot, { force: true, recursive: true });
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

  it("rejects a declaration comment in place of an approved export", () => {
    expect(() =>
      mutatePackage((root) => {
        const declarationsPath = join(root, "dist/index.d.ts");
        writeFileSync(
          declarationsPath,
          readFileSync(declarationsPath, "utf8").replace("export type ButtonProps = {};", "// ButtonProps"),
        );
      }),
    ).toThrow(/declaration exports/i);
  });

  it("rejects a block-comment declaration in place of an approved export", () => {
    expect(() =>
      mutatePackage((root) => {
        const declarationsPath = join(root, "dist/index.d.ts");
        writeFileSync(
          declarationsPath,
          readFileSync(declarationsPath, "utf8").replace(
            "export type ButtonLinkProps = {};",
            "/*\nexport type ButtonLinkProps = {};\n*/",
          ),
        );
      }),
    ).toThrow(/declaration exports/i);
  });

  it("rejects an additional exported declaration", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/index.d.ts"), "\nexport type ExtraPublicType = {};\n", {
          flag: "a",
        });
      }),
    ).toThrow(/declaration exports/i);
  });

  it("rejects a default declaration export outside the approved alpha surface", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/index.d.ts"), "\nexport default Button;\n", { flag: "a" });
      }),
    ).toThrow(/declaration exports/i);
  });

  it.each([
    ["a namespace export", "export as namespace UnexpectedGlobal;\n"],
    ["a global augmentation", "declare global { interface Window { baseLeak: string } }\n"],
    ["an external module augmentation", 'declare module "react" { interface CSSProperties { baseLeak?: string } }\n'],
  ])("rejects %s outside the approved declaration surface", (_name, declaration) => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/index.d.ts"), `\n${declaration}`, { flag: "a" });
      }),
    ).toThrow(/declaration exports/i);
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
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.exports["./internal.css"] = "./dist/styles.css";
        });
      }),
    ).toThrow(/exports/i);
  });

  it("rejects a root export mapped to a stylesheet", () => {
    expect(() =>
      mutatePackage((root) => {
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.exports["."] = "./dist/styles.css";
        });
      }),
    ).toThrow(/package exports/i);
  });

  it("rejects swapped public stylesheet targets", () => {
    expect(() =>
      mutatePackage((root) => {
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.exports["./styles.css"] = "./dist/tokens.css";
          packageJson.exports["./tokens.css"] = "./dist/styles.css";
        });
      }),
    ).toThrow(/package exports/i);
  });

  it("rejects a missing CSS side effect", () => {
    expect(() =>
      mutatePackage((root) => {
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.sideEffects = ["./dist/styles.css"];
        });
      }),
    ).toThrow(/side effects/i);
  });

  it("rejects an application dependency or product string", () => {
    expect(() =>
      mutatePackage((root) => {
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.dependencies = { next: "16.0.0" };
        });
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
    ["a bare Next.js identifier", "dist/index.d.ts", "\nnext/image\n", /Next.js/i],
    ["a bare Vercel identifier", "dist/index.d.ts", "\nvercel\n", /Vercel/i],
    ["a bare Tailwind identifier", "dist/index.d.ts", "\ntailwindcss\n", /Tailwind/i],
    ["a bare source identifier", "dist/index.d.ts", "\nsrc/components/button.tsx\n", /source path/i],
    ["a bare source theme identifier", "dist/index.d.ts", "\nsrc/theme.ts\n", /source path/i],
    [
      "an unapproved generated source label",
      "dist/index.js",
      "\n// src/not-approved.ts\n",
      /source path/i,
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
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.name = "@calebhill/other";
        });
      }),
    ).toThrow(/package name/i);
  });

  it("rejects a non-ESM package module type", () => {
    expect(() =>
      mutatePackage((root) => {
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.type = "commonjs";
        });
      }),
    ).toThrow(/module type/i);
  });

  it("rejects a peer dependency range outside the approved React contract", () => {
    expect(() =>
      mutatePackage((root) => {
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.peerDependencies.react = "^18.0.0";
        });
      }),
    ).toThrow(/peer dependencies/i);
  });

  it("rejects an arbitrary runtime dependency", () => {
    expect(() =>
      mutatePackage((root) => {
        updateExtractedPackageManifest(root, (packageJson) => {
          packageJson.dependencies = { "tiny-invariant": "1.3.3" };
        });
      }),
    ).toThrow(/runtime dependencies/i);
  });

  it.each([
    ["optionalDependencies", { "optional-helper": "1.0.0" }],
    ["peerDependenciesMeta", { react: { optional: true } }],
  ] as const)("rejects a populated %s runtime dependency channel", (field, value) => {
    expect(() =>
      mutatePackage((root) => {
        updateExtractedPackageManifest(root, (packageJson) => {
          (packageJson as unknown as Record<string, unknown>)[field] = value;
        });
      }),
    ).toThrow(/runtime dependencies/i);
  });

  it.each(["bundledDependencies", "bundleDependencies"] as const)(
    "rejects a populated %s runtime dependency channel",
    (field) => {
      expect(() =>
        mutateExtractedTarball((root) => {
          updateExtractedPackageManifest(root, (packageJson) => {
            packageJson[field] = ["bundled-helper"];
          });
        }),
      ).toThrow(new RegExp(`runtime dependencies[\\s\\S]*${field}`));
    },
  );

  it.each([
    ["an application class", ".product-shell { display: grid; }"],
    ["a global selector", "body { margin: 0; }"],
    [
      "an application rule nested in media",
      "@media (prefers-reduced-motion: reduce) { .product-shell { display: grid; } }",
    ],
  ])("rejects tokens.css containing %s", (_name, content) => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/tokens.css"), `\n${content}\n`, { flag: "a" });
      }),
    ).toThrow(/tokens\.css must remain token-only/i);
  });

  it.each([
    ["a comment-only entry", "/* empty */\n"],
    ["an empty root rule", ":root {}\n"],
  ])("rejects tokens.css containing %s", (_name, tokens) => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/tokens.css"), tokens);
      }),
    ).toThrow(/tokens\.css must contain approved token rules/i);
  });

  it("rejects an unexpected packed tarball file", () => {
    expect(() =>
      mutatePackage((root) => {
        writeFileSync(join(root, "dist/unexpected.js"), "export {};\n");
      }),
    ).toThrow(/Tarball contents mismatch/i);
  });
});
