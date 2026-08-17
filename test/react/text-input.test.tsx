import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it } from "vitest";

import { TextInput } from "../../src";
import "../../src/styles/styles.css";

afterEach(cleanup);

describe("TextInput", () => {
  it("forwards its ref and native input props while composing the consumer class", () => {
    const ref = createRef<HTMLInputElement>();

    render(
      <TextInput
        aria-label="Email"
        autoComplete="email"
        className="consumer-field"
        data-field="account-email"
        name="email"
        ref={ref}
        required
        type="email"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAttribute("data-field", "account-email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toBeRequired();
    expect(input).toHaveClass(
      "base-text-input-field",
      "base-type-input",
      "base-focus-ring",
      "consumer-field",
    );
    expect(input.closest(".base-text-input")).not.toBeNull();
  });

  it("does not add error semantics or a generated description without an error", () => {
    render(<TextInput aria-describedby="email-hint" aria-label="Email" />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute("aria-describedby", "email-hint");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("associates an alert after every consumer-provided description", () => {
    const ref = createRef<HTMLInputElement>();

    render(
      <TextInput
        aria-describedby="hint-one hint-two"
        aria-label="Caption"
        error="Caption is required"
        ref={ref}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Caption" });
    const error = screen.getByRole("alert");
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual([
      "hint-one",
      "hint-two",
      error.id,
    ]);
    expect(error).toHaveTextContent("Caption is required");
    expect(error).toHaveClass("base-text-input-error", "base-type-caption");
  });

  it("preserves native disabled behavior", () => {
    render(<TextInput aria-label="Unavailable field" disabled placeholder="Unavailable" />);

    expect(screen.getByRole("textbox", { name: "Unavailable field" })).toBeDisabled();
  });

  it.each(["light", "dark"] as const)("is axe-clean in the %s theme", async (theme) => {
    const { container, unmount } = render(
      <section data-base-theme={theme}>
        <label htmlFor={`${theme}-caption`}>Caption</label>
        <p id={`${theme}-hint`}>Describe the photo.</p>
        <TextInput
          aria-describedby={`${theme}-hint`}
          error="Caption is required"
          id={`${theme}-caption`}
          placeholder="A short description"
        />
        <TextInput aria-label="Disabled field" disabled />
      </section>,
    );

    expect(
      (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toHaveLength(0);
    unmount();
  });
});
