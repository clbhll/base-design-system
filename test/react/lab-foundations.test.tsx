import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import postcss from "postcss";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";

vi.mock("../../lab/src/dev-tools", () => ({
  DevTools: () => null,
}));
vi.mock("agentation", () => ({
  Agentation: () => null,
}));

const labStyles = postcss.parse(readFileSync("lab/src/lab.css", "utf8"));

describe("foundation lab", () => {
  it("pairs accent swatches with the on-accent foreground", async () => {
    const { container } = render(<App />);

    for (const label of screen.getAllByText("Accent")) {
      expect(label.closest(".lab-swatch")).toHaveAttribute("data-semantic-color", "accent");
    }

    const declarations = new Map<string, string>();
    labStyles.walkRules('.lab-swatch[data-semantic-color="accent"]', (rule) => {
      rule.walkDecls((declaration) => {
        declarations.set(declaration.prop, declaration.value);
      });
    });

    expect(declarations.get("color")).toBe("var(--base-color-on-accent)");
    expect(
      (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toHaveLength(0);
  });
});
