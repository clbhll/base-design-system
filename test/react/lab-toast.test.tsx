import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";

import { ToastDocument } from "../../lab/src/documents/toast";

afterEach(cleanup);

it("lets the visual pass edit the message and independently remove both optional parts", async () => {
  const user = userEvent.setup();
  render(<ToastDocument />);
  const preview = within(screen.getByRole("group", { name: "Toast preview" }));

  expect(preview.getByText("Your changes have been saved.")).toBeVisible();
  expect(preview.getByRole("button", { name: "Undo" })).toHaveClass("base-button-subtle");

  await user.clear(screen.getByRole("textbox", { name: "Message" }));
  await user.type(screen.getByRole("textbox", { name: "Message" }), "Photo removed.");
  expect(preview.getByText("Photo removed.")).toBeVisible();

  await user.selectOptions(screen.getByRole("combobox", { name: "Leading media" }), "image");
  expect(screen.getByTestId("toast-leading-image")).toHaveAttribute("alt", "");
  await user.selectOptions(screen.getByRole("combobox", { name: "Leading media" }), "none");
  expect(screen.queryByTestId("toast-leading-image")).not.toBeInTheDocument();

  await user.click(screen.getByRole("checkbox", { name: "Trailing button" }));
  expect(preview.queryByRole("button")).not.toBeInTheDocument();
  expect(preview.getByText("Photo removed.")).toBeVisible();
});
