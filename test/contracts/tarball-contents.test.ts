import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("tarball contents", () => {
  it("publishes only the approved package files", () => {
    expect(() =>
      execFileSync("node", ["scripts/assert-tarball-contents.mjs"], {
        stdio: "inherit",
      }),
    ).not.toThrow();
  });
});
