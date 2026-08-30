"use client";

import {
  forwardRef,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { easingConfigs, springConfigs } from "@calebhill/animations";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { DropdownMenu } from "radix-ui";

import { Button } from "./button";

const weightedEaseOut = easingConfigs.general.ease ?? [0.22, 1, 0.36, 1];
const quickEaseOut = [0.16, 1, 0.3, 1] as const;

function surfaceVariants(reduceMotion: boolean): Variants {
  const identity = "translateY(0px) scale(1)";
  const closedTransform = reduceMotion
    ? identity
    : "translateY(4px) scale(0.95)";

  return {
    closed: {
      opacity: 0,
      transform: closedTransform,
      transition: {
        duration: 0.12,
        ease: weightedEaseOut,
        staggerChildren: reduceMotion ? 0 : 0.04,
        staggerDirection: -1,
      },
    },
    open: {
      opacity: 1,
      transform: identity,
      transition: reduceMotion
        ? { duration: 0.12, ease: weightedEaseOut }
        : {
            opacity: { duration: 0.18, ease: quickEaseOut },
            transform: springConfigs.press,
            delayChildren: 0.03,
            staggerChildren: 0.04,
          },
    },
  };
}

function itemVariants(reduceMotion: boolean): Variants {
  const identity = "translateY(0px) scale(1)";

  return {
    closed: {
      opacity: 0,
      transform: reduceMotion ? identity : "translateY(3px) scale(0.95)",
      transition: { duration: 0.12, ease: weightedEaseOut },
    },
    open: {
      opacity: 1,
      transform: identity,
      transition: reduceMotion
        ? { duration: 0.12, ease: weightedEaseOut }
        : {
            opacity: { duration: 0.18, ease: quickEaseOut },
            transform: springConfigs.press,
          },
    },
  };
}

export type ActionMenuItemTone = "default" | "destructive";
export type ActionMenuSide = "top" | "right" | "bottom" | "left";
export type ActionMenuAlign = "start" | "center" | "end";

export interface ActionMenuItem {
  label: string;
  onSelect: () => void;
  tone?: ActionMenuItemTone;
  disabled?: boolean;
}

type ActionMenuStateProps =
  | {
      open: boolean;
      defaultOpen?: never;
      onOpenChange: (open: boolean) => void;
    }
  | {
      open?: never;
      defaultOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
    };

type ActionMenuBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onSelect"
> & {
  label: string;
  icon: ReactNode;
  items: readonly ActionMenuItem[];
  disabled?: boolean;
  side?: ActionMenuSide;
  align?: ActionMenuAlign;
  sideOffset?: number;
  portalContainer?: HTMLElement | null;
  triggerClassName?: string;
  contentClassName?: string;
};

export type ActionMenuProps = ActionMenuBaseProps & ActionMenuStateProps;

export const ActionMenu = forwardRef<HTMLButtonElement, ActionMenuProps>(
  function ActionMenu(
    {
      align = "end",
      className,
      contentClassName,
      defaultOpen,
      disabled = false,
      icon,
      items,
      label,
      onOpenChange,
      open,
      portalContainer,
      side = "top",
      sideOffset = 8,
      style,
      triggerClassName,
      ...rootProps
    },
    ref,
  ) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
    const contentRef = useRef<HTMLDivElement>(null);
    const pendingSelectionRef = useRef<(() => void) | null>(null);
    const selectionCloseRequestRef = useRef(false);
    const reduceMotion = useReducedMotion() ?? false;
    const resolvedOpen = open ?? uncontrolledOpen;
    const actionMenuSurfaceVariants = surfaceVariants(reduceMotion);
    const actionMenuItemVariants = itemVariants(reduceMotion);

    function setOpen(nextOpen: boolean) {
      if (!nextOpen) {
        if (selectionCloseRequestRef.current) {
          selectionCloseRequestRef.current = false;
        } else {
          pendingSelectionRef.current = null;
        }
      }
      if (open === undefined) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    }

    return (
      <DropdownMenu.Root onOpenChange={setOpen} open={resolvedOpen}>
        <div
          {...rootProps}
          className={["base-action-menu-root", className].filter(Boolean).join(" ")}
          style={style}
        >
          <DropdownMenu.Trigger asChild>
            <Button
              ref={ref}
              aria-label={label}
              className={["base-action-menu-trigger", triggerClassName]
                .filter(Boolean)
                .join(" ")}
              disabled={disabled}
              onKeyDown={(event) => {
                if (event.key !== "ArrowUp" || resolvedOpen) return;
                event.preventDefault();
                setOpen(true);
                requestAnimationFrame(() => {
                  const enabledItems = contentRef.current?.querySelectorAll<HTMLElement>(
                    '[role="menuitem"]:not([data-disabled])',
                  );
                  enabledItems?.item(enabledItems.length - 1).focus();
                });
              }}
              size="icon"
              title={label}
              variant="text"
            >
              <span aria-hidden="true" className="base-action-menu-trigger-icon">
                {icon}
              </span>
            </Button>
          </DropdownMenu.Trigger>
        </div>
        <DropdownMenu.Portal container={portalContainer ?? undefined}>
          <DropdownMenu.Content
            asChild
            ref={contentRef}
            aria-label={label}
            align={align}
            className={["base-action-menu-content", contentClassName]
              .filter(Boolean)
              .join(" ")}
            loop
            onCloseAutoFocus={() => {
              queueMicrotask(() => {
                const selection = pendingSelectionRef.current;
                pendingSelectionRef.current = null;
                selection?.();
              });
            }}
            side={side}
            sideOffset={sideOffset}
          >
            <motion.div
              animate={resolvedOpen ? "open" : "closed"}
              initial="closed"
              variants={actionMenuSurfaceVariants}
            >
              {items.map((item) => (
                <DropdownMenu.Item
                  asChild
                  disabled={item.disabled}
                  key={item.label}
                  onSelect={() => {
                    if (pendingSelectionRef.current) return;
                    pendingSelectionRef.current = item.onSelect;
                    selectionCloseRequestRef.current = true;
                  }}
                >
                  <motion.button
                    className="base-action-menu-item"
                    data-tone={item.tone ?? "default"}
                    type="button"
                    variants={actionMenuItemVariants}
                    whileTap={
                      reduceMotion
                        ? { opacity: 0.8, transition: { duration: 0.15 } }
                        : { scale: 0.97, transition: springConfigs.press }
                    }
                  >
                    {item.label}
                  </motion.button>
                </DropdownMenu.Item>
              ))}
            </motion.div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  },
);
