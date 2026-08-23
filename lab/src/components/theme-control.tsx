import type { BaseTheme } from "@calebhill/base";

export function ThemeControl({
  onChange,
  theme,
}: {
  theme: BaseTheme;
  onChange: (theme: BaseTheme) => void;
}) {
  return (
    <div aria-label="Preview theme" className="lab-theme-control" role="group">
      {(["light", "dark"] as const).map((option) => (
        <button
          aria-pressed={theme === option}
          className="lab-theme-button base-focus-ring base-type-caption"
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}
