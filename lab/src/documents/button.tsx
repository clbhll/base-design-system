import {
  Button,
  MoreIcon,
  TrashIcon,
  type BaseTheme,
  type ButtonVariant,
} from "@calebhill/base";
import { useState } from "react";

import { AccessibilityNotes } from "../components/accessibility-notes";
import { CodeSample } from "../components/code-sample";
import { DocumentHeader } from "../components/document-header";
import { PropsTable } from "../components/props-table";
import { Specimen } from "../components/specimen";

const buttonVariants = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["subtle", "Subtle"],
  ["destructive", "Destructive"],
  ["text", "Text"],
  ["text-accent", "Text accent"],
] as const satisfies ReadonlyArray<readonly [ButtonVariant, string]>;

export function ButtonDocument() {
  const [theme, setTheme] = useState<BaseTheme>("light");

  return (
    <article className="lab-component-document">
      <DocumentHeader
        importStatement={'import { Button } from "@calebhill/base";'}
        status="beta"
        summary="A native button with semantic variants, two sizes, and Base-owned interaction states."
        title="Button"
      />
      <Specimen onThemeChange={setTheme} theme={theme} title="Variants and states">
        <div className="lab-component-grid">
          {buttonVariants.map(([variant, label]) => (
            <Button data-lab-variant={variant} key={variant} variant={variant}>
              {label}
            </Button>
          ))}
          <Button aria-label="More actions" size="icon" variant="subtle">
            <MoreIcon />
          </Button>
          <Button aria-label="Delete item" size="icon" variant="destructive">
            <TrashIcon />
          </Button>
          <Button disabled>Unavailable action</Button>
        </div>
      </Specimen>
      <CodeSample code={'<Button variant="primary">Primary</Button>'} />
      <PropsTable
        props={[
          {
            name: "variant",
            type: '"primary" | "secondary" | "subtle" | "destructive" | "text" | "text-accent"',
            defaultValue: '"primary"',
            description: "Selects the semantic visual treatment.",
          },
          {
            name: "size",
            type: '"default" | "icon"',
            defaultValue: '"default"',
            description: "Selects the standard or square icon control anatomy.",
          },
          {
            name: "aria-label",
            type: "string",
            description: "Required by the type contract when size is icon.",
          },
          {
            name: "disabled",
            type: "boolean",
            defaultValue: "false",
            description: "Uses the native button disabled attribute and behavior.",
          },
          {
            name: "className",
            type: "string",
            description: "Appends a consumer class to the package-owned classes.",
          },
          {
            name: "ref",
            type: "Ref<HTMLButtonElement>",
            description: "Forwards to the operative native button.",
          },
        ]}
      />
      <AccessibilityNotes>
        <li>Renders a native button and defaults its type to button.</li>
        <li>Icon-size controls require an accessible label at the TypeScript boundary.</li>
        <li>Disabled behavior uses the native disabled attribute.</li>
        <li>Focus remains visible in both themes.</li>
        <li>Reduced motion removes spatial press feedback while preserving state.</li>
      </AccessibilityNotes>
    </article>
  );
}
