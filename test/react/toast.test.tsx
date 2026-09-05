import { createRef, useEffect } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import {
  Toast,
  Dialog,
  DialogHeading,
  ActionMenu,
  MoreIcon,
  ToastProvider,
  useToast,
  type ToastController,
} from "../../src";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

let controller: ToastController;
function Consumer() {
  const value = useToast();
  useEffect(() => {
    controller = value;
  }, [value]);
  return <button>Outside</button>;
}
function setup(
  props: Partial<React.ComponentProps<typeof ToastProvider>> = {},
) {
  return render(
    <ToastProvider {...props}>
      <Consumer />
    </ToastProvider>,
  );
}
const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
const notifications = () =>
  screen.getByRole("region", { name: "Notifications (F8)" });
const message = (text: string) => within(notifications()).queryByText(text);

describe("Toast anatomy", () => {
  it("uses a real subtle Base button and decorative leading media while forwarding native props", () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    render(
      <Toast
        ref={ref}
        message="Saved"
        leading={<img src="/photo.jpg" alt="" />}
        action={{ label: "Undo", onClick }}
        data-testid="surface"
      />,
    );
    expect(ref.current).toBe(screen.getByTestId("surface"));
    expect(screen.getByRole("button", { name: "Undo" })).toHaveClass(
      "base-button",
      "base-button-subtle",
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("Toast provider", () => {
  it("lets a modal-scoped provider handle F8 while global notifications are hidden", () => {
    setup();
    act(() => {
      controller.notify({ message: "Global", duration: null });
    });
    const portal = document.createElement("div");
    render(
      <Dialog open onOpenChange={() => undefined}>
        <DialogHeading title="Edit" subtitle="Edit settings" />
        <ToastProvider portalContainer={portal}>
          <Consumer />
        </ToastProvider>
        <div data-testid="modal-portals" />
      </Dialog>,
    );
    screen.getByTestId("modal-portals").appendChild(portal);
    act(() => {
      controller.notify({ message: "Scoped", duration: null });
    });
    act(() => screen.getByRole("button", { name: "Outside" }).focus());
    fireEvent.keyDown(document.activeElement!, { key: "F8" });
    expect(portal.querySelector(".base-toast-viewport")).toHaveFocus();
  });

  it("does not dismiss when a right swipe returns to its starting point", () => {
    setup();
    act(() => {
      controller.notify({ message: "Saved", duration: null });
    });
    const item = message("Saved")!.closest("li")!;
    item.setPointerCapture = vi.fn();
    item.hasPointerCapture = () => true;
    item.releasePointerCapture = vi.fn();
    const pointer = (type: string, x: number) =>
      fireEvent(
        item,
        Object.assign(
          new MouseEvent(type, {
            bubbles: true,
            button: 0,
            clientX: x,
            clientY: 10,
          }),
          { pointerId: 1 },
        ),
      );
    pointer("pointerdown", 10);
    pointer("pointermove", 90);
    pointer("pointermove", 10);
    pointer("pointerup", 10);
    expect(item).toHaveAttribute("data-state", "open");
  });

  it("does not steal focus from a different provider with the same local toast id", () => {
    setup();
    const firstProvider = controller;
    let firstId = "";
    act(() => {
      firstId = firstProvider.notify({ message: "First", duration: null });
    });
    setup();
    act(() => {
      controller.notify({ message: "Second", duration: null });
    });
    const secondRegion = screen.getAllByRole("region", {
      name: "Notifications (F8)",
    })[1];
    const button = within(secondRegion).getByRole("button", {
      name: "Dismiss",
    });
    act(() => button.focus());
    act(() => firstProvider.dismiss(firstId));
    expect(button).toHaveFocus();
  });

  it("dismisses with a right swipe without invoking the nested action", async () => {
    vi.useFakeTimers();
    setup();
    const onClick = vi.fn();
    act(() => {
      controller.notify({
        message: "Saved",
        duration: null,
        action: { label: "Undo", onClick },
      });
    });
    const item = message("Saved")!.closest("li")!;
    item.setPointerCapture = vi.fn();
    item.hasPointerCapture = () => true;
    item.releasePointerCapture = vi.fn();
    const pointer = (type: string, x: number) =>
      fireEvent(
        item,
        Object.assign(
          new MouseEvent(type, {
            bubbles: true,
            button: 0,
            clientX: x,
            clientY: 10,
          }),
          { pointerId: 1 },
        ),
      );
    pointer("pointerdown", 10);
    pointer("pointermove", 90);
    pointer("pointerup", 90);
    fireEvent.click(within(item).getByRole("button", { name: "Undo" }));
    await tick(200);
    expect(onClick).not.toHaveBeenCalled();
    expect(message("Saved")).not.toBeInTheDocument();
  });

  it("removes dismissed queued notifications without consuming a later visible slot", async () => {
    vi.useFakeTimers();
    setup({ maxVisible: 1 });
    let first = "";
    let queued = "";
    act(() => {
      first = controller.notify({ message: "First", duration: null });
      queued = controller.notify({ message: "Cancelled", duration: null });
      controller.notify({ message: "Third", duration: null });
      controller.dismiss(queued);
      controller.dismiss(first);
    });
    await tick(200);
    expect(message("Cancelled")).not.toBeInTheDocument();
    expect(message("Third")).toBeVisible();
  });

  it("does not intercept Escape from an open action menu", () => {
    const onOpenChange = vi.fn();
    render(
      <ToastProvider>
        <Consumer />
        <ActionMenu
          open
          onOpenChange={onOpenChange}
          label="Options"
          icon={<MoreIcon />}
          items={[{ label: "Edit", onSelect: () => undefined }]}
        />
      </ToastProvider>,
    );
    act(() => {
      controller.notify({ message: "Saved", duration: null });
    });
    screen.getByRole("menuitem", { name: "Edit" }).focus();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("pauses on window blur and resumes the remaining duration", async () => {
    vi.useFakeTimers();
    setup();
    act(() => {
      controller.notify({ message: "Saved", duration: 1000 });
    });
    await tick(400);
    fireEvent.blur(window);
    await tick(5000);
    expect(message("Saved")).toBeVisible();
    fireEvent.focus(window);
    await tick(500);
    expect(message("Saved")).toBeVisible();
    await tick(300);
    expect(message("Saved")).not.toBeInTheDocument();
  });

  it("does not intercept Escape from an open dialog", () => {
    const onOpenChange = vi.fn();
    render(
      <ToastProvider>
        <Consumer />
        <Dialog open onOpenChange={onOpenChange}>
          <DialogHeading title="Edit" subtitle="Edit settings" />
          <button>Save</button>
        </Dialog>
      </ToastProvider>,
    );
    act(() => {
      controller.notify({ message: "Saved", duration: null });
    });
    screen.getByRole("button", { name: "Save" }).focus();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it.each(["dismiss", "dismissAll"] as const)(
    "preserves keyboard focus after controller %s",
    async (method) => {
      vi.useFakeTimers();
      setup();
      let id = "";
      act(() => {
        id = controller.notify({ message: "Saved", duration: null });
      });
      act(() =>
        within(notifications())
          .getByRole("button", { name: "Dismiss" })
          .focus(),
      );
      act(() => controller[method](id));
      await tick(200);
      expect(document.activeElement).not.toBe(document.body);
    },
  );

  it("starts timed notifications after clearing a hovered queue", async () => {
    vi.useFakeTimers();
    setup();
    act(() => {
      controller.notify({ message: "First", duration: null });
    });
    fireEvent.pointerMove(notifications());
    act(() => controller.dismissAll());
    fireEvent.pointerLeave(notifications());
    act(() => {
      controller.notify({ message: "Second", duration: 100 });
    });
    await tick(500);
    expect(message("Second")).not.toBeInTheDocument();
  });

  it("shows immediately without stealing focus and automatically dismisses at the supplied duration", async () => {
    vi.useFakeTimers();
    setup();
    screen.getByRole("button", { name: "Outside" }).focus();
    act(() => {
      controller.notify({ message: "Saved", duration: 1000 });
    });
    expect(message("Saved")).toBeVisible();
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    await tick(999);
    expect(message("Saved")).toBeVisible();
    await tick(201);
    expect(message("Saved")).not.toBeInTheDocument();
  });

  it("keeps a persistent toast until its fallback Dismiss button is used", async () => {
    vi.useFakeTimers();
    setup();
    act(() => {
      controller.notify({ message: "Connection lost", duration: null });
    });
    await tick(60_000);
    expect(message("Connection lost")).toBeVisible();
    fireEvent.click(
      within(notifications()).getByRole("button", { name: "Dismiss" }),
    );
    await tick(200);
    expect(message("Connection lost")).not.toBeInTheDocument();
  });

  it("invokes a supplied action and dismisses a persistent toast without adding another button", async () => {
    vi.useFakeTimers();
    setup();
    const onClick = vi.fn();
    act(() => {
      controller.notify({
        message: "Removed",
        duration: null,
        action: { label: "Undo", onClick },
      });
    });
    expect(within(notifications()).getAllByRole("button")).toHaveLength(1);
    fireEvent.click(
      within(notifications()).getByRole("button", { name: "Undo" }),
    );
    await tick(200);
    expect(onClick).toHaveBeenCalledOnce();
    expect(message("Removed")).not.toBeInTheDocument();
  });

  it("bounds visible notifications, deduplicates same-tick requests, and starts queued timers only on display", async () => {
    vi.useFakeTimers();
    setup({ maxVisible: 1 });
    let first = "";
    let duplicate = "";
    act(() => {
      first = controller.notify({ message: "First", duration: null });
      duplicate = controller.notify({ message: "First", duration: null });
      controller.notify({ message: "Second", duration: 1000 });
    });
    expect(first).toBe(duplicate);
    expect(message("First")).toBeVisible();
    expect(message("Second")).not.toBeInTheDocument();
    await tick(5000);
    act(() => controller.dismiss(first));
    await tick(200);
    expect(message("Second")).toBeVisible();
    await tick(900);
    expect(message("Second")).toBeVisible();
    await tick(300);
    expect(message("Second")).not.toBeInTheDocument();
  });

  it("pauses the remaining timeout while focused and resumes after focus leaves", async () => {
    vi.useFakeTimers();
    setup();
    act(() => {
      controller.notify({
        message: "Saved",
        duration: 1000,
        action: { label: "Undo", onClick: () => undefined },
      });
    });
    await tick(400);
    act(() =>
      within(notifications()).getByRole("button", { name: "Undo" }).focus(),
    );
    await tick(5000);
    expect(message("Saved")).toBeVisible();
    act(() => screen.getByRole("button", { name: "Outside" }).focus());
    await tick(500);
    expect(message("Saved")).toBeVisible();
    await tick(300);
    expect(message("Saved")).not.toBeInTheDocument();
  });

  it("pauses on hover and exposes F8 keyboard access and Escape dismissal", async () => {
    vi.useFakeTimers();
    setup();
    act(() => {
      controller.notify({ message: "Saved", duration: 1000 });
    });
    await tick(400);
    fireEvent.pointerMove(notifications());
    await tick(5000);
    expect(message("Saved")).toBeVisible();
    fireEvent.keyDown(document, { key: "F8", code: "F8" });
    expect(document.activeElement).toHaveClass("base-toast-viewport");
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await tick(200);
    expect(message("Saved")).not.toBeInTheDocument();
  });

  it("announces errors assertively and other feedback politely", async () => {
    vi.useFakeTimers();
    setup();
    act(() => {
      controller.notify({
        message: "Saved",
        variant: "success",
        duration: null,
      });
      controller.notify({
        message: "Failed",
        variant: "error",
        duration: null,
      });
    });
    await tick(100);
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      "Saved",
    );
    expect(document.querySelector('[aria-live="assertive"]')).toHaveTextContent(
      "Failed",
    );
  });

  it("dismissAll clears queued entries as well as visible notifications", async () => {
    vi.useFakeTimers();
    setup({ maxVisible: 1 });
    act(() => {
      controller.notify({ message: "First", duration: null });
      controller.notify({ message: "Queued", duration: null });
    });
    act(() => controller.dismissAll());
    await tick(200);
    expect(message("First")).not.toBeInTheDocument();
    expect(message("Queued")).not.toBeInTheDocument();
  });

  it("rejects invalid durations and empty messages rather than creating inaccessible toasts", () => {
    setup();
    expect(() => controller.notify({ message: " " })).toThrow();
    expect(() =>
      controller.notify({ message: "Saved", duration: -1 }),
    ).toThrow();
    expect(() =>
      controller.notify({ message: "Saved", duration: Infinity }),
    ).toThrow();
  });

  it("has no representative automated accessibility violations", async () => {
    setup();
    act(() => {
      controller.notify({ message: "Saved", duration: null });
    });
    expect(
      (
        await axe(document.body, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toHaveLength(0);
  });
});
