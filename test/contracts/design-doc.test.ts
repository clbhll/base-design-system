import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const requiredSections = [
  "System purpose and principles",
  "Package boundary",
  "Sources of truth",
  "Tokens and themes",
  "Typography and icons",
  "Component contract",
  "Interaction and accessibility",
  "Motion ownership",
  "Figma parity",
  "AI change protocol",
  "Forbidden shortcuts and drift risks",
  "Versioning, deprecation, and migration",
  "Review checklist",
  "Approved decisions and open questions",
];

async function readRepositoryFile(path: string) {
  return readFile(path, "utf8");
}

describe("design documentation contract", () => {
  it("keeps the AI-first design decision sections discoverable", async () => {
    const design = await readRepositoryFile("DESIGN.md");
    const headings = [...design.matchAll(/^## \d+\. (.+)$/gm)].map((match) => match[1]);

    expect(headings).toEqual(requiredSections);
  });

  it.each(["README.md", "AGENTS.md"])("links to DESIGN.md from %s", async (path) => {
    const document = await readRepositoryFile(path);

    expect(document).toMatch(/\[.*design.*contract.*\]\(DESIGN\.md\)/i);
  });

  it("records the approved CLB-692 foundation contract", async () => {
    const [readme, design] = await Promise.all([
      readRepositoryFile("README.md"),
      readRepositoryFile("DESIGN.md"),
    ]);

    expect(readme).toContain('import "@calebhill/base/tokens.css"');
    expect(readme).toContain("--base-color-accent: #0082f6");
    expect(design).toContain("CLB-692 approved foundation vocabulary");
    expect(design).not.toContain("CLB-692 will approve the complete semantic token");
  });

  it("keeps the shipped StatusTag scoped to the documentation lab", async () => {
    const readme = await readRepositoryFile("README.md");
    const status = readme.match(/## Status\n\n(?<content>[\s\S]*?)\n\n## License/)?.groups
      ?.content;

    expect(status).toContain("Base is in public alpha");
    expect(status).toContain("component lab documenting current APIs and behavior");
    expect(status).not.toMatch(/CLB-/);
    expect(readme).toContain(
      "`StatusTag` remains documentation-only and is never consumable from the package",
    );
  });
});
