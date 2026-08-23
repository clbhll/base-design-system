import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../lab/src/app";
import { DEFAULT_LAB_PATH, labHref, resolveLabPath } from "../../lab/src/routing";

vi.mock("../../lab/src/dev-tools", () => ({ DevTools: () => null }));

beforeEach(() => {
  window.history.replaceState(null, "", "#/foundations");
});

afterEach(cleanup);

const paths = new Set([
  "/foundations",
  "/components/button",
  "/components/button-link",
  "/components/text-input",
  "/components/progress-bar",
  "/components/icons",
]);

describe("lab hash routing", () => {
  it("resolves valid hashes and defaults invalid locations", () => {
    expect(resolveLabPath("#/components/button", paths)).toBe("/components/button");
    expect(resolveLabPath("", paths)).toBe(DEFAULT_LAB_PATH);
    expect(resolveLabPath("#components/button", paths)).toBe(DEFAULT_LAB_PATH);
    expect(resolveLabPath("#/components/unknown", paths)).toBe(DEFAULT_LAB_PATH);
  });

  it("creates static-host-safe hrefs", () => {
    expect(labHref("/components/text-input")).toBe("#/components/text-input");
  });
});

describe("lab document navigation", () => {
  it("lists the current catalog and marks the active document", () => {
    render(<App />);

    expect(screen.getByRole("navigation", { name: "Base documentation" })).toBeVisible();
    for (const label of [
      "Foundations",
      "Button",
      "Button Link",
      "Text Input",
      "Progress Bar",
      "Icons",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "Foundations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "View source" })).toHaveAttribute(
      "href",
      "https://github.com/clbhll/base-design-system",
    );
    expect(screen.getByRole("link", { name: "Skip to document" })).toHaveAttribute(
      "href",
      "#lab-document",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "lab-document");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Foundations — Base");
  });

  it("selects a document without reloading and follows location changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Button" }));
    expect(window.location.hash).toBe("#/components/button");
    expect(await screen.findByRole("heading", { level: 1, name: "Button" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(document.title).toBe("Button — Base");

    window.history.replaceState(null, "", "#/foundations");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(await screen.findByRole("heading", { level: 1, name: "Foundations" })).toBeVisible();
  });

  it("moves focus to the document without replacing the component route", async () => {
    window.history.replaceState(null, "", "#/components/button");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Skip to document" }));

    expect(window.location.hash).toBe("#/components/button");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("normalizes an unknown location to Foundations", async () => {
    window.history.replaceState(null, "", "#/components/unknown");
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Foundations" })).toBeVisible();
    await waitFor(() => expect(window.location.hash).toBe("#/foundations"));
    expect(screen.getByRole("link", { name: "Foundations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
