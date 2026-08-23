import type { ReactNode } from "react";

export function AccessibilityNotes({ children }: { children: ReactNode }) {
  return (
    <section className="lab-document-section">
      <h2 className="base-type-heading-md">Accessibility</h2>
      <ul className="lab-accessibility-list base-type-body">{children}</ul>
    </section>
  );
}
