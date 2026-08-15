export const BASE_THEME_ATTRIBUTE = "data-base-theme";

export type BaseTheme = "light" | "dark";

export function isBaseTheme(value: string): value is BaseTheme {
  return value === "light" || value === "dark";
}
