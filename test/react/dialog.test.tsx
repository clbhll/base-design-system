import { createRef, useRef, useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, Dialog, DialogFooter, DialogHeading } from "../../src";

afterEach(() => {
  cleanup();
  document.querySelectorAll("[data-test-portal]").forEach((portal) => portal.remove());
  document.body.removeAttribute("style");
  document.body.removeAttribute("data-scroll-locked");
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
        style={{ paddingInline: "2rem" }}
      >
        <DialogHeading title="Edit photo" subtitle="Update the caption." />
        <DialogFooter>
          <Button>Save</Button>
        </DialogFooter>
      </Dialog>,
    );

    const dialog = within(portal).getByRole("dialog", { name: "Edit photo" });
    const overlay = portal.querySelector<HTMLElement>(".base-dialog-overlay")!;
    expect(ref.current).toBe(dialog);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("data-track", "edit");
    expect(dialog.style.paddingInline).toBe("2rem");
    expect(dialog.style.getPropertyValue("--base-dialog-ease")).toBe(
      "cubic-bezier(0.22, 1, 0.36, 1)",
    );
    expect(overlay.style.getPropertyValue("--base-dialog-ease")).toBe(
      "cubic-bezier(0.22, 1, 0.36, 1)",
    );
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

function FocusHarness({ explicitInitialFocus = false }: { explicitInitialFocus?: boolean }) {
  const [open, setOpen] = useState(false);
  const [showDynamicControl, setShowDynamicControl] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open focus dialog</Button>
      <Dialog
        initialFocusRef={explicitInitialFocus ? saveRef : undefined}
        onOpenChange={setOpen}
        open={open}
      >
        <DialogHeading title="Focus behavior" />
        <Button onClick={() => setShowDynamicControl(true)}>Show another action</Button>
        {showDynamicControl ? <Button>Dynamic action</Button> : null}
        <Button ref={saveRef}>Save focus</Button>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="secondary">
            Close focus dialog
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

describe("Dialog focus", () => {
  it("uses explicit initial focus and restores the connected opener", async () => {
    const user = userEvent.setup();
    render(<FocusHarness explicitInitialFocus />);

    const opener = screen.getByRole("button", { name: "Open focus dialog" });
    await user.click(opener);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save focus" })).toHaveFocus();
    });

    await user.click(screen.getByRole("button", { name: "Close focus dialog" }));
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("contains forward and backward focus and includes dynamically mounted controls", async () => {
    const user = userEvent.setup();
    render(<FocusHarness />);

    await user.click(screen.getByRole("button", { name: "Open focus dialog" }));
    const showControl = screen.getByRole("button", { name: "Show another action" });
    const close = screen.getByRole("button", { name: "Close focus dialog" });

    await waitFor(() => expect(showControl).toHaveFocus());
    await user.tab({ shift: true });
    expect(close).toHaveFocus();
    await user.tab();
    expect(showControl).toHaveFocus();

    await user.click(showControl);
    await user.tab();
    expect(screen.getByRole("button", { name: "Dynamic action" })).toHaveFocus();
  });
});

function DismissalDialog({
  dismissOnBackdrop,
  dismissOnEscape,
  onOpenChange,
}: {
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog
      dismissOnBackdrop={dismissOnBackdrop}
      dismissOnEscape={dismissOnEscape}
      onOpenChange={onOpenChange}
      open
    >
      <DialogHeading title="Dismissal behavior" />
      <Button>Inside action</Button>
    </Dialog>
  );
}

describe("Dialog dismissal", () => {
  it("dismisses with Escape by default and can disable only that route", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<DismissalDialog onOpenChange={onOpenChange} />);

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    onOpenChange.mockClear();
    rerender(<DismissalDialog dismissOnEscape={false} onOpenChange={onOpenChange} />);
    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("dismisses from the backdrop by default and can disable only that route", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<DismissalDialog onOpenChange={onOpenChange} />);

    await user.click(document.querySelector<HTMLElement>(".base-dialog-overlay")!);
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    onOpenChange.mockClear();
    rerender(<DismissalDialog dismissOnBackdrop={false} onOpenChange={onOpenChange} />);
    await user.click(document.querySelector<HTMLElement>(".base-dialog-overlay")!);
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("does not treat interaction inside the surface as backdrop dismissal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<DismissalDialog onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Inside action" }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Dialog lifecycle", () => {
  it("locks background scrolling without overwriting existing body overflow", async () => {
    document.body.style.overflow = "clip";
    const { rerender } = render(
      <Dialog onOpenChange={() => undefined} open>
        <DialogHeading title="Scroll locking" />
      </Dialog>,
    );

    await waitFor(() => expect(document.body).toHaveAttribute("data-scroll-locked"));
    expect(document.body.style.overflow).toBe("clip");

    rerender(
      <Dialog onOpenChange={() => undefined} open={false}>
        <DialogHeading title="Scroll locking" />
      </Dialog>,
    );

    await waitFor(() =>
      expect(document.body).not.toHaveAttribute("data-scroll-locked"),
    );
    expect(document.body.style.overflow).toBe("clip");
  });

  it("completes exit only when the closing dialog surface finishes animating", async () => {
    function ExitHarness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <style>{`
            @keyframes base-dialog-test-enter { from { opacity: 0; } }
            @keyframes base-dialog-test-exit { to { opacity: 0; } }
            .base-dialog[data-state="open"] {
              animation-name: base-dialog-test-enter;
              animation-duration: 1ms;
            }
            .base-dialog[data-state="closed"] {
              animation-name: base-dialog-test-exit;
              animation-duration: 1ms;
            }
          `}</style>
          <Dialog onExitComplete={onExitComplete} onOpenChange={setOpen} open={open}>
            <DialogHeading title="Exit behavior" />
            <Button onClick={() => setOpen(false)}>Close exit dialog</Button>
          </Dialog>
        </>
      );
    }

    const user = userEvent.setup();
    const onExitComplete = vi.fn();
    render(<ExitHarness />);

    await user.click(screen.getByRole("button", { name: "Close exit dialog" }));
    const dialog = screen.getByRole("dialog", { name: "Exit behavior", hidden: true });
    expect(dialog).toHaveAttribute("data-state", "closed");

    fireEvent.animationEnd(within(dialog).getByRole("heading", { hidden: true }));
    expect(onExitComplete).not.toHaveBeenCalled();

    fireEvent.animationEnd(dialog);
    expect(onExitComplete).toHaveBeenCalledOnce();
  });
});
