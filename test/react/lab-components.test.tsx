import { globSync, readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import postcss, { type Rule } from "postcss";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";
import { StatusTag } from "../../lab/src/components/status-tag";

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

function renderPath(path: string) {
  window.history.replaceState(null, "", `#${path}`);
  return render(<App />);
}

describe("alpha component lab", () => {
  it("shows every approved Button variant and state in its focused document", async () => {
    const { container } = renderPath("/components/button");

    expect(screen.getByRole("button", { name: "Primary" })).toBeVisible();

    const variants = ["primary", "secondary", "subtle", "destructive", "text", "text-accent"];
    for (const variant of variants) {
      expect(container.querySelectorAll(`[data-lab-variant="${variant}"]`)).toHaveLength(1);
      expect(container.querySelector(`[data-lab-variant="${variant}"]`)).toHaveClass(
        `base-button-${variant}`,
      );
    }

    expect(screen.getByRole("button", { name: "More actions" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete item" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Unavailable action" })).toBeDisabled();

    expect(
      (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toHaveLength(0);
  });

  it("gives each ButtonLink specimen a valid fragment destination", () => {
    renderPath("/components/button-link");

    for (const name of [
      "Primary",
      "Secondary",
      "Subtle",
      "Destructive",
      "Text",
      "Text accent",
      "More destinations",
    ]) {
      const link = screen.getByRole("link", { name });
      const fragmentId = link.getAttribute("href")?.slice(1);
      expect(fragmentId).toBe("button-link-destination");
      expect(document.getElementById(fragmentId as string)).not.toBeNull();
    }
  });

  it("shows TextInput error association and determinate progress semantics", () => {
    let view = renderPath("/components/text-input");
    const input = screen.getByRole("textbox", { name: "Error input" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    const error = document.getElementById(input.getAttribute("aria-describedby") ?? "");
    expect(error).toHaveAttribute("role", "alert");
    view.unmount();

    view = renderPath("/components/progress-bar");
    expect(screen.getByRole("progressbar", { name: "Upload progress" })).toHaveAttribute(
      "aria-valuenow",
      "45",
    );
    view.unmount();
  });

  it("keeps consumption on public package paths and StatusTag out of the package", () => {
    const labSource = globSync("lab/src/**/*.tsx")
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
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

    expect(labSource).toContain('from "@calebhill/base"');
    expect(labSource).toContain('import "@calebhill/base/styles.css"');
    for (const forbiddenImport of [
      "../../src",
      "src/components",
      "tailwind",
      "next/",
      "vercel",
      "photos-me",
      "calebhill.me",
    ]) {
      expect(labSource.toLowerCase()).not.toContain(forbiddenImport);
    }

    for (const packageArtifact of [packageSource, packageCss, packageManifest]) {
      expect(packageArtifact).not.toContain("StatusTag");
      expect(packageArtifact).not.toContain("--lab-status-warning");
      expect(packageArtifact).not.toContain("--lab-status-beta");
    }
  });

  it("uses visible lifecycle labels for every documentation status", () => {
    render(
      <div>
        <StatusTag status="stable" />
        <StatusTag status="beta" />
        <StatusTag status="unstable" />
        <StatusTag status="deprecated" />
      </div>,
    );

    for (const label of ["Stable", "Beta", "Unstable", "Deprecated"]) {
      expect(screen.getByText(label)).toBeVisible();
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
    expect(declarationsFor(".lab-app-shell").has("width")).toBe(false);
  });
});
