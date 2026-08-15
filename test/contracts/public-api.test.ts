import { describe, expect, it } from "vitest";

import * as publicApi from "../../src/index";

describe("public api", () => {
  it("exposes exactly the intended runtime surface", () => {
    expect(Object.keys(publicApi).sort()).toEqual(["BASE_THEME_ATTRIBUTE", "isBaseTheme"]);
  });

  it("exposes the base theme attribute constant", () => {
    expect(publicApi.BASE_THEME_ATTRIBUTE).toBe("data-base-theme");
  });

  it("narrows valid theme values", () => {
    expect(publicApi.isBaseTheme("light")).toBe(true);
    expect(publicApi.isBaseTheme("dark")).toBe(true);
    expect(publicApi.isBaseTheme("sepia")).toBe(false);
  });
});
