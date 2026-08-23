"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
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

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPresent, setIsPresent] = useState(open);
  const exitCompletedRef = useRef(false);
  const previousOpenRef = useRef(open);
  const restoreFocusRef = useRef<HTMLElement>(null);
  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  const shouldRender = open || isPresent;

  useEffect(() => {
    if (open) {
      exitCompletedRef.current = false;
      setIsPresent(true);
    }
  }, [open]);

  useEffect(() => {
    if (previousOpenRef.current && !open) {
      const target = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (target?.isConnected) target.focus({ preventScroll: true });
    }
    previousOpenRef.current = open;
  }, [open]);

  const completeExit = useCallback(() => {
    if (open || exitCompletedRef.current) return;
    exitCompletedRef.current = true;
    setIsPresent(false);
    _onExitComplete?.();
  }, [_onExitComplete, open]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === content) completeExit();
    };
    content.addEventListener("animationend", handleAnimationEnd);
    return () => content.removeEventListener("animationend", handleAnimationEnd);
  }, [completeExit, shouldRender]);

  return (
    <DialogPrimitive.Root modal={open} onOpenChange={onOpenChange} open={open}>
      {shouldRender ? (
        <DialogPrimitive.Portal container={portalContainer ?? undefined} forceMount>
          <DialogPrimitive.Overlay
            className={["base-dialog-overlay", overlayClassName]
              .filter(Boolean)
              .join(" ")}
            forceMount
          />
          <DialogPrimitive.Content
            {...surfaceProps}
            ref={setContentRef}
            aria-modal="true"
            className={[
              "base-dialog",
              `base-dialog-${size}`,
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            forceMount
            onOpenAutoFocus={(event) => {
              const activeElement = document.activeElement;
              restoreFocusRef.current =
                activeElement instanceof HTMLElement && activeElement !== document.body
                  ? activeElement
                  : null;

              const target = _initialFocusRef?.current;
              if (!target?.isConnected || !contentRef.current?.contains(target)) return;

              event.preventDefault();
              target.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(event) => {
              const target = restoreFocusRef.current;
              restoreFocusRef.current = null;
              if (!target?.isConnected) return;

              event.preventDefault();
              target.focus({ preventScroll: true });
            }}
            onEscapeKeyDown={(event) => {
              if (!_dismissOnEscape) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (!_dismissOnBackdrop) event.preventDefault();
            }}
          >
            <motion.div className="base-dialog-layout">{children}</motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      ) : null}
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
