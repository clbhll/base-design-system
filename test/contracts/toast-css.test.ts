import { readFileSync } from "node:fs";
import postcss from "postcss";
import { expect, it } from "vitest";

it("preserves Base Button shape while providing squircle surfaces and reduced-motion entrance", () => {
  const css = postcss.parse(
    readFileSync("src/styles/components/toast.css", "utf8"),
  );
  const shapeOverrides: string[] = [];
  css.walkRules(".base-toast > .base-button", (rule) => {
    rule.walkDecls(/border-radius|corner-shape/, (decl) => {
      shapeOverrides.push(decl.prop);
    });
  });
  expect(shapeOverrides).toEqual([]);
  const reducedRules: string[] = [];
  css.walkAtRules("media", (rule) => {
    if (rule.params === "(prefers-reduced-motion: reduce)")
      rule.walkDecls("animation-name", (decl) => {
        reducedRules.push(decl.value);
      });
  });
  expect(reducedRules).toContain("base-toast-fade");
});
