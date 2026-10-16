import { TextInput } from "@calebhill/base";

import type { LabComponentDocs } from "../catalog-types";

export const textInputDocs: LabComponentDocs = {
  title: "Text Input",
  status: "beta",
  summary: "A native text input with Base-owned presentation and accessible error association.",
  importStatement: 'import { TextInput } from "@calebhill/base";',
  example: '<TextInput aria-label="Error input" error="This field needs attention." />',
  props: [
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
  ],
  accessibility: [
    "Preserves native input attributes, events, names, types, and autocomplete behavior.",
    "An error sets aria-invalid and appends its ID to aria-describedby.",
    "Error text uses alert semantics for announcement.",
    "Focus remains visible and disabled behavior stays native.",
  ],
};

export function TextInputSpecimens() {
  return (
    <div className="lab-input-grid">
      <TextInput aria-label="Default input" placeholder="Default input" />
      <TextInput aria-label="Filled input" defaultValue="A filled value" />
      <TextInput aria-label="Disabled input" disabled placeholder="Disabled input" />
      <TextInput aria-label="Error input" error="This field needs attention." />
    </div>
  );
}
