import { ProgressBar, type BaseTheme } from "@calebhill/base";
import { useState } from "react";

import { AccessibilityNotes } from "../components/accessibility-notes";
import { CodeSample } from "../components/code-sample";
import { DocumentHeader } from "../components/document-header";
import { PropsTable } from "../components/props-table";
import { Specimen } from "../components/specimen";

export function ProgressBarDocument() {
  const [theme, setTheme] = useState<BaseTheme>("light");

  return (
    <article className="lab-component-document">
      <DocumentHeader
        importStatement={'import { ProgressBar } from "@calebhill/base";'}
        status="beta"
        summary="A determinate progress indicator that normalizes values to the inclusive zero-to-one-hundred range."
        title="Progress Bar"
      />
      <Specimen onThemeChange={setTheme} theme={theme} title="Progress states">
        <div className="lab-progress-list">
          <ProgressBar label="Upload start" value={0} />
          <ProgressBar label="Upload progress" value={45} />
          <ProgressBar label="Upload complete" value={100} />
        </div>
      </Specimen>
      <CodeSample code={'<ProgressBar label="Upload progress" value={45} />'} />
      <PropsTable
        props={[
          {
            name: "value",
            type: "number",
            description: "Clamps finite values to 0–100 and normalizes non-finite values to 0.",
          },
          {
            name: "label",
            type: "string",
            description: "One mutually exclusive route for the accessible name.",
          },
          {
            name: "aria-label",
            type: "string",
            description: "An alternative mutually exclusive accessible-name route.",
          },
          {
            name: "aria-labelledby",
            type: "string",
            description: "Associates external label text as the accessible name.",
          },
          {
            name: "aria-valuetext",
            type: "string",
            description: "Provides a formatted value announcement when needed.",
          },
          {
            name: "ref",
            type: "Ref<HTMLDivElement>",
            description: "Forwards to the operative progress element.",
          },
        ]}
      />
      <AccessibilityNotes>
        <li>Exposes determinate progressbar semantics with minimum, maximum, and current values.</li>
        <li>The type contract requires exactly one accessible-name route.</li>
        <li>The visual fill transform does not affect layout.</li>
        <li>Reduced motion removes the fill transition.</li>
      </AccessibilityNotes>
    </article>
  );
}
