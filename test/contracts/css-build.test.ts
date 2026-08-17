import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentStyleSentinels = [
  "/* base-component: button */",
  "/* base-component: text-input */",
  "/* base-component: progress-bar */",
] as const;

describe("css build", () => {
  it("keeps the lab aggregate aligned with the public stylesheet order", () => {
    const labStyles = readFileSync("lab/src/styles.css", "utf8");

    expect(labStyles).toBe(
      '@import "../../src/styles/tokens.css";\n@import "../../src/styles/styles.css";\n',
    );
  });

  it("copies tokens and concatenates styles in order", () => {
    try {
      rmSync("dist", { force: true, recursive: true });
      mkdirSync("dist", { recursive: true });

      execFileSync("node", ["scripts/build-css.mjs"], { stdio: "inherit" });

      const sourceTokens = readFileSync("src/styles/tokens.css", "utf8");
      const sourceStyles = readFileSync("src/styles/styles.css", "utf8");
      const tokens = readFileSync("dist/tokens.css", "utf8");
      const styles = readFileSync("dist/styles.css", "utf8");

      expect(tokens).toBe(sourceTokens);
      expect(styles.startsWith(`${sourceTokens}\n\n${sourceStyles}`)).toBe(true);
      expect(styles.startsWith(tokens)).toBe(true);
      expect(tokens).toMatch(/^:root\s*\{/);
      expect(tokens).toContain(':root,\n[data-base-theme="light"]');
      expect(tokens).toContain('[data-base-theme="dark"]');
      expect(tokens).toContain("--base-color-text-primary");
      expect(tokens).toContain("@media (prefers-reduced-motion: reduce)");
      expect(styles).toContain(".base-type-display");

      let previousIndex = styles.indexOf(sourceStyles);
      for (const sentinel of componentStyleSentinels) {
        const sentinelIndex = styles.indexOf(sentinel);
        expect(sentinelIndex).toBeGreaterThan(previousIndex);
        expect(tokens).not.toContain(sentinel);
        previousIndex = sentinelIndex;
      }
    } finally {
      execFileSync("pnpm", ["build"], { stdio: "inherit" });
    }
  });
});
