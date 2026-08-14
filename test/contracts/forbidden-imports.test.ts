import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

describe("forbidden imports", () => {
  it("reports no-restricted-imports for banned source imports", async () => {
    const eslint = new ESLint({
      cwd: process.cwd(),
      overrideConfigFile: "eslint.config.mjs",
    });

    const [result] = await eslint.lintText('import Link from "next/link";\nexport const value = Link;\n', {
      filePath: "src/index.ts",
    });

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "no-restricted-imports",
        }),
      ]),
    );
  });
});
