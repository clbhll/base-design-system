"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { motion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";

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
  "children" | "title"
> & {
  title: ReactNode;
  subtitle?: ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
};

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  {
    children,
    className,
    dismissOnBackdrop: _dismissOnBackdrop = true,
    dismissOnEscape: _dismissOnEscape = true,
    initialFocusRef: _initialFocusRef,
    layoutDependency: _layoutDependency,
    onExitComplete: _onExitComplete,
    onOpenChange,
    open,
    overlayClassName,
    portalContainer,
    size = "compact",
    ...surfaceProps
  },
  ref,
) {
  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal container={portalContainer ?? undefined}>
        <DialogPrimitive.Overlay
          className={["base-dialog-overlay", overlayClassName].filter(Boolean).join(" ")}
        />
        <DialogPrimitive.Content
          {...surfaceProps}
          ref={ref}
          aria-modal="true"
          className={[
            "base-dialog",
            `base-dialog-${size}`,
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <motion.div className="base-dialog-layout">{children}</motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

export function DialogHeading({
  className,
  subtitle,
  subtitleClassName,
  title,
  titleClassName,
  ...props
}: DialogHeadingProps) {
  return (
    <div
      {...props}
      className={["base-dialog-heading", className].filter(Boolean).join(" ")}
    >
      <DialogPrimitive.Title asChild>
        <h2
          className={["base-dialog-title", titleClassName].filter(Boolean).join(" ")}
        >
          {title}
        </h2>
      </DialogPrimitive.Title>
      {subtitle === undefined ? null : (
        <DialogPrimitive.Description asChild>
          <p
            className={["base-dialog-subtitle", subtitleClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {subtitle}
          </p>
        </DialogPrimitive.Description>
      )}
    </div>
  );
}

export function DialogFooter({ children, className, ...props }: DialogFooterProps) {
  return (
    <div
      {...props}
      className={["base-dialog-footer", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
