import { BASE_THEME_ATTRIBUTE, type BaseTheme } from "@calebhill/base";
import type { ReactNode } from "react";

import { ThemeControl } from "./theme-control";

export function Specimen({
  children,
  onThemeChange,
  theme,
  title,
}: {
  title: string;
  theme: BaseTheme;
  onThemeChange: (theme: BaseTheme) => void;
  children: ReactNode;
}) {
  return (
    <section className="lab-document-section">
      <div className="lab-section-heading">
        <h2 className="base-type-heading-md">{title}</h2>
        <ThemeControl onChange={onThemeChange} theme={theme} />
      </div>
      <div
        className="lab-preview-surface"
        data-testid="preview-surface"
        {...{ [BASE_THEME_ATTRIBUTE]: theme }}
      >
        {children}
      </div>
    </section>
  );
}
