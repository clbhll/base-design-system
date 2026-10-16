import { useState } from "react";

import type { LabComponentDocs } from "../catalog-types";
import { AccessibilityNotes } from "./accessibility-notes";
import { CodeSample } from "./code-sample";
import { InspectorSection } from "./inspector-section";
import { PropsTable } from "./props-table";
import { StatusTag } from "./status-tag";

export function Inspector({ docs }: { docs: LabComponentDocs }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Inspector" className="lab-inspector">
      <button
        aria-controls="lab-inspector-body"
        aria-expanded={expanded}
        className="lab-inspector-handle base-focus-ring base-type-caption"
        onClick={() => setExpanded((open) => !open)}
        type="button"
      >
        Component details
      </button>
      <div className="lab-inspector-body" data-expanded={expanded} id="lab-inspector-body">
        <div className="lab-inspector-header">
          <p className="lab-inspector-eyebrow base-type-mono">Inspector</p>
          <div className="lab-inspector-title-row">
            <h2 className="base-type-heading-md">{docs.title}</h2>
            {docs.status ? <StatusTag status={docs.status} /> : null}
          </div>
          <p className="base-type-body-sm">{docs.summary}</p>
        </div>
        {docs.importStatement ? (
          <InspectorSection title="Import">
            <CodeSample code={docs.importStatement} />
          </InspectorSection>
        ) : null}
        {docs.example ? (
          <InspectorSection title="Example">
            <CodeSample code={docs.example} />
          </InspectorSection>
        ) : null}
        {docs.props ? <PropsTable props={docs.props} /> : null}
        {docs.accessibility ? <AccessibilityNotes notes={docs.accessibility} /> : null}
      </div>
    </aside>
  );
}

