import { ProgressBar } from "@calebhill/base";

import type { LabComponentDocs } from "../catalog-types";

export const progressBarDocs: LabComponentDocs = {
  title: "Progress Bar",
  status: "beta",
  summary:
    "A determinate progress indicator that normalizes values to the inclusive zero-to-one-hundred range.",
  importStatement: 'import { ProgressBar } from "@calebhill/base";',
  example: '<ProgressBar label="Upload progress" value={45} />',
  props: [
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
  ],
  accessibility: [
    "Exposes determinate progressbar semantics with minimum, maximum, and current values.",
    "The type contract requires exactly one accessible-name route.",
    "The visual fill transform does not affect layout.",
    "Reduced motion removes the fill transition.",
  ],
};

export function ProgressBarSpecimens() {
  return (
    <div className="lab-progress-list">
      <ProgressBar label="Upload start" value={0} />
      <ProgressBar label="Upload progress" value={45} />
      <ProgressBar label="Upload complete" value={100} />
    </div>
  );
}
