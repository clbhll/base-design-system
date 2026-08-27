import { createRef, useState } from "react";
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

import { ActionMenu, MoreIcon } from "../../src";

const items = [
  { label: "Edit", onSelect: () => undefined },
  { label: "Archive", onSelect: () => undefined },
  { label: "Unavailable", disabled: true, onSelect: () => undefined },
  { label: "Delete", tone: "destructive" as const, onSelect: () => undefined },
] as const;

afterEach(() => {
  cleanup();
  document.querySelectorAll("[data-test-portal]").forEach((portal) => portal.remove());
});

function createPortal() {
  const portal = document.createElement("div");
  portal.dataset.testPortal = "true";
  document.body.append(portal);
  return portal;
}

describe("ActionMenu anatomy and state", () => {
  it("portals an uncontrolled labelled menu and forwards the trigger ref", async () => {
    const user = userEvent.setup();
    const portal = createPortal();
    const triggerRef = createRef<HTMLButtonElement>();

    render(
      <ActionMenu
        ref={triggerRef}
        className="photo-actions"
        data-track="photo-options"
        icon={<MoreIcon />}
        items={items}
        label="Photo options"
        portalContainer={portal}
        style={{ transformOrigin: "top right" }}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Photo options" });
    expect(triggerRef.current).toBe(trigger);
    expect(trigger.closest(".base-action-menu-root")).toHaveClass("photo-actions");
    expect(trigger.closest(".base-action-menu-root")).toHaveAttribute(
      "data-track",
      "photo-options",
    );
    expect(trigger.closest(".base-action-menu-root")).toHaveStyle({
      transformOrigin: "top right",
    });

    await user.click(trigger);

    const menu = within(portal).getByRole("menu", { name: "Photo options" });
    expect(menu).toHaveAttribute("data-side", "top");
    expect(menu).toHaveAttribute("data-align", "end");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(4);
  });

  it("reports controlled state requests without mutating the supplied state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <ActionMenu
        icon={<MoreIcon />}
        items={items}
        label="Controlled options"
        onOpenChange={onOpenChange}
        open
      />,
    );

    expect(screen.getByRole("menu", { name: "Controlled options" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("menu", { name: "Controlled options" })).toBeInTheDocument();
  });
});

describe("ActionMenu keyboard and disabled behavior", () => {
  it("opens from either arrow and moves through enabled items with wrapping", async () => {
    const user = userEvent.setup();
    render(
      <ActionMenu icon={<MoreIcon />} items={items} label="Keyboard options" />,
    );

    const trigger = screen.getByRole("button", { name: "Keyboard options" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();

    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();

    await user.keyboard("a");
    expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.keyboard("{ArrowUp}");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus(),
    );
  });

  it("skips disabled items and never invokes their selection", async () => {
    const user = userEvent.setup();
    const onUnavailable = vi.fn();
    render(
      <ActionMenu
        icon={<MoreIcon />}
        items={items.map((item) =>
          item.label === "Unavailable" ? { ...item, onSelect: onUnavailable } : item,
        )}
        label="Disabled options"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Disabled options" }));
    const unavailable = screen.getByRole("menuitem", { name: "Unavailable" });
    expect(unavailable).toHaveAttribute("data-disabled");

    await user.click(unavailable);
    expect(onUnavailable).not.toHaveBeenCalled();
    expect(screen.getByRole("menu", { name: "Disabled options" })).toBeInTheDocument();

    screen.getByRole("menuitem", { name: "Archive" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
  });
});

describe("ActionMenu selection handoff and focus restoration", () => {
  it("restores trigger focus before invoking one selection callback", async () => {
    const user = userEvent.setup();
    const focusAtSelection: Array<Element | null> = [];
    const onSelect = vi.fn(() => focusAtSelection.push(document.activeElement));

    render(
      <ActionMenu
        icon={<MoreIcon />}
        items={[{ label: "Edit", onSelect }]}
        label="Handoff options"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Handoff options" });
    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledOnce());
    expect(focusAtSelection).toEqual([trigger]);
    expect(trigger).toHaveFocus();
  });

  it("dismisses without selecting from Escape or an outside pointer", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ActionMenu
        icon={<MoreIcon />}
        items={[{ label: "Edit", onSelect }]}
        label="Dismiss options"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Dismiss options" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(trigger);
    fireEvent.pointerDown(document.body);
    await waitFor(() =>
      expect(screen.queryByRole("menu", { name: "Dismiss options" })).not.toBeInTheDocument(),
    );
    expect(onSelect).not.toHaveBeenCalled();
  });
});

function OpenMenu({ theme }: { theme: "light" | "dark" }) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);

  return (
    <div data-base-theme={theme} ref={setRoot}>
      <ActionMenu
        icon={<MoreIcon />}
        items={items}
        label={`${theme} options`}
        onOpenChange={setOpen}
        open={open}
        portalContainer={root}
      />
    </div>
  );
}

describe("ActionMenu accessibility", () => {
  it.each(["light", "dark"] as const)("is axe-clean in the %s theme", async (theme) => {
    const { container, rerender } = render(<OpenMenu theme={theme} />);
    rerender(<OpenMenu theme={theme} />);

    expect(screen.getByRole("menu", { name: `${theme} options` })).toBeInTheDocument();
    expect(
      (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toHaveLength(0);
  });
});

describe("ActionMenu motion", () => {
  it("enters from the proven surface and item geometry", () => {
    render(
      <ActionMenu
        defaultOpen
        icon={<MoreIcon />}
        items={[{ label: "Edit", onSelect: () => undefined }]}
        label="Motion options"
      />,
    );

    expect(screen.getByRole("menu", { name: "Motion options" })).toHaveStyle({
      opacity: "0",
      transform: "translateY(4px) scale(0.95)",
    });
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveStyle({
      opacity: "0",
      transform: "translateY(3px) scale(0.95)",
    });
  });
});
