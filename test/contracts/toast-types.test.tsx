import { createRef } from "react";
import { describe, expect, it } from "vitest";
import {
  Toast,
  ToastProvider,
  type ToastOptions,
  type ToastPlacement,
  type ToastVariant,
} from "../../src";

const surface = (
  <Toast
    ref={createRef<HTMLDivElement>()}
    message="Saved"
    action={{ label: "Undo", onClick: () => undefined }}
  />
);
const provider = (
  <ToastProvider
    placement={"bottom-center" satisfies ToastPlacement}
    duration={null}
  >
    <span />
  </ToastProvider>
);
const options = {
  message: "Saved",
  duration: null,
  variant: "success" satisfies ToastVariant,
} satisfies ToastOptions;
// @ts-expect-error Toast messages are one text string
const richMessage = <Toast message={<strong>Saved</strong>} />;
const shape = (
  <Toast
    message="Saved"
    // @ts-expect-error The nested Base Button's shape is not a Toast option
    action={{ label: "Undo", onClick: () => undefined, shape: "squircle" }}
  />
);
// @ts-expect-error An action must have a callback
const noCallback = <Toast message="Saved" action={{ label: "Undo" }} />;
void richMessage;
void shape;
void noCallback;
describe("Toast types", () => {
  it("accepts the documented surface, provider and notification contract", () => {
    expect([surface, provider, options]).toHaveLength(3);
  });
});
