import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("css build", () => {
  it("keeps the lab aggregate aligned with the public stylesheet order", () => {
    const labStyles = readFileSync("lab/src/styles.css", "utf8");

    expect(labStyles).toBe(
      '@import "../../src/styles/tokens.css";\n@import "../../src/styles/styles.css";\n',
    );
  });

  it("copies tokens and concatenates styles in order", () => {
    rmSync("dist", { force: true, recursive: true });
    mkdirSync("dist", { recursive: true });

    execFileSync("node", ["scripts/build-css.mjs"], { stdio: "inherit" });

    const sourceTokens = readFileSync("src/styles/tokens.css", "utf8");
    const sourceStyles = readFileSync("src/styles/styles.css", "utf8");
    const tokens = readFileSync("dist/tokens.css", "utf8");
    const styles = readFileSync("dist/styles.css", "utf8");

    expect(tokens).toBe(sourceTokens);
    expect(styles).toBe(`${sourceTokens}\n\n${sourceStyles}\n`);
    expect(styles.startsWith(tokens)).toBe(true);
    expect(tokens).toMatch(/^:root,\n\[data-base-theme="light"\]/);
    expect(tokens).toContain('[data-base-theme="dark"]');
    expect(tokens).toContain("--base-color-text-primary");
    expect(tokens).toContain("@media (prefers-reduced-motion: reduce)");
    expect(tokens).toContain("@media (pointer: fine)");
    expect(styles).toContain(".base-theme-probe");
  });
});
