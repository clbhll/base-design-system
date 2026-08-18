import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import postcss, { type Rule } from "postcss";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";

vi.mock("../../lab/src/dev-tools", () => ({
  DevTools: () => null,
}));
vi.mock("agentation", () => ({
  Agentation: () => null,
}));

afterEach(cleanup);

const labStyles = postcss.parse(readFileSync("lab/src/lab.css", "utf8"));

function declarationsFor(selector: string) {
  const declarations = new Map<string, string>();

  labStyles.walkRules(selector, (rule) => {
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value);
    });
  });

  return declarations;
}

function relativeLuminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [];
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, surface: string) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(surface)].sort(
    (first, second) => second - first,
  );

  return (lighter + 0.05) / (darker + 0.05);
}

function themeStatusValues(selector: string) {
  const values = declarationsFor(selector);
  return {
    beta: [values.get("--lab-status-beta-text"), values.get("--lab-status-beta-surface")],
    unstable: [
      values.get("--lab-status-warning-text"),
      values.get("--lab-status-warning-surface"),
    ],
  };
}

describe("alpha component lab", () => {
  it("shows each approved public component specimen in both themes", async () => {
    const { container } = render(<App />);

    expect(screen.getAllByRole("button", { name: "Primary" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Button link" })).toHaveLength(2);
    expect(screen.getAllByRole("textbox", { name: "Default input" })).toHaveLength(2);
    expect(screen.getAllByRole("alert", { name: undefined })).toHaveLength(2);
    expect(screen.getAllByRole("progressbar", { name: "Upload progress" })).toHaveLength(2);

    const variants = ["primary", "secondary", "subtle", "destructive", "text", "text-accent"];
    for (const variant of variants) {
      expect(container.querySelectorAll(`[data-lab-variant="${variant}"]`)).toHaveLength(2);
      expect(container.querySelector(`[data-lab-variant="${variant}"]`)).toHaveClass(
        `base-button-${variant}`,
      );
    }

    expect(screen.getAllByRole("button", { name: "More actions" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Delete item" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Unavailable action" })).toHaveLength(2);
    for (const button of screen.getAllByRole("button", { name: "Unavailable action" })) {
      expect(button).toBeDisabled();
    }

    for (const input of screen.getAllByRole("textbox", { name: "Error input" })) {
      expect(input).toHaveAttribute("aria-invalid", "true");
      const error = document.getElementById(input.getAttribute("aria-describedby") ?? "");
      expect(error).toHaveAttribute("role", "alert");
    }
    for (const progress of screen.getAllByRole("progressbar", { name: "Upload progress" })) {
      expect(progress).toHaveAttribute("aria-valuenow", "45");
    }

    expect(
      (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toHaveLength(0);
  });

  it("keeps consumption on public package paths and StatusTag out of the package", () => {
    const appSource = readFileSync("lab/src/app.tsx", "utf8");
    const packageSource = readFileSync("src/index.ts", "utf8");
    const packageCss = [
      "src/styles/tokens.css",
      "src/styles/styles.css",
      "src/styles/components/button.css",
      "src/styles/components/text-input.css",
      "src/styles/components/progress-bar.css",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const packageManifest = readFileSync("package.json", "utf8");

    expect(appSource).toContain('from "@calebhill/base"');
    expect(appSource).toContain('import "@calebhill/base/styles.css"');
    for (const forbiddenImport of [
      "../../src",
      "src/components",
      "tailwind",
      "next/",
      "vercel",
      "photos-me",
      "calebhill.me",
    ]) {
      expect(appSource.toLowerCase()).not.toContain(forbiddenImport);
    }

    for (const packageArtifact of [packageSource, packageCss, packageManifest]) {
      expect(packageArtifact).not.toContain("StatusTag");
      expect(packageArtifact).not.toContain("--lab-status-warning");
      expect(packageArtifact).not.toContain("--lab-status-beta");
    }
  });

  it("uses visible lifecycle labels in both theme panels", () => {
    render(<App />);

    for (const label of ["Stable", "Beta", "Unstable", "Deprecated"]) {
      expect(screen.getAllByText(label)).toHaveLength(2);
    }
  });

  it("keeps lifecycle status styling local, themed, and readable", () => {
    const statusRule = declarationsFor(".lab-status-tag");
    expect(statusRule.size).toBeGreaterThan(0);

    for (const status of ["stable", "beta", "unstable", "deprecated"]) {
      expect(declarationsFor(`.lab-status-tag[data-status="${status}"]`).size).toBeGreaterThan(0);
    }

    for (const status of ["beta", "unstable"]) {
      const declarations = declarationsFor(`.lab-status-tag[data-status="${status}"]`);
      for (const value of declarations.values()) {
        expect(value).toMatch(/var\(--lab-status-/);
        expect(value).not.toMatch(/--base-/);
      }
    }
    expect(declarationsFor('.lab-status-tag[data-status="stable"]').get("color")).toContain(
      "--base-color-accent",
    );
    expect(declarationsFor('.lab-status-tag[data-status="deprecated"]').get("color")).toContain(
      "--base-color-danger",
    );

    for (const selector of [
      '.lab-panel[data-base-theme="light"]',
      '.lab-panel[data-base-theme="dark"]',
    ]) {
      const statuses = themeStatusValues(selector);
      for (const [foreground, surface] of Object.values(statuses)) {
        expect(foreground).toMatch(/^#[0-9a-f]{6}$/i);
        expect(surface).toMatch(/^#[0-9a-f]{6}$/i);
        expect(contrastRatio(foreground as string, surface as string)).toBeGreaterThanOrEqual(4.5);
      }
    }

    const labVariables: string[] = [];
    labStyles.walkDecls((declaration) => {
      if (declaration.prop.startsWith("--")) labVariables.push(declaration.prop);
    });
    expect(labVariables.every((variable) => !variable.startsWith("--base-"))).toBe(true);

    const narrowRules: Rule[] = [];
    labStyles.walkAtRules("media", (rule) => {
      if (rule.params.includes("max-width")) {
        rule.walkRules((nestedRule) => {
          narrowRules.push(nestedRule);
        });
      }
    });
    expect(narrowRules.length).toBeGreaterThan(0);
    expect(declarationsFor(".lab-shell").get("width")).not.toMatch(/^\d+(?:\.\d+)?(?:px|rem)$/);
  });
});
