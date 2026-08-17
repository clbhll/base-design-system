import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { ProgressBar, TextInput } from "../../src";

const inputRef = createRef<HTMLInputElement>();
const progressRef = createRef<HTMLDivElement>();

const nativeInput = (
  <TextInput
    aria-label="Email"
    autoComplete="email"
    error="Email is required"
    name="email"
    ref={inputRef}
    required
    type="email"
  />
);

const labelNamed = (
  <ProgressBar
    aria-valuetext="Half complete"
    data-upload-id="photo-1"
    label="Upload"
    ref={progressRef}
    value={50}
  />
);
const ariaLabelNamed = <ProgressBar aria-label="Upload" value={50} />;
const ariaLabelledbyNamed = <ProgressBar aria-labelledby="upload-label" value={50} />;

// @ts-expect-error ProgressBar requires exactly one accessible-name route
const unnamed = <ProgressBar value={50} />;

// @ts-expect-error label and aria-label are mutually exclusive
const doubleNamed = <ProgressBar value={50} label="Upload" aria-label="Upload" />;

// @ts-expect-error children are owned by ProgressBar
const withChildren = <ProgressBar value={50} label="Upload">Not allowed</ProgressBar>;

// @ts-expect-error aria-valuenow is owned by ProgressBar
const withValueNow = <ProgressBar value={50} label="Upload" aria-valuenow={20} />;

describe("primitive type contracts", () => {
  it("accepts native props and exactly one ProgressBar naming route", () => {
    expect([
      nativeInput,
      labelNamed,
      ariaLabelNamed,
      ariaLabelledbyNamed,
      unnamed,
      doubleNamed,
      withChildren,
      withValueNow,
    ]).toHaveLength(8);
  });
});
