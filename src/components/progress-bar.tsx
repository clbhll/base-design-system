import { forwardRef, type HTMLAttributes } from "react";

type ProgressBarElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "aria-label"
  | "aria-labelledby"
  | "aria-valuemax"
  | "aria-valuemin"
  | "aria-valuenow"
  | "children"
  | "role"
>;

type ProgressBarName =
  | {
      label: string;
      "aria-label"?: never;
      "aria-labelledby"?: never;
    }
  | {
      label?: never;
      "aria-label": string;
      "aria-labelledby"?: never;
    }
  | {
      label?: never;
      "aria-label"?: never;
      "aria-labelledby": string;
    };

export type ProgressBarProps = ProgressBarElementProps &
  ProgressBarName & {
    "aria-valuemax"?: never;
    "aria-valuemin"?: never;
    "aria-valuenow"?: never;
    value: number;
  };

function normalizeProgressValue(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, value));
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    label,
    value,
    ...props
  },
  ref,
) {
  const normalizedValue = normalizeProgressValue(value);

  return (
    <div
      {...props}
      aria-label={label ?? ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={normalizedValue}
      className={["base-progress-bar", className].filter(Boolean).join(" ")}
      ref={ref}
      role="progressbar"
    >
      <span
        aria-hidden="true"
        className="base-progress-bar-fill"
        style={{ transform: `scaleX(${normalizedValue / 100})` }}
      />
    </div>
  );
});
