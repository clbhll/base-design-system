import { readFileSync } from "node:fs";
import postcss, { type AtRule, type Root, type Rule } from "postcss";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/styles/components/dialog.css", "utf8");
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

function topLevelDeclarations(selector: string) {
  const values = new Map<string, string>();
  for (const node of stylesheet.nodes) {
    if (node.type !== "rule" || !node.selectors.includes(selector)) continue;
    node.walkDecls((declaration) => {
      values.set(declaration.prop, declaration.value);
    });
  }
  return values;
}

function keyframes(name: string) {
  let match: AtRule | undefined;
  stylesheet.walkAtRules("keyframes", (rule) => {
    if (rule.params === name) match = rule;
  });
  expect(match, `${name} keyframes must exist`).toBeDefined();
  return match!;
}

function media(params: string) {
  let match: AtRule | undefined;
  stylesheet.walkAtRules("media", (rule) => {
    if (rule.params === params) match = rule;
  });
  expect(match, `${params} media query must exist`).toBeDefined();
  return match!;
}

describe("Dialog CSS contract", () => {
  it("stays Base-scoped and references only Base-owned custom properties", () => {
    const declaredProperties = new Set<string>(["--base-dialog-ease"]);
    tokens.walkDecls(/^--base-/, (declaration) => {
      declaredProperties.add(declaration.prop);
    });

    stylesheet.walkRules((rule: Rule) => {
      if (rule.parent?.type === "atrule" && rule.parent.name === "keyframes") return;
      for (const selector of rule.selectors) expect(selector).toMatch(/^\.base-dialog/);
    });

    stylesheet.walkDecls((declaration) => {
      for (const [, property] of declaration.value.matchAll(/var\((--[^),\s]+)/g)) {
        expect(property).toMatch(/^--base-/);
        expect(declaredProperties).toContain(property);
      }
    });

    expect(source).not.toMatch(/@(?:import|tailwind|apply|config|plugin)\b/i);
    expect(source).not.toMatch(/photos(?:-me|\.me)?|calebhill\.me|upload/i);
  });

  it("defines the centered modal surface, overlay, and responsive sizes", () => {
    expect(Object.fromEntries(declarations(stylesheet, ".base-dialog-overlay"))).toMatchObject({
      "backdrop-filter": "blur(2px)",
      inset: "0",
      position: "fixed",
    });
    expect(Object.fromEntries(declarations(stylesheet, ".base-dialog"))).toMatchObject({
      "background-color": "var(--base-color-surface)",
      "border-color": "var(--base-color-border)",
      "border-radius": "clamp(1.5rem, 5vw, 2rem)",
      "max-height": "calc(100dvh - 2rem)",
      "overflow-y": "auto",
      padding: "var(--base-ref-space-5)",
      translate: "-50% -50%",
    });
    expect(declarations(stylesheet, ".base-dialog-compact").get("max-width")).toBe(
      "28rem",
    );
    expect(declarations(stylesheet, ".base-dialog-wide").get("max-width")).toBe(
      "42rem",
    );
  });

  it("locks heading and footer hierarchy to the approved anatomy", () => {
    expect(Object.fromEntries(declarations(stylesheet, ".base-dialog-title"))).toMatchObject({
      "font-size": "var(--base-ref-font-size-450)",
      "font-weight": "var(--base-ref-font-weight-semibold)",
      margin: "0",
    });
    expect(Object.fromEntries(declarations(stylesheet, ".base-dialog-subtitle"))).toMatchObject({
      color: "var(--base-color-text-tertiary)",
      "font-size": "var(--base-ref-font-size-350)",
      "font-weight": "var(--base-ref-font-weight-regular)",
    });
    expect(Object.fromEntries(declarations(stylesheet, ".base-dialog-footer"))).toMatchObject({
      display: "flex",
      gap: "var(--base-ref-space-2)",
      "justify-content": "flex-end",
      "margin-top": "var(--base-ref-space-6)",
    });
  });

  it("uses weighted enter and opacity-only exit while disabling closed interaction", () => {
    expect(topLevelDeclarations('.base-dialog[data-state="open"]').get("animation-name"))
      .toBe("base-dialog-surface-enter");
    expect(topLevelDeclarations('.base-dialog[data-state="closed"]').get("pointer-events"))
      .toBe("none");
    expect(topLevelDeclarations('.base-dialog-overlay[data-state="closed"]').get("pointer-events"))
      .toBe("none");

    expect(declarations(keyframes("base-dialog-surface-enter"), "from").get("transform"))
      .toBe("translateY(4px) scale(0.95)");
    expect(declarations(keyframes("base-dialog-surface-exit"), "to").get("opacity"))
      .toBe("0");
    expect(declarations(keyframes("base-dialog-surface-exit"), "to").has("transform"))
      .toBe(false);
  });

  it("keeps reduced motion visible without spatial movement", () => {
    const reduced = media("(prefers-reduced-motion: reduce)");
    expect(declarations(reduced, '.base-dialog[data-state="open"]').get("animation-name"))
      .toBe("base-dialog-surface-fade-in");
    expect(declarations(reduced, '.base-dialog[data-state="closed"]').get("animation-name"))
      .toBe("base-dialog-surface-fade-out");
    expect(declarations(keyframes("base-dialog-surface-fade-in"), "from").has("transform"))
      .toBe(false);
    expect(declarations(keyframes("base-dialog-surface-fade-out"), "to").has("transform"))
      .toBe(false);
  });
});
