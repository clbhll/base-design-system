import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";
import { labCategories } from "../../lab/src/catalog";
import { DEFAULT_LAB_CATEGORY, labHref, resolveLabRoute } from "../../lab/src/routing";

vi.mock("../../lab/src/dev-tools", () => ({ DevTools: () => null }));

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "#/foundations");
});

afterEach(cleanup);

describe("lab hash routing", () => {
  it("resolves categories and components and defaults invalid locations", () => {
    expect(resolveLabRoute("#/actions", labCategories)).toEqual({ category: "actions" });
    expect(resolveLabRoute("#/actions/button-link", labCategories)).toEqual({
      category: "actions",
      component: "button-link",
    });
    expect(resolveLabRoute("#/inputs/button", labCategories)).toEqual({ category: "inputs" });
    expect(resolveLabRoute("", labCategories)).toEqual({ category: DEFAULT_LAB_CATEGORY });
    expect(resolveLabRoute("#actions", labCategories)).toEqual({
      category: DEFAULT_LAB_CATEGORY,
    });
    expect(resolveLabRoute("#/unknown", labCategories)).toEqual({
      category: DEFAULT_LAB_CATEGORY,
    });
  });

  it.each([
    ["#/foundations", { category: "foundations" }],
    ["#/components/button", { category: "actions", component: "button" }],
    ["#/components/button-link", { category: "actions", component: "button-link" }],
    ["#/components/action-menu", { category: "actions", component: "action-menu" }],
    ["#/components/text-input", { category: "inputs", component: "text-input" }],
    ["#/components/progress-bar", { category: "feedback", component: "progress-bar" }],
    ["#/components/toast", { category: "feedback", component: "toast" }],
    ["#/explorations/toast", { category: "feedback", component: "toast" }],
    ["#/components/dialog", { category: "overlays", component: "dialog" }],
    ["#/components/icons", { category: "foundations", component: "icons" }],
  ])("redirects the documentation URL %s", (hash, route) => {
    expect(resolveLabRoute(hash, labCategories)).toEqual(route);
  });

  it("creates static-host-safe hrefs", () => {
    expect(labHref({ category: "inputs" })).toBe("#/inputs");
    expect(labHref({ category: "inputs", component: "text-input" })).toBe("#/inputs/text-input");
  });
});

describe("lab category navigation", () => {
  it("lists every category as a tab and marks the active one", () => {
    render(<App />);

    const tablist = screen.getByRole("tablist", { name: "Component categories" });
    expect(within(tablist).getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Foundations",
      "Actions",
      "Inputs",
      "Feedback",
      "Overlays",
    ]);
    expect(screen.getByRole("tab", { name: "Foundations" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel", { name: "Foundations" })).toBeVisible();
    expect(screen.getByRole("link", { name: "View source" })).toHaveAttribute(
      "href",
      "https://github.com/clbhll/base-design-system",
    );
    expect(screen.getByRole("link", { name: "Skip to canvas" })).toHaveAttribute(
      "href",
      "#lab-canvas",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "lab-canvas");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Foundations — Base");
  });

  it("selects a category without reloading and follows location changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Actions" }));
    expect(window.location.hash).toBe("#/actions");
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("aria-selected", "true");
    const actions = screen.getByRole("tabpanel", { name: "Actions" });
    expect(within(actions).getByRole("heading", { level: 2, name: "Button" })).toBeVisible();
    expect(document.title).toBe("Actions — Base");

    window.history.replaceState(null, "", "#/inputs");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    const inputs = await screen.findByRole("tabpanel", { name: "Inputs" });
    expect(within(inputs).getByRole("heading", { level: 2, name: "Text Input" })).toBeVisible();
  });

  it("moves between tabs with arrow keys using a roving tab stop", async () => {
    const user = userEvent.setup();
    render(<App />);

    const foundations = screen.getByRole("tab", { name: "Foundations" });
    expect(foundations).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("tabindex", "-1");

    foundations.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveFocus();
    expect(window.location.hash).toBe("#/actions");

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Overlays" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(foundations).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Overlays" })).toHaveFocus();
  });

  it("moves between tabs from the keyboard without adding history entries", async () => {
    const user = userEvent.setup();
    render(<App />);
    const historyLength = window.history.length;

    screen.getByRole("tab", { name: "Foundations" }).focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{End}{Home}");

    expect(window.location.hash).toBe("#/foundations");
    expect(window.history.length).toBe(historyLength);

    await user.click(screen.getByRole("tab", { name: "Inputs" }));
    expect(window.history.length).toBe(historyLength + 1);
  });

  it("scrolls to the top of a newly selected category", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<App />);
    scrollTo.mockClear();

    await user.click(screen.getByRole("tab", { name: "Feedback" }));

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });

  it("opens the component named by a documentation URL", async () => {
    window.history.replaceState(null, "", "#/components/button-link");
    render(<App />);

    await waitFor(() => expect(window.location.hash).toBe("#/actions/button-link"));
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("dialog", { name: "Button Link" })).toBeVisible();
  });

  it("opens a component reached by a later hash change", async () => {
    render(<App />);

    window.history.replaceState(null, "", "#/components/toast");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => expect(window.location.hash).toBe("#/feedback/toast"));
    expect(screen.getByRole("tab", { name: "Feedback" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("dialog", { name: "Toast" })).toBeVisible();
  });

  it("moves focus to the canvas without replacing the route", async () => {
    window.history.replaceState(null, "", "#/actions");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Skip to canvas" }));

    expect(window.location.hash).toBe("#/actions");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("normalizes an unknown location to Foundations", async () => {
    window.history.replaceState(null, "", "#/components/unknown");
    render(<App />);

    await waitFor(() => expect(window.location.hash).toBe("#/foundations"));
    expect(screen.getByRole("tab", { name: "Foundations" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
