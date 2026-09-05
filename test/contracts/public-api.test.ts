import { describe, expect, it } from "vitest";

import * as publicApi from "../../src/index";
import { actionMenuRuntimeExports } from "./public-api/action-menu-exports";
import { buttonRuntimeExports } from "./public-api/button-exports";
import { dialogRuntimeExports } from "./public-api/dialog-exports";
import { primitiveRuntimeExports } from "./public-api/primitive-exports";

const foundationRuntimeExports = ["BASE_THEME_ATTRIBUTE", "isBaseTheme"] as const;
const runtimeExports = [
  ...foundationRuntimeExports,
  ...actionMenuRuntimeExports,
  ...buttonRuntimeExports,
  ...dialogRuntimeExports,
  ...primitiveRuntimeExports,
  "Toast", "ToastProvider", "useToast",
].sort();

describe("public api", () => {
  it("exposes exactly the intended runtime surface", () => {
    expect(Object.keys(publicApi).sort()).toEqual(runtimeExports);
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
