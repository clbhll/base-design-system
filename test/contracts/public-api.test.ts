import { describe, expect, it } from "vitest";

import { BASE_THEME_ATTRIBUTE, isBaseTheme } from "../../src/index";

describe("public api", () => {
  it("exposes the base theme attribute constant", () => {
    expect(BASE_THEME_ATTRIBUTE).toBe("data-base-theme");
  });

  it("narrows valid theme values", () => {
    expect(isBaseTheme("light")).toBe(true);
    expect(isBaseTheme("dark")).toBe(true);
    expect(isBaseTheme("sepia")).toBe(false);
  });
});
