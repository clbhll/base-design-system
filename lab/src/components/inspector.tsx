import type { LabComponentDocs } from "../catalog-types";
import { AccessibilityNotes } from "./accessibility-notes";
import { CodeSample } from "./code-sample";
import { InspectorSection } from "./inspector-section";
import { PropsTable } from "./props-table";

export function Inspector({ docs }: { docs: LabComponentDocs }) {
  return (
    <aside aria-label="Inspector" className="lab-inspector">
      <p className="lab-inspector-summary base-type-body-sm">{docs.summary}</p>
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
    </aside>
  );
}
