"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "./button";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export type ToastProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  message: string;
  leading?: ReactNode;
  action?: ToastAction;
};

/** Visual anatomy only. ToastProvider owns announcements and notification lifecycle. */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { message, leading, action, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={["base-toast", className].filter(Boolean).join(" ")}
      data-leading={Boolean(leading)}
      data-action={Boolean(action)}
    >
      {leading ? (
        <span className="base-toast-leading" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <span className="base-toast-message base-type-body">{message}</span>
      {action ? (
        <Button variant="subtle" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
});
