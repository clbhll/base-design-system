import { globSync, readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";
import { labDocuments } from "../../lab/src/component-registry";

vi.mock("../../lab/src/dev-tools", () => ({ DevTools: () => null }));
vi.mock("agentation", () => ({ Agentation: () => null }));

afterEach(cleanup);

function renderPath(path: string) {
  window.history.replaceState(null, "", `#${path}`);
  return render(<App />);
}

const componentDocuments = [
  ["/components/button", "Button", 'import { Button } from "@calebhill/base";'],
  ["/components/button-link", "Button Link", 'import { ButtonLink } from "@calebhill/base";'],
  ["/components/text-input", "Text Input", 'import { TextInput } from "@calebhill/base";'],
  ["/components/progress-bar", "Progress Bar", 'import { ProgressBar } from "@calebhill/base";'],
  ["/components/icons", "Icons", 'import { MoreIcon, TrashIcon } from "@calebhill/base";'],
] as const;

describe("public component documents", () => {
  it("keeps navigation and rendering on one unique registry", () => {
    expect(labDocuments.map(({ path }) => path)).toEqual([
      "/foundations",
      "/components/button",
      "/components/button-link",
      "/components/text-input",
      "/components/progress-bar",
      "/components/icons",
    ]);
    expect(new Set(labDocuments.map(({ path }) => path)).size).toBe(labDocuments.length);
  });

  it("gives each component a focused public contract document", () => {
    for (const [path, label, importStatement] of componentDocuments) {
      const view = renderPath(path);

      expect(screen.getByRole("heading", { level: 1, name: label })).toBeVisible();
      expect(screen.getByText(importStatement)).toBeVisible();
      expect(screen.getByText("Beta")).toBeVisible();
      expect(screen.getByRole("group", { name: "Preview theme" })).toBeVisible();
      expect(screen.getByRole("table", { name: "Public props" })).toBeVisible();
      expect(screen.getByRole("heading", { level: 2, name: "Accessibility" })).toBeVisible();

      view.unmount();
    }
  });

  it("renders the canonical interactive states from public components", () => {
    let view = renderPath("/components/button");
    expect(screen.getByRole("button", { name: "Primary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Unavailable action" })).toBeDisabled();
    view.unmount();

    view = renderPath("/components/text-input");
    expect(screen.getByRole("textbox", { name: "Error input" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    view.unmount();

    renderPath("/components/progress-bar");
    expect(screen.getByRole("progressbar", { name: "Upload progress" })).toHaveAttribute(
      "aria-valuenow",
      "45",
    );
  });

  it("keeps preview theme state local to the selected document", async () => {
    const user = userEvent.setup();
    renderPath("/components/button");

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(screen.getByTestId("preview-surface")).toHaveAttribute("data-base-theme", "dark");

    await user.click(screen.getByRole("link", { name: "Text Input" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Text Input" })).toBeVisible();
    expect(screen.getByTestId("preview-surface")).toHaveAttribute("data-base-theme", "light");

    await user.click(screen.getByRole("link", { name: "Button" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Button" })).toBeVisible();
    expect(screen.getByTestId("preview-surface")).toHaveAttribute("data-base-theme", "light");
  });

  it("keeps documentation consumption on public package paths", () => {
    const labSource = globSync("lab/src/**/*.tsx")
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const packageArtifacts = [
      "src/index.ts",
      "src/styles/tokens.css",
      "src/styles/styles.css",
      "src/styles/components/button.css",
      "src/styles/components/text-input.css",
      "src/styles/components/progress-bar.css",
      "package.json",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

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

    expect(packageArtifacts).not.toContain("StatusTag");
    expect(packageArtifacts).not.toContain("--lab-status-warning");
    expect(packageArtifacts).not.toContain("--lab-status-beta");
  });

  it.each(["/foundations", "/components/button", "/components/text-input"])(
    "has no representative automated accessibility violations at %s",
    async (path) => {
      const { container } = renderPath(path);

      expect(
        (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
      ).toHaveLength(0);
    },
  );
});
