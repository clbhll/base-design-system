import { globSync, readFileSync } from "node:fs";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import postcss, { type Rule } from "postcss";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";
import { labCategories, labComponentDocs } from "../../lab/src/catalog";

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

function inspector() {
  return within(screen.getByRole("complementary", { name: "Inspector" }));
}

const allBands = labCategories.flatMap((category) =>
  category.bands.map((band) => ({ category: category.id, ...band })),
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
  it("keeps categories and band URLs unique", () => {
    expect(labCategories.map(({ id }) => id)).toEqual([
      "foundations",
      "actions",
      "inputs",
      "feedback",
      "overlays",
    ]);
    expect(new Set(allBands.map(({ id }) => id)).size).toBe(allBands.length);
    for (const category of labCategories) {
      expect(category.bands.length).toBeGreaterThan(0);
    }
  });

  it("documents every band", () => {
    for (const band of allBands) {
      expect(labComponentDocs[band.componentId], band.id).toBeDefined();
    }
  });

  it("renders every public component export somewhere on the canvas", () => {
    const catalogSource = globSync("lab/src/bands/*.tsx")
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    for (const name of publicComponentExports) {
      expect(catalogSource, name).toMatch(new RegExp(`[<\\s]${name}[\\s(/>]`));
    }
  });
});

describe("component canvas", () => {
  it("renders each category as labelled bands", () => {
    for (const category of labCategories) {
      const view = renderPath(`/${category.id}`);
      const panel = within(screen.getByRole("tabpanel", { name: category.label }));

      for (const band of category.bands) {
        expect(panel.getByRole("heading", { level: 2, name: band.label })).toBeVisible();
      }

      view.unmount();
    }
  });

  it("shows the selected component's documentation in the inspector", () => {
    for (const band of allBands) {
      const docs = labComponentDocs[band.componentId];
      const view = renderPath(`/${band.category}/${band.id}`);

      expect(inspector().getByRole("heading", { level: 2, name: docs.title })).toBeVisible();
      expect(inspector().getByText(docs.summary)).toBeVisible();
      if (docs.status) expect(inspector().getByText(/^(Beta|Stable|Unstable|Deprecated)$/)).toBeVisible();
      if (docs.importStatement) expect(inspector().getByText(docs.importStatement)).toBeVisible();
      if (docs.props) expect(inspector().getByRole("table", { name: "Public props" })).toBeVisible();
      if (docs.accessibility) {
        expect(inspector().getByRole("heading", { level: 3, name: "Accessibility" })).toBeVisible();
      }

      view.unmount();
    }
  });

  it("selects a band from its label and records it in the location", async () => {
    const user = userEvent.setup();
    renderPath("/actions");

    expect(inspector().getByRole("heading", { level: 2, name: "Button" })).toBeVisible();

    const historyLength = window.history.length;
    const select = screen.getByRole("button", { name: "Button Link" });
    await user.click(select);

    expect(select).toHaveAttribute("aria-current", "true");
    expect(window.location.hash).toBe("#/actions/button-link");
    expect(window.history.length).toBe(historyLength);
    expect(inspector().getByRole("heading", { level: 2, name: "Button Link" })).toBeVisible();
    expect(inspector().getByText('import { ButtonLink, MoreIcon } from "@calebhill/base";')).toBeVisible();
  });

  it("switches the canvas surface while the lab chrome keeps its theme", async () => {
    const user = userEvent.setup();
    renderPath("/actions");

    const canvas = screen.getByTestId("lab-canvas-surface");
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
    expect(canvas).toHaveAttribute("data-base-theme", "light");
    expect(canvas).toHaveAttribute("data-lab-surface", "grey");

    await user.click(within(surfaces).getByRole("button", { name: "Black" }));
    expect(canvas).toHaveAttribute("data-base-theme", "dark");
    expect(canvas).toHaveAttribute("data-lab-surface", "black");
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-base-theme");
    expect(screen.getByRole("complementary", { name: "Inspector" })).not.toHaveAttribute(
      "data-base-theme",
    );

    await user.click(screen.getByRole("tab", { name: "Inputs" }));
    expect(screen.getByTestId("lab-canvas-surface")).toHaveAttribute("data-lab-surface", "black");

    await user.click(within(surfaces).getByRole("button", { name: "White" }));
    expect(screen.getByTestId("lab-canvas-surface")).toHaveAttribute("data-base-theme", "light");
    expect(screen.getByTestId("lab-canvas-surface")).toHaveAttribute("data-lab-surface", "white");
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
    let view = renderPath("/actions");
    expect(screen.getByRole("button", { name: "Primary" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Unavailable action" })).toBeDisabled();
    view.unmount();

    view = renderPath("/inputs");
    expect(screen.getByRole("textbox", { name: "Error input" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    view.unmount();

    renderPath("/feedback");
    expect(screen.getByRole("progressbar", { name: "Upload progress" })).toHaveAttribute(
      "aria-valuenow",
      "45",
    );
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

    for (const labOnly of ["StatusTag", "lab-canvas", "lab-inspector", "--lab-surface"]) {
      expect(packageArtifacts).not.toContain(labOnly);
    }
  });

  it.each(labCategories.map(({ id }) => id))(
    "has no representative automated accessibility violations on %s",
    async (category) => {
      const { container } = renderPath(`/${category}`);

      expect(
        (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
      ).toHaveLength(0);
    },
  );

  it("collapses the inspector into a bottom sheet on narrow screens", async () => {
    const user = userEvent.setup();
    renderPath("/actions");

    const handle = screen.getByRole("button", { name: "Component details" });
    expect(handle).toHaveAttribute("aria-expanded", "false");
    expect(handle).toHaveAttribute("aria-controls", "lab-inspector-body");
    await user.click(handle);
    expect(handle).toHaveAttribute("aria-expanded", "true");
  });

  it("provides a responsive canvas shell", () => {
    expect(topLevelDeclarationsFor(".lab-app-shell").get("grid-template-columns")).toContain("rem");
    expect(topLevelDeclarationsFor(".lab-app-shell").has("width")).toBe(false);
    expect(topLevelDeclarationsFor(".lab-canvas").get("min-width")).toBe("0");
    expect(topLevelDeclarationsFor(".lab-inspector").get("position")).toBe("sticky");
    expect(topLevelDeclarationsFor(".lab-props-table-wrap").get("overflow-x")).toBe("auto");
    expect(topLevelDeclarationsFor(".lab-inspector-handle").get("display")).toBe("none");

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
    expect(narrowRules.some((rule) => rule.selector === ".lab-app-shell")).toBe(true);
    expect(narrowRules.some((rule) => rule.selector === ".lab-inspector")).toBe(true);
    expect(narrowRules.some((rule) => rule.selector === ".lab-inspector-handle")).toBe(true);
    expect(mediaRules("prefers-reduced-motion").some((rule) => rule.selector.includes(".lab-tab"))).toBe(
      true,
    );
  });
});
