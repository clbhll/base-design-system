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
});
