import { TextInput, type BaseTheme } from "@calebhill/base";
import { useState } from "react";

import { AccessibilityNotes } from "../components/accessibility-notes";
import { CodeSample } from "../components/code-sample";
import { DocumentHeader } from "../components/document-header";
import { PropsTable } from "../components/props-table";
import { Specimen } from "../components/specimen";

export function TextInputDocument() {
  const [theme, setTheme] = useState<BaseTheme>("light");

  return (
    <article className="lab-component-document">
      <DocumentHeader
        importStatement={'import { TextInput } from "@calebhill/base";'}
        status="beta"
        summary="A native text input with Base-owned presentation and accessible error association."
        title="Text Input"
      />
      <Specimen onThemeChange={setTheme} theme={theme} title="States">
        <div className="lab-input-grid">
          <TextInput aria-label="Default input" placeholder="Default input" />
          <TextInput aria-label="Filled input" defaultValue="A filled value" />
          <TextInput aria-label="Disabled input" disabled placeholder="Disabled input" />
          <TextInput aria-label="Error input" error="This field needs attention." />
        </div>
      </Specimen>
      <CodeSample
        code={'<TextInput aria-label="Email" error="Enter a valid email address." />'}
      />
      <PropsTable
        props={[
          {
            name: "error",
            type: "string",
            description: "Renders and associates an alert message with the input.",
          },
          {
            name: "aria-describedby",
            type: "string",
            description: "Composes consumer description IDs with the generated error ID.",
          },
          {
            name: "disabled",
            type: "boolean",
            defaultValue: "false",
            description: "Uses the native input disabled attribute and behavior.",
          },
          {
            name: "className",
            type: "string",
            description: "Applies to the operative native input.",
          },
          {
            name: "ref",
            type: "Ref<HTMLInputElement>",
            description: "Forwards to the operative native input.",
          },
        ]}
      />
      <AccessibilityNotes>
        <li>Preserves native input attributes, events, names, types, and autocomplete behavior.</li>
        <li>An error sets aria-invalid and appends its ID to aria-describedby.</li>
        <li>Error text uses alert semantics for announcement.</li>
        <li>Focus remains visible and disabled behavior stays native.</li>
      </AccessibilityNotes>
    </article>
  );
}
