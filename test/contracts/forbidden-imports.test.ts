import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfigFile: "eslint.config.mjs",
});

const bannedImports = [
  "next/*",
  "@vercel/*",
  "@/*",
  "~/*",
  "photos-me/*",
  "calebhill.me/*",
] as const;

interface ResolvedConfig {
  languageOptions: {
    globals?: Record<string, unknown>;
  };
  rules: Record<string, unknown>;
}

async function resolvedConfig(filePath: string) {
  const config = (await eslint.calculateConfigForFile(filePath)) as ResolvedConfig | undefined;

  expect(config).toBeDefined();

  return config!;
}

describe("lint contracts", () => {
  it.each([
    "test/fixtures/vite-smoke/src/main.tsx",
    "test/fixtures/next-smoke/app/page.tsx",
  ])("leaves standalone fixture template %s to its installed consumer checks", async (path) => {
    await expect(eslint.isPathIgnored(path)).resolves.toBe(true);
  });

  it("resolves every forbidden import into the TypeScript policy", async () => {
    const config = await resolvedConfig("src/index.ts");

    expect(config.rules["no-restricted-imports"]).toEqual([
      2,
      { patterns: bannedImports },
    ]);
  });

  it("provides Node globals to JavaScript scripts", async () => {
    const config = await resolvedConfig("scripts/node-global-probe.mjs");

    expect(config.languageOptions.globals?.process).toBe(false);
  });

  it("enforces the recommended React Hooks rules", async () => {
    const config = await resolvedConfig("src/index.ts");

    expect(config.rules["react-hooks/rules-of-hooks"]).toEqual([2]);
  });

});
