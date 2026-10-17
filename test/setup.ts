import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";

// jsdom implements <dialog> without its modal methods; model the open state and close event.
if (!("showModal" in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.open = true;
    },
    close(this: HTMLDialogElement) {
      if (!this.open) return;
      this.open = false;
      this.dispatchEvent(new Event("close"));
    },
  });
}
