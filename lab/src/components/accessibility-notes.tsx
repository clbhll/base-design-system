import { InspectorSection } from "./inspector-section";

export function AccessibilityNotes({ notes }: { notes: ReadonlyArray<string> }) {
  return (
    <InspectorSection title="Accessibility">
      <ul className="lab-accessibility-list base-type-body-sm">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </InspectorSection>
  );
}
