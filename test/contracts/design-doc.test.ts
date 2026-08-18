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
    const roadmap = readme.match(/## Roadmap\n\n(?<content>[\s\S]*?)\n\n## License/)?.groups
      ?.content;

    expect(roadmap).toContain("CLB-694 and CLB-695 added the first public action, input, and feedback primitives");
    expect(roadmap).toContain("CLB-716 added the front-facing component lab");
    expect(roadmap).toContain("a lab-only `StatusTag` that is never exported or included in the npm package");
    expect(roadmap).not.toMatch(/CLB-695[^.]*StatusTag/i);
  });
});
