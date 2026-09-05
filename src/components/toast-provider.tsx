"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { easingConfigs } from "@calebhill/animations";
import { Portal, VisuallyHidden } from "radix-ui";
import { Toast, type ToastAction } from "./toast";
import type { BaseTheme } from "../theme";

export type ToastVariant = "neutral" | "success" | "error";
export type ToastPlacement =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

export interface ToastOptions {
  message: string;
  leading?: ReactNode;
  action?: ToastAction;
  variant?: ToastVariant;
  /** Milliseconds, or null to persist until dismissed. */
  duration?: number | null;
  /** Defaults to the variant and message. Repeated live keys return the existing id. */
  dedupeKey?: string;
}

export interface ToastController {
  notify: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export interface ToastProviderProps {
  children: ReactNode;
  duration?: number | null;
  maxVisible?: number;
  placement?: ToastPlacement;
  theme?: BaseTheme;
  portalContainer?: HTMLElement | null;
  label?: string;
  viewportLabel?: string;
  dismissLabel?: string;
}

interface Entry extends ToastOptions {
  id: string;
  open: boolean;
  duration: number | null;
  dedupeKey: string;
}

function validateDuration(duration: number | null) {
  if (
    duration !== null &&
    (!Number.isFinite(duration) || duration <= 0 || duration > 2_147_483_647)
  ) {
    throw new Error(
      "Toast duration must be a positive timeout in milliseconds, or null.",
    );
  }
}

function createToastStore() {
  let entries: Entry[] = [];
  let nextId = 0;
  const listeners = new Set<() => void>();
  const update = (next: Entry[]) => {
    entries = next;
    listeners.forEach((listener) => listener());
  };
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => entries,
    notify: (options: ToastOptions & { duration: number | null }) => {
      validateDuration(options.duration);
      if (!options.message.trim())
        throw new Error("Toast message must not be empty.");
      if (options.action && !options.action.label.trim())
        throw new Error("Toast action label must not be empty.");
      const dedupeKey =
        options.dedupeKey ??
        JSON.stringify([options.variant ?? "neutral", options.message]);
      const existing = entries.find(
        (entry) => entry.open && entry.dedupeKey === dedupeKey,
      );
      if (existing) return existing.id;
      const id = `toast-${++nextId}`;
      update([...entries, { ...options, id, open: true, dedupeKey }]);
      return id;
    },
    dismiss: (id: string) => {
      update(
        entries.map((entry) =>
          entry.id === id ? { ...entry, open: false } : entry,
        ),
      );
    },
    dismissAll: () => {
      update([]);
    },
    remove: (id: string) => {
      update(entries.filter((entry) => entry.id !== id));
    },
  };
}

const ToastContext = createContext<ToastController | null>(null);

export function useToast(): ToastController {
  const controller = useContext(ToastContext);
  if (!controller)
    throw new Error("useToast must be used within ToastProvider.");
  return controller;
}

const animationStyle = {
  "--base-toast-ease": `cubic-bezier(${easingConfigs.general.ease!.join(", ")})`,
} as CSSProperties;

function Notification({
  entry,
  dismiss,
  remove,
  dismissLabel,
  label,
  paused,
}: {
  entry: Entry;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
  dismissLabel: string;
  label: string;
  paused: boolean;
}) {
  const remaining = useRef(entry.duration);
  const [announcement, setAnnouncement] = useState("");
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [swipe, setSwipe] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setAnnouncement(`${label}: ${entry.message}`),
      50,
    );
    return () => window.clearTimeout(timer);
  }, [entry.message, label]);

  useEffect(() => {
    if (!entry.open || paused || remaining.current === null) return;
    const started = Date.now();
    const timer = window.setTimeout(() => dismiss(entry.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current! - (Date.now() - started),
      );
    };
  }, [dismiss, entry.id, entry.open, paused]);
  useEffect(() => {
    if (entry.open) return;
    // Also release the queue slot when animations are disabled or CSS is not loaded.
    const timer = window.setTimeout(() => remove(entry.id), 200);
    return () => window.clearTimeout(timer);
  }, [entry.id, entry.open, remove]);

  const close = () => {
    dismiss(entry.id);
  };
  const action = entry.action
    ? {
        label: entry.action.label,
        onClick: () => {
          entry.action!.onClick();
          close();
        },
      }
    : entry.duration === null
      ? { label: dismissLabel, onClick: close }
      : undefined;

  /* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Notifications are keyboard destinations, not buttons; the nested action remains a native button. */
  return (
    <li
      tabIndex={0}
      className="base-toast-notification base-focus-ring"
      data-toast-id={entry.id}
      data-state={entry.open ? "open" : "closed"}
      data-variant={entry.variant ?? "neutral"}
      inert={entry.open ? undefined : true}
      data-swipe={swipe ? "move" : "cancel"}
      style={
        {
          ...animationStyle,
          "--base-toast-swipe-x": `${swipe}px`,
        } as CSSProperties
      }
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && !entry.open)
          remove(entry.id);
      }}
      onPointerDown={(event) => {
        suppressClick.current = false;
        if (event.button === 0)
          pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        const start = pointerStart.current;
        if (!start) return;
        const x = event.clientX - start.x;
        const y = event.clientY - start.y;
        if (Math.abs(y) > Math.max(10, Math.abs(x))) {
          pointerStart.current = null;
          setSwipe(0);
        } else if (x > 10 || suppressClick.current) {
          suppressClick.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          setSwipe(Math.max(0, x));
        }
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
        pointerStart.current = null;
        if (swipe >= 50) close();
        setSwipe(0);
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
        setSwipe(0);
      }}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
    >
      <VisuallyHidden.Root
        role="status"
        aria-live={entry.variant === "error" ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {entry.open ? announcement : ""}
      </VisuallyHidden.Root>
      <Toast message={entry.message} leading={entry.leading} action={action} />
    </li>
  );
  /* eslint-enable jsx-a11y/no-noninteractive-tabindex */
}

export function ToastProvider({
  children,
  duration = 5000,
  maxVisible = 3,
  placement = "bottom-center",
  theme,
  portalContainer,
  label = "Notification",
  viewportLabel = "Notifications ({hotkey})",
  dismissLabel = "Dismiss",
}: ToastProviderProps) {
  validateDuration(duration);
  if (!Number.isInteger(maxVisible) || maxVisible < 1)
    throw new Error("Toast maxVisible must be a positive integer.");
  if (!dismissLabel.trim())
    throw new Error("Toast dismissLabel must not be empty.");
  const [store] = useState(createToastStore);
  const viewport = useRef<HTMLOListElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [windowBlurred, setWindowBlurred] = useState(false);
  const entries = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const controller = useMemo<ToastController>(
    () => ({
      notify: (options) =>
        store.notify({
          ...options,
          duration:
            options.duration === undefined ? duration : options.duration,
        }),
      dismiss: (id) => {
        const node = viewport.current;
        const active = node?.ownerDocument.activeElement;
        if (
          active instanceof HTMLElement &&
          node?.contains(active) &&
          active.closest("[data-toast-id]")?.getAttribute("data-toast-id") ===
            id
        )
          node?.focus({ preventScroll: true });
        const index = store.getSnapshot().findIndex((entry) => entry.id === id);
        if (index >= maxVisible) store.remove(id);
        else store.dismiss(id);
      },
      dismissAll: () => {
        const node = viewport.current;
        if (node?.contains(node.ownerDocument.activeElement))
          node.focus({ preventScroll: true });
        store.dismissAll();
      },
    }),
    [duration, maxVisible, store],
  );

  useEffect(() => {
    const onBlur = () => setWindowBlurred(true);
    const onFocus = () => setWindowBlurred(false);
    const onKeyDown = (event: KeyboardEvent) => {
      const node = viewport.current;
      if (!node || !store.getSnapshot().some((entry) => entry.open)) return;
      if (event.key === "F8" && !event.defaultPrevented) {
        const activeDialog = node.ownerDocument.activeElement?.closest(
          '[role="dialog"], [role="alertdialog"]',
        );
        if (
          node.closest('[aria-hidden="true"], [inert]') ||
          (activeDialog && !activeDialog.contains(node))
        )
          return;
        event.preventDefault();
        node.focus();
      } else if (
        event.key === "Tab" &&
        !event.shiftKey &&
        event.target === node
      ) {
        const first = node.querySelector<HTMLElement>('[data-state="open"]');
        if (first) {
          event.preventDefault();
          first.focus();
        }
      } else if (
        event.key === "Escape" &&
        event.target instanceof HTMLElement &&
        node.contains(event.target)
      ) {
        // Handle only this viewport, before a modal's document-level Escape listener.
        event.preventDefault();
        event.stopPropagation();
        const id =
          event.target
            .closest("[data-toast-id]")
            ?.getAttribute("data-toast-id") ??
          store.getSnapshot().find((entry) => entry.open)?.id;
        if (id) controller.dismiss(id);
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [controller, store]);

  return (
    <ToastContext.Provider value={controller}>
      {children}
      <Portal.Root container={portalContainer ?? undefined}>
        <div
          data-base-theme={theme}
          role="region"
          aria-label={viewportLabel.replace("{hotkey}", "F8")}
          onPointerMove={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setFocused(false);
          }}
        >
          <ol
            ref={viewport}
            className="base-toast-viewport"
            data-placement={placement}
            tabIndex={-1}
          >
            {entries.slice(0, maxVisible).map((entry) => (
              <Notification
                key={entry.id}
                entry={entry}
                dismiss={controller.dismiss}
                remove={store.remove}
                dismissLabel={dismissLabel}
                label={label}
                paused={hovered || focused || windowBlurred}
              />
            ))}
          </ol>
        </div>
      </Portal.Root>
    </ToastContext.Provider>
  );
}
