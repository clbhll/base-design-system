import { readFileSync } from "node:fs";
import postcss, { type Declaration, type Root, type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const tokens = postcss.parse(readFileSync("src/styles/tokens.css", "utf8"));
const primitiveSources = new Map([
  ["text-input", readFileSync("src/styles/components/text-input.css", "utf8")],
  ["progress-bar", readFileSync("src/styles/components/progress-bar.css", "utf8")],
]);
const primitives = new Map(
  [...primitiveSources].map(([name, source]) => [name, postcss.parse(source)]),
);

function declarationsForSelector(root: Root, selector: string) {
  const declarations = new Map<string, string>();

  root.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;

    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value);
    });
  });

  return declarations;
}

function ruleForSelector(root: Root, selector: string) {
  let match: Rule | undefined;

  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) match = rule;
  });

  expect(match, `${selector} must exist`).toBeDefined();
  return match!;
}

function topLevelRulesWithSelector(root: Root, selector: string) {
  const rules: Rule[] = [];

  root.walkRules((rule) => {
    if (rule.parent === root && rule.selectors.includes(selector)) rules.push(rule);
  });

  return rules;
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

function themeProperties(theme: "light" | "dark") {
  return declarationsForRules([
    ...topLevelRulesWithSelector(tokens, ":root"),
    ...topLevelRulesWithSelector(tokens, `[data-base-theme="${theme}"]`),
  ]);
}

function resolveColor(properties: Map<string, string>, valueOrProperty: string): string {
  const value = valueOrProperty.startsWith("--")
    ? properties.get(valueOrProperty)
    : valueOrProperty;
  expect(value, `${valueOrProperty} must resolve`).toBeDefined();

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
  const [darker = 0, lighter = 0] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((first, second) => first - second);

  return (lighter + 0.05) / (darker + 0.05);
}

function referencedVariables(declaration: Declaration) {
  return [...declaration.value.matchAll(/var\((--[^),\s]+)/g)].map((match) => match[1]);
}

describe("primitive CSS contract", () => {
  it("keeps both modules Base-scoped and free of framework or product leakage", () => {
    const forbiddenProductNames = ["photos-me", "photos.me", "calebhill.me", "upload"];

    for (const [name, source] of primitiveSources) {
      const root = primitives.get(name)!;
      const selectors: string[] = [];

      root.walkRules((rule) => {
        selectors.push(...rule.selectors);
      });
      expect(selectors.every((selector) => selector.trimStart().startsWith(".base-"))).toBe(
        true,
      );
      expect(source).not.toContain('@import "tailwindcss"');
      expect(source).not.toContain("@tailwind");
      expect(source).not.toContain("--color-");
      expect(source).not.toContain("--photos-");
      expect(source).not.toContain("--calebhill-");
      expect(root.nodes.some((node) => node.type === "atrule" && node.name === "import")).toBe(
        false,
      );
      for (const productName of forbiddenProductNames) {
        expect(source.toLowerCase()).not.toContain(productName);
      }
    }
  });

  it("references only custom properties declared by Base", () => {
    const declaredBaseProperties = new Set<string>();
    tokens.walkDecls((declaration) => {
      if (declaration.prop.startsWith("--base-")) {
        declaredBaseProperties.add(declaration.prop);
      }
    });

    for (const root of primitives.values()) {
      root.walkDecls((declaration) => {
        for (const property of referencedVariables(declaration)) {
          expect(property).toMatch(/^--base-/);
          expect(declaredBaseProperties).toContain(property);
        }
      });
    }
  });

  it("defines the approved TextInput state contract", () => {
    const root = primitives.get("text-input")!;
    const field = declarationsForSelector(root, ".base-text-input-field");
    const placeholder = declarationsForSelector(root, ".base-text-input-field::placeholder");
    const focus = declarationsForSelector(root, ".base-text-input-field:focus");
    const filled = declarationsForSelector(
      root,
      '.base-text-input-field:not(:placeholder-shown):not(:disabled):not([aria-invalid="true"])',
    );
    const focusVisible = declarationsForSelector(root, ".base-text-input-field:focus-visible");
    const error = declarationsForSelector(
      root,
      '.base-text-input-field[aria-invalid="true"]:not(:disabled)',
    );
    const errorFocus = declarationsForSelector(
      root,
      '.base-text-input-field[aria-invalid="true"]:focus-visible:not(:disabled)',
    );
    const disabled = declarationsForSelector(root, ".base-text-input-field:disabled");
    const disabledPlaceholder = declarationsForSelector(
      root,
      ".base-text-input-field:disabled::placeholder",
    );
    const errorMessage = declarationsForSelector(root, ".base-text-input-error");
    const hoverRule = ruleForSelector(
      root,
      '.base-text-input-field:hover:not(:focus):not(:disabled):not([aria-invalid="true"])',
    );

    expect(field.get("height")).toBe("3rem");
    expect(field.get("background")).toBe("var(--base-color-surface)");
    expect(field.get("color")).toBe("var(--base-color-text-primary)");
    expect(field.get("caret-color")).toBe("var(--base-color-text-primary)");
    expect(field.get("transition-duration")).toBe("var(--base-duration-interaction-fast)");
    expect(placeholder.get("color")).toBe("var(--base-color-text-secondary)");
    expect(focus.get("border-width")).toBe("2px");
    expect(focus.get("border-color")).toBe("var(--base-color-border-active)");
    expect(filled.get("border-color")).toBe("var(--base-color-border-active)");
    expect(focusVisible.get("outline")).toBe("2px solid var(--base-color-focus-ring)");
    expect(error.get("border-width")).toBe("2px");
    expect(error.get("border-color")).toBe("var(--base-color-danger)");
    expect(errorFocus.get("outline-color")).toBe("var(--base-color-danger)");
    expect(disabled.get("background")).toBe("var(--base-color-surface-disabled)");
    expect(disabled.get("color")).toBe("var(--base-color-text-disabled)");
    expect(disabledPlaceholder.get("color")).toBe("var(--base-color-text-disabled)");
    expect(errorMessage.get("color")).toBe("var(--base-color-danger)");
    expect(hoverRule.parent).toMatchObject({
      name: "media",
      params: "(hover: hover) and (pointer: fine)",
      type: "atrule",
    });
    expect(declarationsForRules([hoverRule]).get("border-color")).toBe(
      "var(--base-color-border-hover)",
    );
  });

  it.each(["light", "dark"] as const)(
    "keeps the enabled %s placeholder above 4.5 to 1 contrast",
    (theme) => {
      const properties = themeProperties(theme);
      const placeholderValue = declarationsForSelector(
        primitives.get("text-input")!,
        ".base-text-input-field::placeholder",
      ).get("color");
      expect(placeholderValue).toBeDefined();

      const foreground = resolveColor(properties, placeholderValue ?? "");
      const background = resolveColor(properties, "--base-color-surface");
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("defines transform-only progress and removes its transition for reduced motion", () => {
    const root = primitives.get("progress-bar")!;
    const track = declarationsForSelector(root, ".base-progress-bar");
    const fill = declarationsForSelector(root, ".base-progress-bar-fill");
    const [fillRule] = topLevelRulesWithSelector(root, ".base-progress-bar-fill");
    const reducedRule = (() => {
      let match: Rule | undefined;
      root.walkRules((rule) => {
        if (
          rule.selectors.includes(".base-progress-bar-fill") &&
          rule.parent?.type === "atrule" &&
          rule.parent.name === "media"
        ) {
          match = rule;
        }
      });
      return match;
    })();

    expect(track.get("height")).toBe("0.375rem");
    expect(track.get("background")).toBe("var(--base-color-surface-disabled)");
    expect(fill.get("background")).toBe("var(--base-color-text-primary)");
    expect(fill.get("transform-origin")).toBe("left");
    expect(fill.get("transition-property")).toBe("transform");
    expect(fill.get("transition-duration")).toBe(
      "var(--base-duration-interaction-standard)",
    );
    expect(fill.get("transition-timing-function")).toBe("linear");
    expect(fillRule).toBeDefined();
    expect(fillRule?.parent).toBe(root);
    expect(reducedRule).toBeDefined();
    expect(reducedRule?.parent).toMatchObject({
      name: "media",
      params: "(prefers-reduced-motion: reduce)",
      type: "atrule",
    });
    expect(declarationsForRules([reducedRule!]).get("transition")).toBe("none");
  });
});
