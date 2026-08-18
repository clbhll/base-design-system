import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it } from "vitest";

import { ProgressBar } from "../../src";
import "../../src/styles/styles.css";

afterEach(cleanup);

describe("ProgressBar", () => {
  it.each([
    [-20, 0],
    [0, 0],
    [45, 45],
    [140, 100],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [Number.NEGATIVE_INFINITY, 0],
  ])("normalizes %s to %s without changing layout", (value, normalized) => {
    const { unmount } = render(<ProgressBar label="Upload progress" value={value} />);

    const progress = screen.getByRole("progressbar", { name: "Upload progress" });
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(progress).toHaveAttribute("aria-valuenow", String(normalized));
    expect(progress.querySelector(".base-progress-bar-fill")).toHaveStyle({
      transform: `scaleX(${normalized / 100})`,
    });
    unmount();
  });

  it("maps label to the accessible name without forwarding it to the DOM", () => {
    render(<ProgressBar label="Publishing" value={45} />);

    const progress = screen.getByRole("progressbar", { name: "Publishing" });
    expect(progress).toHaveAttribute("aria-label", "Publishing");
    expect(progress).not.toHaveAttribute("label");
  });

  it("supports aria-label as its accessible-name route", () => {
    render(<ProgressBar aria-label="Processing" value={45} />);

    expect(screen.getByRole("progressbar", { name: "Processing" })).toBeInTheDocument();
  });

  it("supports aria-labelledby as its accessible-name route", () => {
    render(
      <>
        <span id="progress-label">Preparing upload</span>
        <ProgressBar aria-labelledby="progress-label" value={45} />
      </>,
    );

    expect(
      screen.getByRole("progressbar", { name: "Preparing upload" }),
    ).toBeInTheDocument();
  });

  it("forwards its ref, native props, className, and value text", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ProgressBar
        aria-label="Upload"
        aria-valuetext="Nearly halfway"
        className="consumer-progress"
        data-upload-id="photo-1"
        ref={ref}
        title="Upload status"
        value={45}
      />,
    );

    const progress = screen.getByRole("progressbar", { name: "Upload" });
    expect(ref.current).toBe(progress);
    expect(progress).toHaveAttribute("aria-valuetext", "Nearly halfway");
    expect(progress).toHaveAttribute("data-upload-id", "photo-1");
    expect(progress).toHaveAttribute("title", "Upload status");
    expect(progress).toHaveClass("base-progress-bar", "consumer-progress");
    expect(progress.querySelector(".base-progress-bar-fill")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it.each(["light", "dark"] as const)("is axe-clean in the %s theme", async (theme) => {
    const { container, unmount } = render(
      <section data-base-theme={theme}>
        <span id={`${theme}-progress-label`}>Upload progress</span>
        <ProgressBar
          aria-labelledby={`${theme}-progress-label`}
          aria-valuetext="45 percent"
          value={45}
        />
      </section>,
    );

    expect(
      (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toHaveLength(0);
    unmount();
  });
});
