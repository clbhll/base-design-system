import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const iconDirectory = "src/components/icons";
const iconFiles = ["more-icon.tsx", "trash-icon.tsx"] as const;

describe("icon source and license", () => {
  it.each(iconFiles)("documents the Iconic source and Free License in %s", (file) => {
    const source = readFileSync(`${iconDirectory}/${file}`, "utf8");

    expect(source).toContain("https://iconic.app/");
    expect(source).toContain("https://iconic.app/iconic-free-license/");
  });

  it("contains only the two approved alpha icon modules", () => {
    expect(readdirSync(iconDirectory).sort()).toEqual([...iconFiles].sort());
  });
});
