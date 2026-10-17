import { MoreIcon, TrashIcon } from "@calebhill/base";

import type { LabComponentDocs } from "../catalog-types";

export const iconDocs: LabComponentDocs = {
  title: "Icons",
  status: "beta",
  summary: "General-purpose SVG icons that inherit color and accept standard SVG props.",
  importStatement: 'import { MoreIcon, TrashIcon } from "@calebhill/base";',
  example: '<TrashIcon aria-hidden="true" />',
  props: [
    {
      name: "width / height",
      type: "SVGProps<SVGSVGElement>",
      defaultValue: "24",
      description: "Overrides the default icon dimensions through standard SVG props.",
    },
    {
      name: "color",
      type: "CSS color",
      defaultValue: "currentColor",
      description: "Icons inherit their surrounding text color.",
    },
    {
      name: "aria-*",
      type: "SVGProps<SVGSVGElement>",
      description: "Overrides the default decorative semantics for a deliberately named SVG.",
    },
  ],
  accessibility: [
    "Icons are decorative and hidden from assistive technology by default.",
    "Icon-only controls receive their accessible name from the owning control.",
    "Standard SVG props may override defaults for a deliberately standalone named SVG.",
  ],
};

export function IconSpecimens() {
  return (
    <div className="lab-icon-grid">
      <figure>
        <MoreIcon />
        <figcaption className="base-type-caption">MoreIcon</figcaption>
      </figure>
      <figure>
        <TrashIcon />
        <figcaption className="base-type-caption">TrashIcon</figcaption>
      </figure>
    </div>
  );
}

export function IconPreview() {
  return (
    <div className="lab-specimen-row lab-preview-icons">
      <MoreIcon />
      <TrashIcon />
    </div>
  );
}
