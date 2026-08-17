import { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Message shown below the field and associated with it as an error. */
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    className,
    error,
    ...props
  },
  ref,
) {
  const errorId = useId();
  const hasError = Boolean(error);
  const descriptionIds = [
    ...(describedBy?.split(/\s+/).filter(Boolean) ?? []),
    ...(hasError ? [errorId] : []),
  ];

  return (
    <div className="base-text-input">
      <input
        {...props}
        aria-describedby={descriptionIds.length > 0 ? descriptionIds.join(" ") : undefined}
        aria-invalid={hasError ? true : invalid}
        className={[
          "base-text-input-field",
          "base-type-input",
          "base-focus-ring",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        ref={ref}
      />
      {hasError ? (
        <p
          className="base-text-input-error base-type-caption"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
});
