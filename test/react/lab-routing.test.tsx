import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";
import { labCategories } from "../../lab/src/catalog";
import { DEFAULT_LAB_CATEGORY, labHref, resolveLabRoute } from "../../lab/src/routing";

vi.mock("../../lab/src/dev-tools", () => ({ DevTools: () => null }));

beforeEach(() => {
  // jsdom implements neither scrolling API; define them so they can be observed.
  if (!("scrollIntoView" in Element.prototype)) {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: () => undefined,
      writable: true,
    });
  }
  window.localStorage.clear();
  window.history.replaceState(null, "", "#/foundations");
});

afterEach(cleanup);

describe("lab hash routing", () => {
  it("resolves categories and bands and defaults invalid locations", () => {
    expect(resolveLabRoute("#/actions", labCategories)).toEqual({ category: "actions" });
    expect(resolveLabRoute("#/actions/button-link", labCategories)).toEqual({
      category: "actions",
      band: "button-link",
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
    ["#/components/button", { category: "actions", band: "button" }],
    ["#/components/button-link", { category: "actions", band: "button-link" }],
    ["#/components/action-menu", { category: "actions", band: "action-menu" }],
    ["#/components/text-input", { category: "inputs", band: "text-input" }],
    ["#/components/progress-bar", { category: "feedback", band: "progress-bar" }],
    ["#/components/toast", { category: "feedback", band: "toast" }],
    ["#/explorations/toast", { category: "feedback", band: "toast" }],
    ["#/components/dialog", { category: "overlays", band: "dialog" }],
    ["#/components/icons", { category: "foundations", band: "icons" }],
  ])("redirects the documentation URL %s", (hash, route) => {
    expect(resolveLabRoute(hash, labCategories)).toEqual(route);
  });

  it("creates static-host-safe hrefs", () => {
    expect(labHref({ category: "inputs" })).toBe("#/inputs");
    expect(labHref({ category: "inputs", band: "text-input" })).toBe("#/inputs/text-input");
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
    expect(screen.getByRole("heading", { level: 2, name: "Button · default size" })).toBeVisible();
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

  it("brings a band reached by a later hash change into view", async () => {
    const scrolled: string[] = [];
    const scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(function (this: Element) {
        scrolled.push(this.id);
      });
    render(<App />);

    window.history.replaceState(null, "", "#/overlays/dialog");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => expect(scrolled).toContain("band-dialog"));
    scrollIntoView.mockRestore();
  });

  it("does not scroll when a band is selected from its label", async () => {
    const scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => undefined);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#/actions");
    render(<App />);
    scrollIntoView.mockClear();
    scrollTo.mockClear();

    await user.click(screen.getByRole("button", { name: "Button Link" }));

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    scrollIntoView.mockRestore();
    scrollTo.mockRestore();
  });

  it("normalizes a documentation URL to its band and selects it", async () => {
    window.history.replaceState(null, "", "#/components/button-link");
    render(<App />);

    await waitFor(() => expect(window.location.hash).toBe("#/actions/button-link"));
    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("aria-selected", "true");
    const inspector = screen.getByRole("complementary", { name: "Inspector" });
    expect(within(inspector).getByRole("heading", { level: 2, name: "Button Link" })).toBeVisible();
  });

  it("normalizes a documentation URL reached by a hash change", async () => {
    render(<App />);

    window.history.replaceState(null, "", "#/components/toast");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => expect(window.location.hash).toBe("#/feedback/toast"));
    expect(screen.getByRole("tab", { name: "Feedback" })).toHaveAttribute("aria-selected", "true");
  });

  it("moves focus to the canvas without replacing the route", async () => {
    window.history.replaceState(null, "", "#/actions/button");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Skip to canvas" }));

    expect(window.location.hash).toBe("#/actions/button");
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
