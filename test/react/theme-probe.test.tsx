import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { BASE_THEME_ATTRIBUTE, type BaseTheme, isBaseTheme } from "../../src";
import "../../src/styles/styles.css";

function ThemeProbe({ theme }: { theme: BaseTheme }) {
  return (
    <div className="base-theme-probe" data-testid="probe" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      {isBaseTheme(theme) ? `theme:${theme}` : "invalid"}
    </div>
  );
}

describe("theme probe", () => {
  it("renders a valid themed probe", async () => {
    const { container } = render(<ThemeProbe theme="dark" />);
    expect(screen.getByTestId("probe")).toHaveTextContent("theme:dark");
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
