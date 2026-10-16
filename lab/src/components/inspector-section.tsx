import type { ReactNode } from "react";

export function InspectorSection({ children, title }: { title: string; children: ReactNode }) {
  return (
    <section className="lab-inspector-section">
      <h3 className="lab-inspector-section-title base-type-mono">{title}</h3>
      {children}
    </section>
  );
}
