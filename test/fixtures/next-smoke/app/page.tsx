"use client";

import {
  BASE_THEME_ATTRIBUTE,
  ActionMenu,
  Button,
  ButtonLink,
  Dialog,
  DialogFooter,
  DialogHeading,
  MoreIcon,
  ProgressBar,
  TextInput,
  TrashIcon,
  Toast,
  ToastProvider,
  useToast,
  type ToastAction,
  type ToastProps,
  type ToastProviderProps,
  type ToastOptions,
  type ToastController,
  type ToastPlacement,
  type ToastVariant,
  isBaseTheme,
  type BaseTheme,
  type ActionMenuAlign,
  type ActionMenuItem,
  type ActionMenuItemTone,
  type ActionMenuProps,
  type ActionMenuSide,
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

const toastAction = { label: "Undo", onClick: () => undefined } satisfies ToastAction;
const toastProps = { message: "Saved", action: toastAction } satisfies ToastProps;
const toastOptions = { message: "Fixture notification", duration: null, variant: "success" satisfies ToastVariant } satisfies ToastOptions;
function ToastFixture() {
  const controller: ToastController = useToast();
  return <><Toast {...toastProps} /><Button onClick={() => controller.notify(toastOptions)}>Notify</Button></>;
}
const toastProvider = { placement: "bottom-center" satisfies ToastPlacement, children: <ToastFixture /> } satisfies ToastProviderProps;

const buttonProps = { type: "button" } satisfies ButtonProps;
const actionMenuTone = "destructive" satisfies ActionMenuItemTone;
const actionMenuItems = [
  { label: "Edit", onSelect: () => undefined },
  { label: "Delete", onSelect: () => undefined, tone: actionMenuTone },
] satisfies readonly ActionMenuItem[];
const actionMenuProps = {
  align: "end" satisfies ActionMenuAlign,
  icon: <MoreIcon />,
  items: actionMenuItems,
  label: "Fixture options",
  side: "top" satisfies ActionMenuSide,
} satisfies ActionMenuProps;
const buttonLinkProps = { target: "_self" } satisfies ButtonLinkProps;
const buttonSize = "default" satisfies ButtonSize;
const buttonVariant = "primary" satisfies ButtonVariant;
const dialogSize = "wide" satisfies DialogSize;
const dialogProps = {
  onOpenChange: () => undefined,
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
      <ActionMenu {...actionMenuProps} />
      <TextInput {...textInputProps} />
      <ProgressBar {...progressBarProps} />
      <ToastProvider {...toastProvider} />
      <Dialog {...dialogProps}>
        <DialogHeading {...dialogHeadingProps} />
        <DialogFooter {...dialogFooterProps}>
          <Button>Close</Button>
        </DialogFooter>
      </Dialog>
    </main>
  );
}
