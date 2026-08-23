import { describe, expect, it } from "vitest";

import { DEFAULT_LAB_PATH, labHref, resolveLabPath } from "../../lab/src/routing";

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
