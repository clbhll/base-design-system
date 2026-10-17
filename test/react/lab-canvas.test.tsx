import { globSync, readFileSync } from "node:fs";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import postcss, { type Rule } from "postcss";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";
import { labCategories } from "../../lab/src/catalog";
import { DEFAULT_LAB_CATEGORY } from "../../lab/src/routing";

vi.mock("../../lab/src/dev-tools", () => ({ DevTools: () => null }));
vi.mock("agentation", () => ({ Agentation: () => null }));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(cleanup);

const labStyles = postcss.parse(readFileSync("lab/src/lab.css", "utf8"));

function topLevelDeclarationsFor(selector: string) {
  const declarations = new Map<string, string>();

  for (const node of labStyles.nodes) {
    if (node.type === "rule" && node.selector === selector) {
      node.walkDecls((declaration) => {
        declarations.set(declaration.prop, declaration.value);
      });
    }
  }

  return declarations;
}

function mediaRules(query: string) {
  const rules: Rule[] = [];
  labStyles.walkAtRules("media", (rule) => {
    if (rule.params.includes(query)) {
      rule.walkRules((nestedRule) => {
        rules.push(nestedRule);
      });
    }
  });
  return rules;
}

function renderPath(path: string) {
  window.history.replaceState(null, "", `#${path}`);
  return render(<App />);
}

function overlay(name: string) {
  return within(screen.getByRole("dialog", { name }));
}

const allComponents = labCategories.flatMap((category) =>
  category.components.map((component) => ({ category: category.id, ...component })),
);

const publicComponentExports = [
  "ActionMenu",
  "Button",
  "ButtonLink",
  "Dialog",
  "DialogFooter",
  "DialogHeading",
  "MoreIcon",
  "ProgressBar",
  "TextInput",
  "Toast",
  "ToastProvider",
  "TrashIcon",
  "useToast",
];

describe("component canvas registry", () => {
  it("keeps categories and component URLs unique", () => {
    expect(labCategories.map(({ id }) => id)).toEqual([
      "foundations",
      "actions",
      "inputs",
      "feedback",
      "overlays",
    ]);
    expect(labCategories[0].id).toBe(DEFAULT_LAB_CATEGORY);
    expect(new Set(allComponents.map(({ id }) => id)).size).toBe(allComponents.length);
  });

  it("gives every component a caption, docs, and at least one band", () => {
    for (const component of allComponents) {
      expect(component.caption, component.id).not.toBe("");
      expect(component.docs.title, component.id).not.toBe("");
      expect(component.docs.summary, component.id).not.toBe("");
      expect(component.bands.length, component.id).toBeGreaterThan(0);
    }
  });

  it("renders every public component export somewhere on the canvas", () => {
    const catalogSource = [...globSync("lab/src/bands/*.tsx"), "lab/src/app.tsx"]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    for (const name of publicComponentExports) {
      expect(catalogSource, name).toMatch(new RegExp(`[<\\s]${name}[\\s(/>]`));
    }
  });
});

describe("component grid", () => {
  it("shows a captioned card with a hidden live preview for each component", () => {
    for (const category of labCategories) {
      const view = renderPath(`/${category.id}`);
      const panel = within(screen.getByRole("tabpanel", { name: category.label }));
      const cards = panel.getAllByRole("listitem");
      expect(cards).toHaveLength(category.components.length);

      for (const component of category.components) {
        const card = within(panel.getByRole("heading", { level: 2, name: component.docs.title }).closest("li")!);
        expect(card.getByRole("button", { name: component.docs.title })).toHaveAttribute(
          "aria-haspopup",
          "dialog",
        );
        expect(card.getByText(component.caption)).toBeVisible();
      }
      for (const preview of document.querySelectorAll(".lab-card-preview")) {
        expect(preview).toHaveAttribute("aria-hidden", "true");
        expect(preview).toHaveAttribute("inert");
        expect(preview.childElementCount).toBeGreaterThan(0);
      }
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      view.unmount();
    }
  });

  it("opens a card's details over the grid and returns to the card on close", async () => {
    const user = userEvent.setup();
    renderPath("/actions");
    const historyLength = window.history.length;

    const open = screen.getByRole("button", { name: "Button Link" });
    await user.click(open);

    const details = overlay("Button Link");
    expect(window.location.hash).toBe("#/actions/button-link");
    expect(window.history.length).toBe(historyLength + 1);
    expect(details.getByText('import { ButtonLink, MoreIcon } from "@calebhill/base";')).toBeVisible();
    expect(details.getByRole("heading", { level: 3, name: "Variants and sizes" })).toBeVisible();
    expect(screen.getByRole("tabpanel", { name: "Actions" })).toBeVisible();

    await user.click(details.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(window.location.hash).toBe("#/actions"));
    expect(open).toHaveFocus();
  });

  it("closes a deep-linked overlay by replacing its history entry", async () => {
    renderPath("/actions/button");
    const historyLength = window.history.length;

    act(() => {
      screen.getByRole<HTMLDialogElement>("dialog", { name: "Button" }).close();
    });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(window.location.hash).toBe("#/actions");
    expect(window.history.length).toBe(historyLength);
    expect(screen.getByRole("button", { name: "Button" })).toHaveFocus();
  });

  it("shows each component's documentation in its overlay", () => {
    for (const component of allComponents) {
      const view = renderPath(`/${component.category}/${component.id}`);
      const details = overlay(component.docs.title);
      const { docs } = component;

      expect(details.getByRole("heading", { level: 2, name: docs.title })).toBeVisible();
      expect(details.getByText(docs.summary)).toBeVisible();
      if (docs.status) expect(details.getByText(/^(Beta|Stable|Unstable|Deprecated)$/)).toBeVisible();
      if (docs.importStatement) expect(details.getByText(docs.importStatement)).toBeVisible();
      if (docs.props) expect(details.getByRole("table", { name: "Public props" })).toBeVisible();
      if (docs.accessibility) {
        expect(details.getByRole("heading", { level: 3, name: "Accessibility" })).toBeVisible();
      }
      for (const band of component.bands) {
        expect(details.getByRole("heading", { level: 3, name: band.label })).toBeVisible();
      }

      view.unmount();
    }
  });

  it("applies the surface to the grid and the overlay while the chrome keeps its theme", async () => {
    const user = userEvent.setup();
    renderPath("/actions");

    const grid = screen.getByTestId("lab-canvas-surface");
    const surfaces = screen.getByRole("group", { name: "Canvas surface" });
    expect(within(surfaces).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Grey",
      "White",
      "Black",
    ]);
    expect(within(surfaces).getByRole("button", { name: "Grey" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(grid).toHaveAttribute("data-base-theme", "light");
    expect(grid).toHaveAttribute("data-lab-surface", "grey");

    await user.click(within(surfaces).getByRole("button", { name: "Black" }));
    expect(grid).toHaveAttribute("data-base-theme", "dark");
    expect(grid).toHaveAttribute("data-lab-surface", "black");
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-base-theme");

    await user.click(screen.getByRole("button", { name: "Button" }));
    const specimens = screen.getByTestId("lab-overlay-surface");
    expect(specimens).toHaveAttribute("data-base-theme", "dark");
    expect(specimens).toHaveAttribute("data-lab-surface", "black");
    expect(screen.getByRole("dialog", { name: "Button" })).not.toHaveAttribute("data-base-theme");
    expect(screen.getByRole("complementary", { name: "Inspector" })).not.toHaveAttribute(
      "data-base-theme",
    );
  });

  it("remembers the surface and tolerates unavailable storage", async () => {
    const user = userEvent.setup();
    let view = renderPath("/actions");

    await user.click(screen.getByRole("button", { name: "Black" }));
    view.unmount();

    view = renderPath("/actions");
    expect(screen.getByTestId("lab-canvas-surface")).toHaveAttribute("data-lab-surface", "black");
    view.unmount();

    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderPath("/actions");
    expect(screen.getByTestId("lab-canvas-surface")).toHaveAttribute("data-lab-surface", "grey");
    await user.click(screen.getByRole("button", { name: "White" }));
    expect(screen.getByTestId("lab-canvas-surface")).toHaveAttribute("data-lab-surface", "white");
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("renders the canonical interactive states from public components", () => {
    let view = renderPath("/actions/button");
    expect(overlay("Button").getByRole("button", { name: "Primary" })).toBeVisible();
    expect(overlay("Button").getByRole("button", { name: "Unavailable action" })).toBeDisabled();
    view.unmount();

    view = renderPath("/inputs/text-input");
    expect(overlay("Text Input").getByRole("textbox", { name: "Error input" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    view.unmount();

    renderPath("/feedback/progress-bar");
    expect(
      overlay("Progress Bar").getByRole("progressbar", { name: "Upload progress" }),
    ).toHaveAttribute("aria-valuenow", "45");
  });

  it("keeps foundation example links on their own component", async () => {
    const user = userEvent.setup();
    renderPath("/foundations/links");

    await user.click(overlay("Links").getAllByRole("link", { name: "Standard link" })[0]);
    expect(window.location.hash).toBe("#/foundations/links");
    expect(screen.getByRole("dialog", { name: "Links" })).toBeVisible();
  });

  it("shows live notifications inside the overlay and keeps them after it closes", async () => {
    const user = userEvent.setup();
    renderPath("/feedback/toast");
    const details = overlay("Toast");

    await user.click(details.getByRole("button", { name: "Show toast" }));
    const notifications = await details.findByRole("region", { name: /Notifications/ });
    expect(await within(notifications).findByText("Your changes have been saved.")).toBeVisible();

    await user.click(details.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(
      await within(await screen.findByRole("region", { name: /Notifications/ })).findByText(
        "Your changes have been saved.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps canvas consumption on public package paths", () => {
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
      "src/styles/components/dialog.css",
      "src/styles/components/action-menu.css",
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

    for (const labOnly of ["StatusTag", "lab-canvas", "lab-card", "lab-overlay", "lab-inspector"]) {
      expect(packageArtifacts).not.toContain(labOnly);
    }
  });

  it.each([
    ...labCategories.map(({ id }) => `/${id}`),
    "/actions/button",
    "/feedback/toast",
  ])("has no representative automated accessibility violations at %s", async (path) => {
    const { container } = renderPath(path);

    expect(
      (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toHaveLength(0);
  });

  it("provides a responsive grid and overlay", () => {
    expect(topLevelDeclarationsFor(".lab-card-grid").get("grid-template-columns")).toMatch(
      /auto-fill.*minmax/,
    );
    expect(topLevelDeclarationsFor(".lab-canvas").get("min-width")).toBe("0");
    expect(topLevelDeclarationsFor(".lab-props-table-wrap").get("overflow-x")).toBe("auto");
    expect(topLevelDeclarationsFor(".lab-dialog-portal").get("display")).toBe("contents");
    expect(topLevelDeclarationsFor(".lab-overlay-body").get("grid-template-columns")).toContain(
      "rem",
    );

    for (const [surface, token] of [
      ["grey", "--base-color-background-subtle"],
      ["white", "--base-color-background"],
      ["black", "--base-color-background"],
    ]) {
      expect(
        topLevelDeclarationsFor(`.lab-canvas-surface[data-lab-surface="${surface}"]`).get(
          "background",
        ),
      ).toBe(`var(${token})`);
    }

    const narrowRules = mediaRules("max-width");
    expect(narrowRules.some((rule) => rule.selector === ".lab-overlay-body")).toBe(true);
    expect(narrowRules.some((rule) => rule.selector === ".lab-overlay")).toBe(true);
    expect(mediaRules("prefers-reduced-motion").some((rule) => rule.selector.includes(".lab-tab"))).toBe(
      true,
    );
  });
});
