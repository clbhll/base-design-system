import { ButtonLink, MoreIcon, type BaseTheme, type ButtonVariant } from "@calebhill/base";
import { useState } from "react";

import { AccessibilityNotes } from "../components/accessibility-notes";
import { CodeSample } from "../components/code-sample";
import { DocumentHeader } from "../components/document-header";
import { PropsTable } from "../components/props-table";
import { Specimen } from "../components/specimen";

const buttonLinkVariants = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["subtle", "Subtle"],
  ["destructive", "Destructive"],
  ["text", "Text"],
  ["text-accent", "Text accent"],
] as const satisfies ReadonlyArray<readonly [ButtonVariant, string]>;

export function ButtonLinkDocument() {
  const [theme, setTheme] = useState<BaseTheme>("light");

  return (
    <article className="lab-component-document">
      <DocumentHeader
        importStatement={'import { ButtonLink, MoreIcon } from "@calebhill/base";'}
        status="beta"
        summary="A native anchor with Button's visual variants and no disabled-anchor contract."
        title="Button Link"
      />
      <Specimen onThemeChange={setTheme} theme={theme} title="Variants and sizes">
        <div className="lab-component-grid">
          {buttonLinkVariants.map(([variant, label]) => (
            <ButtonLink href="#/components/button-link" key={variant} variant={variant}>
              {label}
            </ButtonLink>
          ))}
          <ButtonLink
            aria-label="More destinations"
            href="#/components/button-link"
            size="icon"
            variant="subtle"
          >
            <MoreIcon />
          </ButtonLink>
        </div>
      </Specimen>
      <CodeSample code={'<ButtonLink href="/account">Account</ButtonLink>'} />
      <PropsTable
        props={[
          {
            name: "href",
            type: "string",
            description: "Sets the native anchor destination.",
          },
          {
            name: "variant",
            type: '"primary" | "secondary" | "subtle" | "destructive" | "text" | "text-accent"',
            defaultValue: '"secondary"',
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
            name: "ref",
            type: "Ref<HTMLAnchorElement>",
            description: "Forwards to the operative native anchor.",
          },
        ]}
      />
      <AccessibilityNotes>
        <li>Renders a native anchor and preserves native link behavior.</li>
        <li>Icon-size links require an accessible label at the TypeScript boundary.</li>
        <li>Base does not expose disabled or aria-disabled anchor props.</li>
        <li>Focus remains visible in both themes.</li>
        <li>Reduced motion removes spatial press feedback while preserving state.</li>
      </AccessibilityNotes>
    </article>
  );
}
