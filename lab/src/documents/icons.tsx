import { MoreIcon, TrashIcon, type BaseTheme } from "@calebhill/base";
import { useState } from "react";

import { AccessibilityNotes } from "../components/accessibility-notes";
import { CodeSample } from "../components/code-sample";
import { DocumentHeader } from "../components/document-header";
import { PropsTable } from "../components/props-table";
import { Specimen } from "../components/specimen";

export function IconsDocument() {
  const [theme, setTheme] = useState<BaseTheme>("light");

  return (
    <article className="lab-component-document">
      <DocumentHeader
        importStatement={'import { MoreIcon, TrashIcon } from "@calebhill/base";'}
        status="beta"
        summary="General-purpose SVG icons that inherit color and accept standard SVG props."
        title="Icons"
      />
      <Specimen onThemeChange={setTheme} theme={theme} title="Current icons">
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
      </Specimen>
      <CodeSample code={'<TrashIcon aria-hidden="true" />'} />
      <PropsTable
        props={[
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
        ]}
      />
      <AccessibilityNotes>
        <li>Icons are decorative and hidden from assistive technology by default.</li>
        <li>Icon-only controls receive their accessible name from the owning control.</li>
        <li>Standard SVG props may override defaults for a deliberately standalone named SVG.</li>
      </AccessibilityNotes>
    </article>
  );
}
