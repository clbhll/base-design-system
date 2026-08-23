"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";

export type DialogSize = "compact" | "wide";

export type DialogProps = Omit<
  ComponentPropsWithoutRef<"div">,
  | "aria-modal"
  | "children"
  | "defaultOpen"
  | "onAnimationEnd"
  | "role"
  | "tabIndex"
> & {
  "aria-modal"?: never;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: DialogSize;
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  layoutDependency?: boolean | number | string;
  overlayClassName?: string;
  portalContainer?: HTMLElement | null;
  onExitComplete?: () => void;
};

export type DialogHeadingProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  title: ReactNode;
  subtitle?: ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
};

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  _props,
  _ref,
) {
  return null;
});

export function DialogHeading(_props: DialogHeadingProps) {
  return null;
}

export function DialogFooter({ children, ...props }: DialogFooterProps) {
  return <div {...props}>{children}</div>;
}
