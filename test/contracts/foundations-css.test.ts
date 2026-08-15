import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const styles = readFileSync("src/styles/styles.css", "utf8");

const semanticTokens = [
  "--base-font-family-sans",
  "--base-font-family-mono",
  "--base-duration-interaction-fast",
  "--base-duration-interaction-standard",
  "--base-interaction-press-scale",
  "--base-interaction-press-opacity-reduced",
  "--base-color-background",
  "--base-color-background-subtle",
  "--base-color-text-primary",
  "--base-color-text-secondary",
  "--base-color-text-tertiary",
  "--base-color-text-disabled",
  "--base-color-accent",
  "--base-color-accent-hover",
  "--base-color-accent-active",
  "--base-color-accent-subtle",
  "--base-color-on-accent",
  "--base-color-surface",
  "--base-color-surface-hover",
  "--base-color-surface-active",
  "--base-color-surface-disabled",
  "--base-color-border",
  "--base-color-border-hover",
  "--base-color-border-focus",
  "--base-color-border-active",
  "--base-color-focus-ring",
  "--base-color-code-surface",
  "--base-color-code-border",
] as const;

const foundationClasses = [
  ".base-type-display",
  ".base-type-heading-lg",
  ".base-type-heading-md",
  ".base-type-heading-sm",
  ".base-type-action",
  ".base-type-input",
  ".base-type-body-lg",
  ".base-type-body",
  ".base-type-body-sm",
  ".base-type-caption",
  ".base-type-mono",
  ".base-link",
  ".base-link-muted",
  ".base-tabular-nums",
  ".base-focus-ring",
  ".base-pressable",
] as const;

function blockFor(pattern: RegExp) {
  const match = tokens.match(pattern);
  const block = match?.[1];
  expect(block).toBeDefined();
  return block ?? "";
}

describe("foundation CSS contract", () => {
  it("publishes the complete semantic token vocabulary", () => {
    for (const token of semanticTokens) {
      expect(tokens).toContain(`${token}:`);
    }
  });

  it("maps the approved light and dark accent sources", () => {
    const light = blockFor(/:root,\s*\[data-base-theme="light"\]\s*\{([^}]*)\}/s);
    const dark = blockFor(/\[data-base-theme="dark"\]\s*\{([^}]*)\}/s);

    expect(light).toContain("--base-color-accent: var(--base-ref-color-blue-500)");
    expect(dark).toContain("--base-color-accent: var(--base-ref-color-blue-400)");
    expect(light).toContain("--base-color-code-surface: var(--base-color-background-subtle)");
    expect(dark).toContain("--base-color-code-surface: var(--base-color-background-subtle)");
  });

  it("removes spatial press feedback for reduced motion", () => {
    const reducedMotion = blockFor(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{([^}]*)\}/s,
    );

    expect(reducedMotion).toContain("--base-duration-interaction-fast: 0ms");
    expect(reducedMotion).toContain("--base-duration-interaction-standard: 0ms");
    expect(reducedMotion).toContain("--base-interaction-press-scale: 1");
  });

  it("keeps the class sheet free of global and Tailwind rules", () => {
    const withoutComments = styles.replaceAll(/\/\*[\s\S]*?\*\//g, "");

    expect(withoutComments).not.toMatch(/(^|})\s*(html|body|\*)\b/);
    expect(withoutComments).not.toContain('@import "tailwindcss"');
    expect(withoutComments).not.toContain("@tailwind");
  });

  it("exports every approved opt-in foundation class", () => {
    for (const className of foundationClasses) {
      expect(styles).toContain(className);
    }
  });

  it("sets the mono typography role to regular weight", () => {
    expect(styles).toMatch(
      /\.base-type-mono\s*\{[^}]*font-weight:\s*var\(--base-ref-font-weight-regular\);[^}]*\}/s,
    );
  });

  it("guards hover and reduced-motion press behavior", () => {
    expect(styles).toContain("@media (hover: hover) and (pointer: fine)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("scale: var(--base-interaction-press-scale)");
    expect(styles).toContain("opacity: var(--base-interaction-press-opacity-reduced)");
    expect(styles).toContain(':is(:disabled, [aria-disabled="true"])');
  });
});
