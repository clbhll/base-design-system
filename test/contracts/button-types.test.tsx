import { createRef } from "react";
import { describe, expect, it } from "vitest";

import {
  Button,
  ButtonLink,
  MoreIcon,
  TrashIcon,
  type ButtonLinkProps,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
} from "../../src";

const variant: ButtonVariant = "text-accent";
const size: ButtonSize = "icon";
const buttonRef = createRef<HTMLButtonElement>();
const linkRef = createRef<HTMLAnchorElement>();
const onButtonClick: NonNullable<ButtonProps["onClick"]> = (event) => event.currentTarget.focus();
const onLinkClick: NonNullable<ButtonLinkProps["onClick"]> = (event) => event.currentTarget.focus();

const nativeButton = (
  <Button data-action="save" form="editor" onClick={onButtonClick} ref={buttonRef} variant={variant}>
    Save
  </Button>
);
const labeledIconButton = (
  <Button aria-label="More actions" size={size}>
    <MoreIcon />
  </Button>
);
const nativeLink = (
  <ButtonLink href="#details" onClick={onLinkClick} ref={linkRef} target="_blank">
    Details
  </ButtonLink>
);
const labeledIconLink = (
  <ButtonLink aria-label="Delete item" href="#delete" size="icon">
    <TrashIcon />
  </ButtonLink>
);

// @ts-expect-error icon Button requires aria-label
const unnamedButton = <Button size="icon"><MoreIcon /></Button>;

// @ts-expect-error icon ButtonLink requires aria-label
const unnamedLink = <ButtonLink href="#x" size="icon"><MoreIcon /></ButtonLink>;

// @ts-expect-error ButtonLink deliberately does not expose disabled
const disabledLink = <ButtonLink href="#x" disabled>Unavailable</ButtonLink>;

void nativeButton;
void labeledIconButton;
void nativeLink;
void labeledIconLink;
void unnamedButton;
void unnamedLink;
void disabledLink;

describe("button public types", () => {
  it("accepts valid native and labeled icon examples", () => {
    expect([nativeButton, labeledIconButton, nativeLink, labeledIconLink]).toHaveLength(4);
  });
});
