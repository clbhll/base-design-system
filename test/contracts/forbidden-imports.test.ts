import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfigFile: "eslint.config.mjs",
});

const bannedImports = [
  ["next/*", "next/link"],
  ["@vercel/*", "@vercel/analytics"],
  ["@/*", "@/components/button"],
  ["~/*", "~/utilities"],
  ["photos-me/*", "photos-me/components/button"],
  ["calebhill.me/*", "calebhill.me/components/button"],
] as const;

describe("lint contracts", () => {
  it("leaves the standalone fixture template to its installed consumer checks", async () => {
    await expect(
      eslint.isPathIgnored("test/fixtures/vite-smoke/src/main.tsx"),
    ).resolves.toBe(true);
  });

  it.each(bannedImports)("reports no-restricted-imports for %s", async (_pattern, specifier) => {
    const [result] = await eslint.lintText(
      `import value from "${specifier}";\nexport { value };\n`,
      { filePath: "src/index.ts" },
    );

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "no-restricted-imports",
        }),
      ]),
    );
  });

  it("provides Node globals to JavaScript scripts", async () => {
    const [result] = await eslint.lintText("export const cwd = process.cwd();\n", {
      filePath: "scripts/node-global-probe.mjs",
    });

    expect(result.messages).toEqual([]);
  });

  it("enforces the recommended React Hooks rules", async () => {
    const source = [
      'import { useState } from "react";',
      "export function Probe(enabled: boolean) {",
      "  if (enabled) useState(0);",
      "  return null;",
      "}",
    ].join("\n");
    const [result] = await eslint.lintText(source, { filePath: "src/index.ts" });

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "react-hooks/rules-of-hooks",
        }),
      ]),
    );
  });
});
