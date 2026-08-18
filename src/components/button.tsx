import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "destructive"
  | "text"
  | "text-accent";

export type ButtonSize = "default" | "icon";

type AccessibleSize =
  | { size: "icon"; "aria-label": string }
  | { size?: "default"; "aria-label"?: string };

interface ButtonOptions {
  variant?: ButtonVariant;
}

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> &
  ButtonOptions &
  AccessibleSize;

export type ButtonLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "aria-disabled" | "aria-label"
> &
  ButtonOptions &
  AccessibleSize;

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className: string | undefined,
) {
  return [
    "base-button",
    `base-button-${variant}`,
    `base-button-${size}`,
    "base-focus-ring",
    "base-pressable",
    "base-type-action",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    size = "default",
    type = "button",
    variant = "primary",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClassName(variant, size, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
});

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { children, className, size = "default", variant = "secondary", ...props },
  ref,
) {
  return (
    <a
      ref={ref}
      className={buttonClassName(variant, size, className)}
      {...props}
    >
      {children}
    </a>
  );
});
