import { readFileSync } from "node:fs";
import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const styles = readFileSync("src/styles/styles.css", "utf8");
const parsedTokens = postcss.parse(tokens);
const parsedStyles = postcss.parse(styles);

const supportedSurfaces = [
  "--base-color-background",
  "--base-color-background-subtle",
  "--base-color-surface",
  "--base-color-surface-hover",
  "--base-color-surface-active",
  "--base-color-surface-disabled",
  "--base-color-accent-subtle",
] as const;

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

function declarationsForRules(rules: Rule[]) {
  const declarations = new Map<string, string>();

  for (const rule of rules) {
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value);
    });
  }

  return declarations;
}

function topLevelRulesWithSelector(root: postcss.Root, selector: string) {
  const rules: Rule[] = [];

  root.walkRules((rule) => {
    if (rule.parent === root && rule.selectors.includes(selector)) {
      rules.push(rule);
    }
  });

  return rules;
}

function themeProperties(theme: "light" | "dark") {
  const rootRules = topLevelRulesWithSelector(parsedTokens, ":root");
  const themeRules = topLevelRulesWithSelector(parsedTokens, `[data-base-theme="${theme}"]`);

  return declarationsForRules([...rootRules, ...themeRules]);
}

function resolveColor(properties: Map<string, string>, property: string): string {
  const value = properties.get(property);
  expect(value, `${property} must be declared`).toBeDefined();

  const reference = value?.match(/^var\((--[^)]+)\)$/)?.[1];
  return reference ? resolveColor(properties, reference) : (value ?? "");
}

function relativeLuminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi);
  expect(channels, `${hex} must be a six-digit hex color`).toHaveLength(3);

  const [red = 0, green = 0, blue = 0] = (channels ?? []).map((channel) => {
    const normalized = Number.parseInt(channel, 16) / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (first, second) => second - first,
  );
  const lighter = luminances[0] ?? 0;
  const darker = luminances[1] ?? 0;

  return (lighter + 0.05) / (darker + 0.05);
}

function unscopedSelectors(css: string) {
  const selectors: string[] = [];

  postcss.parse(css).walkRules((rule) => {
    for (const selector of rule.selectors) {
      if (!selector.trimStart().startsWith(".base-")) {
        selectors.push(selector.trim());
      }
    }
  });

  return selectors;
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
    expect(unscopedSelectors(styles)).toEqual([]);
    expect(unscopedSelectors("a {} .base-safe, body {} button:hover {} * {}"))
      .toEqual(["a", "body", "button:hover", "*"]);
    expect(styles).not.toContain('@import "tailwindcss"');
    expect(styles).not.toContain("@tailwind");
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
    expect(styles).toContain(':not(:disabled, [aria-disabled="true"])');
  });

  it("keeps resting links legible and identifiable on every supported surface", () => {
    const restingLinks = [".base-link", ".base-link-muted"] as const;

    for (const selector of restingLinks) {
      const linkDeclarations = declarationsForRules(
        topLevelRulesWithSelector(parsedStyles, selector),
      );
      expect(linkDeclarations.get("text-decoration-color")).toBe("currentColor");

      for (const theme of ["light", "dark"] as const) {
        const properties = themeProperties(theme);
        const foregroundProperty = linkDeclarations
          .get("color")
          ?.match(/^var\((--[^)]+)\)$/)?.[1];
        expect(foregroundProperty, `${selector} must use a semantic foreground`).toBeDefined();
        const foreground = resolveColor(properties, foregroundProperty ?? "");

        for (const surface of supportedSurfaces) {
          const background = resolveColor(properties, surface);
          expect(
            contrastRatio(foreground, background),
            `${theme} ${selector} on ${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("leaves disabled presentation untouched by Base active feedback", () => {
    const activeFeedbackSelectors: string[] = [];

    parsedStyles.walkRules((rule) => {
      if (!rule.selector.includes(".base-pressable") || !rule.selector.includes(":active")) {
        return;
      }

      const hasPressFeedback = rule.nodes.some(
        (node) => node.type === "decl" && ["opacity", "scale"].includes(node.prop),
      );
      if (!hasPressFeedback) {
        return;
      }

      activeFeedbackSelectors.push(...rule.selectors);
      for (const selector of rule.selectors) {
        expect(selector).toContain(':not(:disabled, [aria-disabled="true"])');
      }
    });

    expect(activeFeedbackSelectors).toHaveLength(2);
  });
});
