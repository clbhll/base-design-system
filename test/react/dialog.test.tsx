import { createRef } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it } from "vitest";

import { Button, Dialog, DialogFooter, DialogHeading } from "../../src";

afterEach(() => {
  cleanup();
  document.querySelectorAll("[data-test-portal]").forEach((portal) => portal.remove());
});

describe("Dialog anatomy", () => {
  it("portals the controlled compound anatomy with generated labelling and native surface props", () => {
    const portal = document.createElement("div");
    portal.dataset.testPortal = "true";
    document.body.append(portal);
    const ref = createRef<HTMLDivElement>();

    render(
      <Dialog
        className="consumer-dialog"
        data-track="edit"
        onOpenChange={() => undefined}
        open
        portalContainer={portal}
        ref={ref}
      >
        <DialogHeading title="Edit photo" subtitle="Update the caption." />
        <DialogFooter>
          <Button>Save</Button>
        </DialogFooter>
      </Dialog>,
    );

    const dialog = within(portal).getByRole("dialog", { name: "Edit photo" });
    expect(ref.current).toBe(dialog);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("data-track", "edit");
    expect(dialog).toHaveClass(
      "base-dialog",
      "base-dialog-compact",
      "consumer-dialog",
    );
    expect(within(dialog).getByText("Update the caption.")).toHaveAttribute(
      "id",
      dialog.getAttribute("aria-describedby"),
    );
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders no dialog while the controlled state is closed", () => {
    render(
      <Dialog onOpenChange={() => undefined} open={false}>
        <DialogHeading title="Closed dialog" />
      </Dialog>,
    );

    expect(screen.queryByRole("dialog", { name: "Closed dialog" })).not.toBeInTheDocument();
  });
});

describe("Dialog accessibility", () => {
  it.each(["light", "dark"] as const)("is axe-clean in the %s theme", async (theme) => {
    render(
      <section data-base-theme={theme}>
        <Dialog onOpenChange={() => undefined} open>
          <DialogHeading title="Edit photo" subtitle="Update the caption." />
          <label htmlFor={`${theme}-caption`}>Caption</label>
          <input id={`${theme}-caption`} />
          <a href="#details">View details</a>
          <DialogFooter>
            <Button variant="secondary">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </Dialog>
      </section>,
    );

    expect(
      (await axe(document.body, { rules: { "color-contrast": { enabled: false } } }))
        .violations,
    ).toHaveLength(0);
  });
});
