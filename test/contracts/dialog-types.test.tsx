import { createRef } from "react";
import { describe, expect, it } from "vitest";

import {
  Dialog,
  DialogFooter,
  DialogHeading,
  type DialogProps,
  type DialogSize,
} from "../../src";

const dialogRef = createRef<HTMLDivElement>();
const focusRef = createRef<HTMLInputElement>();
const portal = document.createElement("div");
const size = "wide" satisfies DialogSize;
const props = {
  open: true,
  onOpenChange: () => undefined,
  size,
  dismissOnBackdrop: false,
  dismissOnEscape: false,
  initialFocusRef: focusRef,
  layoutDependency: "editing",
  portalContainer: portal,
} satisfies Omit<DialogProps, "children">;

const valid = (
  <Dialog
    {...props}
    className="consumer-dialog"
    data-track="dialog"
    ref={dialogRef}
  >
    <DialogHeading title={<span>Edit photo</span>} subtitle="Update the caption." />
    <input ref={focusRef} />
    <DialogFooter>
      <button type="button">Save</button>
    </DialogFooter>
  </Dialog>
);

const missingOpen = (
  // @ts-expect-error Dialog is controlled and requires open
  <Dialog onOpenChange={() => undefined}>
    <DialogHeading title="Title" />
  </Dialog>
);

const uncontrolled = (
  // @ts-expect-error Dialog is controlled and does not accept defaultOpen
  <Dialog defaultOpen open onOpenChange={() => undefined}>
    <DialogHeading title="Title" />
  </Dialog>
);

const customRole = (
  // @ts-expect-error role is owned by Dialog
  <Dialog open onOpenChange={() => undefined} role="alertdialog">
    <DialogHeading title="Title" />
  </Dialog>
);

const customModal = (
  // @ts-expect-error aria-modal is owned by Dialog
  <Dialog aria-modal="false" open onOpenChange={() => undefined}>
    <DialogHeading title="Title" />
  </Dialog>
);

const customAnimationEnd = (
  // @ts-expect-error exit animation completion is owned by Dialog
  <Dialog onAnimationEnd={() => undefined} open onOpenChange={() => undefined}>
    <DialogHeading title="Title" />
  </Dialog>
);

const customAnimationEndCapture = (
  // @ts-expect-error exit animation completion is owned by Dialog
  <Dialog onAnimationEndCapture={() => undefined} open onOpenChange={() => undefined}>
    <DialogHeading title="Title" />
  </Dialog>
);

describe("Dialog type contract", () => {
  it("accepts the controlled compound API and rejects package-owned props", () => {
    expect([
      valid,
      missingOpen,
      uncontrolled,
      customRole,
      customModal,
      customAnimationEnd,
      customAnimationEndCapture,
    ]).toHaveLength(7);
  });
});
