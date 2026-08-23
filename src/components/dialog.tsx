"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { easingConfigs } from "@calebhill/animations";
import { motion, useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";

const dialogEase = `cubic-bezier(${easingConfigs.general.ease!.join(", ")})`;
const dialogLayoutDuration = 0.22;

type DialogStyle = CSSProperties & { "--base-dialog-ease": string };

export type DialogSize = "compact" | "wide";

export type DialogProps = Omit<
  ComponentPropsWithoutRef<"div">,
  | "aria-modal"
  | "children"
  | "defaultOpen"
  | "inert"
  | "onAnimationEnd"
  | "onAnimationEndCapture"
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
    style,
    ...surfaceProps
  },
  ref,
) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const exitCompletedRef = useRef(false);
  const hasOpenedRef = useRef(false);
  const entryFocusRef = useRef<HTMLElement>(null);
  const previousOpenRef = useRef(open);
  const restoreFocusRef = useRef<HTMLElement>(null);
  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  const shouldLayout = _layoutDependency !== undefined && !reduceMotion;
  const animationStyle: DialogStyle = {
    "--base-dialog-ease": dialogEase,
  };
  const dialogStyle: DialogStyle = {
    ...style,
    ...animationStyle,
  };

  const completeExit = useCallback(() => {
    if (open || exitCompletedRef.current) return;
    exitCompletedRef.current = true;
    _onExitComplete?.();
  }, [_onExitComplete, open]);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      return;
    }
    if (!hasOpenedRef.current) return;

    let content: HTMLDivElement | null = null;
    let disposed = false;

    const handleAnimationComplete = (event: AnimationEvent) => {
      if (event.target === content) completeExit();
    };

    queueMicrotask(() => {
      if (disposed) return;
      content = contentRef.current;
      if (!content?.isConnected) {
        completeExit();
        return;
      }
      content.addEventListener("animationend", handleAnimationComplete);
      content.addEventListener("animationcancel", handleAnimationComplete);
    });

    return () => {
      disposed = true;
      content?.removeEventListener("animationend", handleAnimationComplete);
      content?.removeEventListener("animationcancel", handleAnimationComplete);
    };
  }, [completeExit, open]);

  useEffect(() => {
    if (open) return;

    const target = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;
    if (!open || wasOpen) return;

    queueMicrotask(() => {
      const content = contentRef.current;
      const activeElement = document.activeElement;
      if (!content?.isConnected || content.contains(activeElement)) return;

      restoreFocusRef.current =
        activeElement instanceof HTMLElement && activeElement !== document.body
          ? activeElement
          : null;
      const initialTarget =
        _initialFocusRef?.current?.isConnected &&
        content.contains(_initialFocusRef.current)
          ? _initialFocusRef.current
          : null;
      const previousTarget =
        entryFocusRef.current?.isConnected && content.contains(entryFocusRef.current)
          ? entryFocusRef.current
          : null;
      const target = initialTarget ?? previousTarget ?? content;
      target.focus({ preventScroll: true });
    });
  }, [_initialFocusRef, open]);

  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal container={portalContainer ?? undefined}>
        <DialogPrimitive.Overlay
          className={["base-dialog-overlay", overlayClassName]
            .filter(Boolean)
            .join(" ")}
          style={animationStyle}
        />
        <DialogPrimitive.Content
          {...surfaceProps}
          ref={setContentRef}
          aria-modal="true"
          inert={open ? undefined : true}
          className={[
            "base-dialog",
            `base-dialog-${size}`,
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          style={dialogStyle}
          onOpenAutoFocus={(event) => {
            exitCompletedRef.current = false;
            const activeElement = document.activeElement;
            restoreFocusRef.current =
              activeElement instanceof HTMLElement && activeElement !== document.body
                ? activeElement
                : null;

            queueMicrotask(() => {
              const entryFocus = document.activeElement;
              if (
                entryFocus instanceof HTMLElement &&
                contentRef.current?.contains(entryFocus)
              ) {
                entryFocusRef.current = entryFocus;
              }
            });

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
          <motion.div
            className="base-dialog-layout"
            layout={shouldLayout ? "size" : false}
            layoutDependency={_layoutDependency}
            transition={
              shouldLayout
                ? {
                    layout: {
                      duration: dialogLayoutDuration,
                      ease: easingConfigs.general.ease,
                    },
                  }
                : undefined
            }
          >
            {children}
          </motion.div>
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
