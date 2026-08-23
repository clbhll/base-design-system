import ReactDOM from "react-dom/client";

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
import "@calebhill/base/styles.css";

const buttonProps = { type: "button" } satisfies ButtonProps;
const buttonLinkProps = { target: "_self" } satisfies ButtonLinkProps;
const buttonSize = "default" satisfies ButtonSize;
const buttonVariant = "primary" satisfies ButtonVariant;
const dialogSize = "compact" satisfies DialogSize;
const dialogProps = {
  onOpenChange: () => undefined,
  open: false,
  size: dialogSize,
} satisfies Omit<DialogProps, "children">;
const dialogHeadingProps = { title: "Fixture dialog" } satisfies DialogHeadingProps;
const dialogFooterProps = { className: "fixture-footer" } satisfies DialogFooterProps;
const theme: BaseTheme = isBaseTheme("light") ? "light" : "dark";
const textInputProps: TextInputProps = {
  "aria-label": "Caption",
  error: "Caption is required",
};
const progressBarProps: ProgressBarProps = {
  "aria-label": "Upload progress",
  value: 45,
};

function FixtureApp() {
  return (
    <section id="fixture" className="base-type-body" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      <Button {...buttonProps} data-fixture="button" size={buttonSize} variant={buttonVariant}>
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
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<FixtureApp />);
