"use client";

import {
  BASE_THEME_ATTRIBUTE,
  Button,
  ButtonLink,
  Dialog,
  DialogFooter,
  DialogHeading,
  MoreIcon,
  ProgressBar,
  TextInput,
  TrashIcon,
  isBaseTheme,
  type BaseTheme,
  type ButtonLinkProps,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  type DialogFooterProps,
  type DialogHeadingProps,
  type DialogProps,
  type DialogSize,
  type ProgressBarProps,
  type TextInputProps,
} from "@calebhill/base";

const buttonProps = { type: "button" } satisfies ButtonProps;
const buttonLinkProps = { target: "_self" } satisfies ButtonLinkProps;
const buttonSize = "default" satisfies ButtonSize;
const buttonVariant = "primary" satisfies ButtonVariant;
const dialogSize = "wide" satisfies DialogSize;
const dialogProps = {
  onOpenChange: (_open: boolean) => undefined,
  open: false,
  size: dialogSize,
} satisfies Omit<DialogProps, "children">;
const dialogHeadingProps = { title: "Fixture dialog" } satisfies DialogHeadingProps;
const dialogFooterProps = { className: "fixture-footer" } satisfies DialogFooterProps;
const theme: BaseTheme = isBaseTheme("dark") ? "dark" : "light";
const textInputProps: TextInputProps = {
  "aria-label": "Caption",
  error: "Caption is required",
};
const progressBarProps: ProgressBarProps = {
  "aria-label": "Upload progress",
  value: 45,
};

export default function Page() {
  return (
    <main id="fixture" className="base-type-body" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      <Button {...buttonProps} size={buttonSize} variant={buttonVariant}>
        Save
      </Button>
      <ButtonLink {...buttonLinkProps} href="#fixture">Button link</ButtonLink>
      <Button aria-label="More" size="icon">
        <MoreIcon />
      </Button>
      <Button aria-label="Delete" size="icon" variant="destructive">
        <TrashIcon />
      </Button>
      <TextInput {...textInputProps} />
      <ProgressBar {...progressBarProps} />
      <Dialog {...dialogProps}>
        <DialogHeading {...dialogHeadingProps} />
        <DialogFooter {...dialogFooterProps}>
          <Button>Close</Button>
        </DialogFooter>
      </Dialog>
    </main>
  );
}
