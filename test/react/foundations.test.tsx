import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { BASE_THEME_ATTRIBUTE, type BaseTheme } from "../../src";
import "../../src/styles/styles.css";

function FoundationPreview({ theme }: { theme: BaseTheme }) {
  return (
    <section aria-label={`${theme} foundations`} {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      <h2 className="base-type-heading-md">{theme} theme</h2>
      <p className="base-type-body">
        Body copy with <code className="base-type-mono">inline code</code> and a{" "}
        <a className="base-link" href={`#${theme}-target`}>
          visible link
        </a>
        .
      </p>
      <button className="base-focus-ring base-pressable base-type-action" type="button">
        Pressable
      </button>
    </section>
  );
}

describe("foundation preview", () => {
  it.each(["light", "dark"] as const)("renders accessible %s foundations", async (theme) => {
    const { container, unmount } = render(<FoundationPreview theme={theme} />);

    expect(screen.getByRole("region", { name: `${theme} foundations` })).toHaveAttribute(
      BASE_THEME_ATTRIBUTE,
      theme,
    );
    expect(screen.getByRole("button")).toHaveClass("base-focus-ring", "base-pressable");
    expect((await axe(container)).violations).toHaveLength(0);
    unmount();
  });
});
