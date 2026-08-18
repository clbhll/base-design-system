import { readFileSync } from "node:fs";
import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const buttonCss = readFileSync("src/styles/components/button.css", "utf8");
const tokenCss = readFileSync("src/styles/tokens.css", "utf8");
const stylesheet = postcss.parse(buttonCss);
const declaredBaseTokens = new Set<string>();

postcss.parse(tokenCss).walkDecls(/^--base-/, (declaration) => {
  declaredBaseTokens.add(declaration.prop);
});

const finePointerQuery = "(hover: hover) and (pointer: fine)";
const productNames = /(?:photos(?:-me|\.me)?|calebhill(?:\.me)?)/i;
const cssWideKeywords = new Set(["inherit", "initial", "revert", "revert-layer", "unset"]);
const rawColorFunction =
  /(?:^|[\s,(])(?:color|color-mix|device-cmyk|hsl|hsla|hwb|lab|lch|light-dark|oklab|oklch|rgb|rgba)\(/i;
const rawHexColor = /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\da-f])/i;
const colorProperties = new Set([
  "background",
  "background-color",
  "border-color",
  "color",
  "fill",
  "outline-color",
  "stroke",
  "text-decoration-color",
]);
const allowedTransparentDeclarations = new Set([
  ".base-button|border|1px solid transparent",
  ".base-button-text|background-color|transparent",
  ".base-button-text-accent|background-color|transparent",
]);

function isNamedColor(identifier: string) {
  if (cssWideKeywords.has(identifier.toLowerCase())) return false;

  const probe = document.createElement("span").style;
  probe.color = "";
  probe.color = identifier;

  return probe.color !== "";
}

function rawColorIn(value: string) {
  if (rawHexColor.test(value) || rawColorFunction.test(value)) return true;

  return [...value.matchAll(/[a-z][a-z-]*/gi)].some(([identifier]) =>
    isNamedColor(identifier),
  );
}

function rulesFor(selector: string) {
  const rules: Rule[] = [];

  stylesheet.walkRules((rule) => {
    if (rule.selectors.includes(selector)) rules.push(rule);
  });

  return rules;
}

function declarations(selector: string) {
  const values = new Map<string, string>();

  for (const rule of rulesFor(selector)) {
    rule.walkDecls((declaration) => {
      values.set(declaration.prop, declaration.value);
    });
  }

  return values;
}

function expectDeclarations(selector: string, expected: Record<string, string>) {
  expect(Object.fromEntries(declarations(selector)), selector).toMatchObject(expected);
}

describe("Button CSS contract", () => {
  it("keeps every rule Base-scoped and free of imports, Tailwind, and product names", () => {
    const selectors: string[] = [];

    stylesheet.walkRules((rule) => {
      selectors.push(...rule.selectors);
    });

    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector).toMatch(
        /^\.base-button(?:-[a-z]+)*(?::not\(:disabled\))?(?::(?:active|disabled|hover))?$/,
      );
    }

    stylesheet.walkAtRules((atRule) => {
      expect(atRule.name).toBe("media");
      expect(atRule.params).toBe(finePointerQuery);
    });
    expect(buttonCss).not.toMatch(/@(?:import|tailwind|apply|config|plugin)\b/i);
    expect(buttonCss).not.toMatch(productNames);
  });

  it("references only declared Base tokens and uses semantic tokens for color", () => {
    stylesheet.walkDecls((declaration) => {
      expect(declaration.prop).not.toMatch(/^--/);

      const references = [...declaration.value.matchAll(/var\((--[^),\s]+)/g)].map(
        ([, reference]) => reference,
      );

      for (const reference of references) {
        expect(reference).toMatch(/^--base-/);
        expect(declaredBaseTokens.has(reference), `${reference} must be declared`).toBe(true);
        expect(reference, `${reference} must use a semantic color token`).not.toMatch(
          /^--base-ref-color-/,
        );
      }

      if (rawColorIn(declaration.value)) {
        const parent = declaration.parent;
        expect(parent?.type).toBe("rule");
        const selector = parent?.type === "rule" ? parent.selector : "";
        const transparentKey = `${selector}|${declaration.prop}|${declaration.value}`;
        expect(
          allowedTransparentDeclarations.has(transparentKey),
          `${selector} must not use a raw color in ${declaration.toString()}`,
        ).toBe(true);
      }

      if (colorProperties.has(declaration.prop) && declaration.value !== "transparent") {
        expect(declaration.value).toMatch(/^var\(--base-color-[a-z-]+\)$/);
        for (const reference of references) {
          expect(reference).toMatch(/^--base-color-/);
        }
      }
    });
  });

  it("locks the common anatomy and both intrinsic sizes", () => {
    expectDeclarations(".base-button", {
      "align-items": "center",
      border: "1px solid transparent",
      "border-radius": "9999px",
      "box-sizing": "border-box",
      cursor: "pointer",
      display: "inline-flex",
      gap: "var(--base-ref-space-1)",
      "justify-content": "center",
      margin: "0",
      "text-decoration": "none",
      "user-select": "none",
      "white-space": "nowrap",
    });
    expectDeclarations(".base-button-default", {
      height: "2.5rem",
      "padding-inline": "var(--base-ref-space-5)",
    });
    expectDeclarations(".base-button-icon", {
      height: "2.25rem",
      padding: "0",
      width: "2.25rem",
    });
  });

  it("locks the six resting variant presentations", () => {
    expectDeclarations(".base-button-primary", {
      "background-color": "var(--base-color-text-primary)",
      color: "var(--base-color-background)",
    });
    expectDeclarations(".base-button-secondary", {
      "background-color": "var(--base-color-surface)",
      "border-color": "var(--base-color-border)",
      color: "var(--base-color-text-primary)",
    });
    expectDeclarations(".base-button-subtle", {
      "background-color": "var(--base-color-surface-hover)",
      color: "var(--base-color-text-primary)",
    });
    expectDeclarations(".base-button-destructive", {
      "background-color": "var(--base-color-danger-subtle)",
      color: "var(--base-color-danger)",
    });
    expectDeclarations(".base-button-text", {
      "background-color": "transparent",
      color: "var(--base-color-text-secondary)",
    });
    expectDeclarations(".base-button-text-accent", {
      "background-color": "transparent",
      color: "var(--base-color-accent)",
    });
  });

  it("locks fine-pointer hover feedback and excludes disabled buttons", () => {
    const hoverExpectations = {
      ".base-button-primary:not(:disabled):hover": { opacity: "0.85" },
      ".base-button-destructive:not(:disabled):hover": { opacity: "0.85" },
      ".base-button-secondary:not(:disabled):hover": {
        "background-color": "var(--base-color-surface-hover)",
        "border-color": "var(--base-color-border-hover)",
      },
      ".base-button-subtle:not(:disabled):hover": {
        "background-color": "var(--base-color-surface-active)",
      },
      ".base-button-text:not(:disabled):hover": {
        color: "var(--base-color-text-primary)",
      },
      ".base-button-text-accent:not(:disabled):hover": {
        color: "var(--base-color-accent-hover)",
      },
    } as const;

    for (const [selector, expected] of Object.entries(hoverExpectations)) {
      const rules = rulesFor(selector);
      expect(rules, selector).toHaveLength(1);
      expect(rules[0]?.parent).toMatchObject({
        name: "media",
        params: finePointerQuery,
        type: "atrule",
      });
      expectDeclarations(selector, expected);
    }

    const hoverSelectors: string[] = [];
    stylesheet.walkRules((rule) => {
      hoverSelectors.push(...rule.selectors.filter((selector) => selector.includes(":hover")));
    });
    expect(hoverSelectors.sort()).toEqual(Object.keys(hoverExpectations).sort());
  });

  it("locks active and native disabled presentation", () => {
    expectDeclarations(".base-button-secondary:not(:disabled):active", {
      "background-color": "var(--base-color-surface-active)",
      "border-color": "var(--base-color-border-active)",
    });
    expectDeclarations(".base-button-subtle:not(:disabled):active", {
      "background-color": "var(--base-color-surface-active)",
    });
    expectDeclarations(".base-button-text:not(:disabled):active", {
      color: "var(--base-color-text-primary)",
    });
    expectDeclarations(".base-button-text-accent:not(:disabled):active", {
      color: "var(--base-color-accent-active)",
    });
    expectDeclarations(".base-button:disabled", {
      "background-color": "var(--base-color-surface-disabled)",
      color: "var(--base-color-text-disabled)",
      cursor: "default",
      opacity: "1",
    });
    expectDeclarations(".base-button-secondary:disabled", {
      "border-color": "var(--base-color-border)",
    });

    const activeSelectors: string[] = [];
    const disabledSelectors: string[] = [];
    stylesheet.walkRules((rule) => {
      activeSelectors.push(...rule.selectors.filter((selector) => selector.includes(":active")));
      disabledSelectors.push(
        ...rule.selectors.filter(
          (selector) => selector.endsWith(":disabled") && !selector.includes(":not("),
        ),
      );
    });
    expect(activeSelectors.sort()).toEqual([
      ".base-button-secondary:not(:disabled):active",
      ".base-button-subtle:not(:disabled):active",
      ".base-button-text-accent:not(:disabled):active",
      ".base-button-text:not(:disabled):active",
    ]);
    expect(disabledSelectors.sort()).toEqual([
      ".base-button-secondary:disabled",
      ".base-button:disabled",
    ]);
  });

  it("leaves focus, press, typography, and reduced motion to composed foundations", () => {
    const componentDeclarations = new Set<string>();
    stylesheet.walkDecls((declaration) => {
      componentDeclarations.add(declaration.prop);
    });

    expect(componentDeclarations).not.toContain("outline");
    expect(componentDeclarations).not.toContain("scale");
    expect(componentDeclarations).not.toContain("transition");
    expect(componentDeclarations).not.toContain("transition-duration");
    expect(componentDeclarations).not.toContain("transition-property");
    expect(componentDeclarations).not.toContain("transition-timing-function");
    expect(buttonCss).not.toContain("prefers-reduced-motion");
  });
});
