import { readFileSync } from "node:fs";
import postcss, { type AtRule, type Root, type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/styles/components/action-menu.css", "utf8");
const stylesheet = postcss.parse(source);
const tokens = postcss.parse(readFileSync("src/styles/tokens.css", "utf8"));

function declarations(root: Root | AtRule, selector: string) {
  const values = new Map<string, string>();
  root.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls((declaration) => {
      values.set(declaration.prop, declaration.value);
    });
  });
  return values;
}

function media(params: string) {
  let match: AtRule | undefined;
  stylesheet.walkAtRules("media", (rule) => {
    if (rule.params === params) match = rule;
  });
  expect(match, `${params} media query must exist`).toBeDefined();
  return match!;
}

describe("ActionMenu CSS contract", () => {
  it("stays Base-scoped and references only Base-owned custom properties", () => {
    const declaredProperties = new Set<string>([
      "--radix-dropdown-menu-content-transform-origin",
    ]);
    tokens.walkDecls(/^--base-/, (declaration) => {
      declaredProperties.add(declaration.prop);
    });

    stylesheet.walkRules((rule: Rule) => {
      if (rule.parent?.type === "atrule" && rule.parent.name === "keyframes") return;
      for (const selector of rule.selectors) expect(selector).toMatch(/^\.base-action-menu/);
    });

    stylesheet.walkDecls((declaration) => {
      for (const [, property] of declaration.value.matchAll(/var\((--[^),\s]+)/g)) {
        expect(property).toMatch(/^(?:--base-|--radix-dropdown-menu-content-transform-origin$)/);
        expect(declaredProperties).toContain(property);
      }
    });

    expect(source).not.toMatch(/@(?:import|tailwind|apply|config|plugin)\b/i);
    expect(source).not.toMatch(/photos(?:-me|\.me)?|calebhill\.me|canvas|upload/i);
  });

  it("matches the hand-rolled trigger, surface, and item geometry", () => {
    expect(Object.fromEntries(declarations(stylesheet, ".base-action-menu-trigger"))).toMatchObject({
      "border-radius": "0.75rem",
      height: "2.25rem",
      width: "2.25rem",
    });
    expect(Object.fromEntries(declarations(stylesheet, ".base-action-menu-content"))).toMatchObject({
      "border-radius": "1rem",
      "border-width": "1px",
      "min-width": "9rem",
      overflow: "hidden",
      padding: "0.25rem",
    });
    expect(Object.fromEntries(declarations(stylesheet, ".base-action-menu-item"))).toMatchObject({
      "border-radius": "0.75rem",
      "font-size": "var(--base-ref-font-size-350)",
      "font-weight": "var(--base-ref-font-weight-medium)",
      "letter-spacing": "var(--base-ref-letter-spacing-compact)",
      "line-height": "var(--base-ref-line-height-400)",
      "min-height": "2.5rem",
      "padding-inline": "0.75rem",
    });
  });

  it("uses semantic colors for normal, highlighted, destructive, and disabled items", () => {
    expect(Object.fromEntries(declarations(stylesheet, ".base-action-menu-content"))).toMatchObject({
      "background-color": "var(--base-color-surface)",
      "border-color": "var(--base-color-border)",
      color: "var(--base-color-text-primary)",
    });
    expect(declarations(stylesheet, '.base-action-menu-item[data-highlighted]').get("background-color"))
      .toBe("var(--base-color-surface-hover)");
    expect(declarations(stylesheet, '.base-action-menu-item[data-tone="destructive"]').get("color"))
      .toBe("var(--base-color-danger)");
    expect(declarations(stylesheet, ".base-action-menu-item[data-disabled]").get("color"))
      .toBe("var(--base-color-text-disabled)");
  });

  it("preserves fine-pointer hover and reduced-motion behavior", () => {
    const hover = media("(hover: hover) and (pointer: fine)");
    const reduced = media("(prefers-reduced-motion: reduce)");

    expect(
      declarations(hover, '.base-action-menu-item[data-tone="destructive"]:not([data-disabled]):hover')
        .get("background-color"),
    ).toBe("var(--base-color-danger-subtle)");
    expect(declarations(reduced, ".base-action-menu-content").get("animation-duration"))
      .toBe("120ms");
    expect(declarations(reduced, ".base-action-menu-item").get("transform"))
      .toBe("none");
  });
});
