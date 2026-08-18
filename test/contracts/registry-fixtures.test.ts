import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  assertExactPackageSpec,
  assertFixtureTemplateContract,
  assertInstalledFileParity,
  assertInstalledPackageIdentity,
  assertPathContained,
  runInstalledFixture,
} from "../../scripts/test-packed-fixture.mjs";

const fixtureRoot = resolve("test/fixtures");
const runtimeExports = [
  "BASE_THEME_ATTRIBUTE",
  "Button",
  "ButtonLink",
  "MoreIcon",
  "ProgressBar",
  "TextInput",
  "TrashIcon",
  "isBaseTheme",
];
const representativeTypes = [
  "BaseTheme",
  "ButtonLinkProps",
  "ButtonProps",
  "ButtonSize",
  "ButtonVariant",
  "ProgressBarProps",
  "TextInputProps",
];
const fixtureDependencies = {
  "next-smoke": {
    dependencies: ["next", "react", "react-dom"],
    devDependencies: ["@types/node", "@types/react", "@types/react-dom", "typescript"],
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
  },
} as const;

function createCandidateTarball() {
  const root = mkdtempSync(join(tmpdir(), "base-fixture-candidate-"));
  execFileSync("pnpm", ["pack", "--pack-destination", root], { stdio: "ignore" });
  const tarballName = readdirSync(root).find((entry) => entry.endsWith(".tgz"));
  if (!tarballName) throw new Error("Expected a candidate tarball");

  return { root, tarball: join(root, tarballName) };
}

function mutateFixture(
  name: keyof typeof fixtureDependencies,
  mutation: (root: string) => void,
) {
  const tempRoot = mkdtempSync(join(tmpdir(), `base-${name}-mutation-`));
  const fixturePath = join(tempRoot, name);
  cpSync(join(fixtureRoot, name), fixturePath, { recursive: true });
  mutation(fixturePath);

  try {
    assertFixtureTemplateContract(fixturePath, name);
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

function readFixture(name: string) {
  const root = join(fixtureRoot, name);
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
    dependencies: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const sourceFiles =
    name === "vite-smoke"
      ? [join(root, "src/main.tsx")]
      : [join(root, "app/layout.tsx"), join(root, "app/page.tsx")];

  return {
    packageJson,
    source: sourceFiles.map((path) => readFileSync(path, "utf8")).join("\n"),
  };
}

describe("registry fixture package spec contract", () => {
  it.each(["0.1.0-alpha.0", "2.3.4", "12.0.0-beta.12"]) (
    "accepts exact registry version %s",
    (version) => {
      expect(() => assertExactPackageSpec(version)).not.toThrow();
    },
  );

  it("accepts an existing absolute tarball", () => {
    const root = mkdtempSync(join(tmpdir(), "base-fixture-spec-"));
    const tarball = join(root, "candidate.tgz");
    writeFileSync(tarball, "candidate");

    try {
      expect(() => assertExactPackageSpec(tarball)).not.toThrow();
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it.each([
    "next",
    "latest",
    "^0.1.0",
    "~0.1.0",
    ">=0.1.0",
    "0.1.x",
    "workspace:*",
    "file:../base-design-system",
    "../base-design-system",
    "git+https://github.com/clbhll/base-design-system.git",
    "https://registry.example.invalid/base.tgz",
  ])("rejects non-exact or unsafe package source %s", (specifier) => {
    expect(() => assertExactPackageSpec(specifier)).toThrow(/exact version|tarball/i);
  });
});

describe("installed registry artifact seams", () => {
  it("requires the installed manifest to match the requested Base identity", () => {
    const root = mkdtempSync(join(tmpdir(), "base-installed-identity-"));
    const packageJsonPath = join(root, "package.json");
    writeFileSync(
      packageJsonPath,
      `${JSON.stringify({ name: "@calebhill/base", version: "0.1.0-alpha.0" })}\n`,
    );

    try {
      expect(() => assertInstalledPackageIdentity(root, "0.1.0-alpha.0")).not.toThrow();
      writeFileSync(
        packageJsonPath,
        `${JSON.stringify({ name: "@calebhill/base", version: "0.1.0-alpha.1" })}\n`,
      );
      expect(() => assertInstalledPackageIdentity(root, "0.1.0-alpha.0")).toThrow(
        /installed package identity.*version/i,
      );
      writeFileSync(packageJsonPath, `${JSON.stringify({ name: "photos-me", version: "0.1.0-alpha.0" })}\n`);
      expect(() => assertInstalledPackageIdentity(root, "0.1.0-alpha.0")).toThrow(
        /installed package identity.*name/i,
      );
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("rejects a candidate whose installed manifest is mutated before runner validation", async () => {
    const candidate = createCandidateTarball();
    let temporaryRoot = "";

    try {
      await expect(
        runInstalledFixture({
          fixtureTemplate: "vite-smoke",
          packageSpec: candidate.tarball,
          onTemporaryRootCreated: (root) => {
            temporaryRoot = root;
          },
          onInstalledPackage: (installedRoot) => {
            const packageJsonPath = join(installedRoot, "package.json");
            const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
              name: string;
              version: string;
            };
            packageJson.version = "9.9.9";
            writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
          },
        }),
      ).rejects.toThrow(/installed package identity.*version/i);
      expect(temporaryRoot).not.toBe("");
      expect(() => readFileSync(join(temporaryRoot, "run/package.json"))).toThrow();
    } finally {
      rmSync(candidate.root, { force: true, recursive: true });
    }
  });

  it("rejects an installed package path outside its task-owned root", () => {
    const root = resolve(".tmp/registry-fixture-run");

    expect(() => assertPathContained(resolve(".tmp/escaped/package"), root)).toThrow(
      /outside.*root/i,
    );
  });

  it("accepts an installed package path contained by its task-owned root", () => {
    const root = resolve(".tmp/registry-fixture-run");

    expect(() => assertPathContained(join(root, "node_modules/@calebhill/base"), root)).not.toThrow();
  });

  it("requires installed package files to exactly match the registry tarball", () => {
    const root = mkdtempSync(join(tmpdir(), "base-fixture-parity-"));
    const packageRoot = join(root, "package");
    const installedRoot = join(root, "installed");
    const tarball = join(root, "candidate.tgz");
    mkdirSync(join(packageRoot, "dist"), { recursive: true });
    mkdirSync(join(installedRoot, "dist"), { recursive: true });
    writeFileSync(join(packageRoot, "package.json"), "{}\n");
    writeFileSync(join(packageRoot, "dist/index.js"), "export {};\n");
    writeFileSync(join(installedRoot, "package.json"), "{}\n");
    writeFileSync(join(installedRoot, "dist/index.js"), "export const changed = true;\n");
    execFileSync("tar", ["-czf", tarball, "package"], { cwd: root });

    try {
      expect(() => assertInstalledFileParity(tarball, installedRoot)).toThrow(/file parity/i);
      writeFileSync(join(installedRoot, "dist/index.js"), "export {};\n");
      expect(() => assertInstalledFileParity(tarball, installedRoot)).not.toThrow();
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});

describe.each(["vite-smoke", "next-smoke"])("%s public package fixture", (name) => {
  it("uses only the complete public Base API and stylesheet", () => {
    const { source } = readFixture(name);
    const baseImportSpecifiers = [...source.matchAll(/(?:from\s+)?["'](@calebhill\/base(?:\/[^"']+)*)["']/g)]
      .map(([, specifier]) => specifier)
      .sort();
    const rootImport = /import\s*\{([\s\S]*?)\}\s*from\s*["']@calebhill\/base["']/.exec(source)?.[1] ?? "";
    const importedIdentifiers = rootImport
      .split(",")
      .map((entry) => entry.trim().replace(/^type\s+/, ""))
      .filter(Boolean)
      .sort();

    expect(baseImportSpecifiers).toEqual(["@calebhill/base", "@calebhill/base/styles.css"]);
    expect(importedIdentifiers).toEqual([...runtimeExports, ...representativeTypes].sort());
    expect(source).toMatch(/href=["']#fixture["']/);
    expect(source).toMatch(/id=["']fixture["']/);
    expect(source).not.toMatch(
      /StatusTag|@\/|~\/|@calebhill\/base\/(?:src|dist)|\.\.\/.*src|tailwind|postcss|@vercel|photos-me|calebhill\.me/i,
    );
  });

  it("pins only framework and build dependencies", () => {
    const { packageJson } = readFixture(name);
    const dependencyNames = Object.keys(packageJson.dependencies).sort();
    const devDependencyNames = Object.keys(packageJson.devDependencies ?? {}).sort();
    const approved = fixtureDependencies[name as keyof typeof fixtureDependencies];

    expect(dependencyNames).toEqual([...approved.dependencies]);
    expect(devDependencyNames).toEqual([...approved.devDependencies]);
    for (const version of [
      ...Object.values(packageJson.dependencies),
      ...Object.values(packageJson.devDependencies ?? {}),
    ]) {
      expect(version).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
    }
  });

  it("rejects an additional exact-version product or framework dependency", () => {
    expect(() =>
      mutateFixture(name as keyof typeof fixtureDependencies, (root) => {
        const packageJsonPath = join(root, "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
          dependencies: Record<string, string>;
        };
        packageJson.dependencies[name === "vite-smoke" ? "next" : "photos-me"] = "1.2.3";
        writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }),
    ).toThrow(/fixture dependencies/i);
  });

  it("rejects an additional Base package subpath", () => {
    expect(() =>
      mutateFixture(name as keyof typeof fixtureDependencies, (root) => {
        const sourcePath =
          name === "vite-smoke" ? join(root, "src/main.tsx") : join(root, "app/layout.tsx");
        writeFileSync(sourcePath, '\nimport "@calebhill/base/tokens.css";\n', { flag: "a" });
      }),
    ).toThrow(/fixture Base imports/i);
  });
});

describe("Next fixture boundary", () => {
  it("is a minimal Next 16 App Router client fixture without aliases", () => {
    const { packageJson, source } = readFixture("next-smoke");
    const tsconfig = readFileSync(join(fixtureRoot, "next-smoke/tsconfig.json"), "utf8");
    const nextConfig = readFileSync(join(fixtureRoot, "next-smoke/next.config.ts"), "utf8");

    expect(packageJson.dependencies.next).toMatch(/^16\./);
    expect(source).toMatch(/["']use client["']/);
    expect(tsconfig).not.toMatch(/"paths"|"baseUrl"/);
    expect(tsconfig).toContain(".next/dev/types/**/*.ts");
    expect(nextConfig).toMatch(/turbopack:\s*\{\s*root:\s*process\.cwd\(\)/);
  });
});
