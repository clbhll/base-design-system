import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const iconDirectory = "src/components/icons";
const iconFiles = [
  ["more-icon.tsx", "https://iconic.app/dots-horizontal/"],
  ["trash-icon.tsx", "https://iconic.app/trash/"],
] as const;

describe("icon source and license", () => {
  it.each(iconFiles)("documents the exact Iconic source and Free License in %s", (file, sourceUrl) => {
    const source = readFileSync(`${iconDirectory}/${file}`, "utf8");

    expect(source).toContain(sourceUrl);
    expect(source).toContain("https://iconic.app/iconic-free-license/");
  });

  it("contains only the two approved alpha icon modules", () => {
    expect(readdirSync(iconDirectory).sort()).toEqual(
      iconFiles.map(([file]) => file).sort(),
    );
  });
});
