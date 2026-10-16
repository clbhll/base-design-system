import { Button, MoreIcon, TrashIcon, type ButtonVariant } from "@calebhill/base";

import type { LabComponentDocs } from "../catalog-types";

export const buttonVariants = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["subtle", "Subtle"],
  ["destructive", "Destructive"],
  ["text", "Text"],
  ["text-accent", "Text accent"],
] as const satisfies ReadonlyArray<readonly [ButtonVariant, string]>;

export const buttonDocs: LabComponentDocs = {
  title: "Button",
  status: "beta",
  summary: "A native button with semantic variants, two sizes, and Base-owned interaction states.",
  importStatement: 'import { Button, MoreIcon, TrashIcon } from "@calebhill/base";',
  example: '<Button variant="primary">Primary</Button>',
  props: [
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
  ],
  accessibility: [
    "Renders a native button and defaults its type to button.",
    "Icon-size controls require an accessible label at the TypeScript boundary.",
    "Disabled behavior uses the native disabled attribute.",
    "Focus remains visible in both themes.",
    "Reduced motion removes spatial press feedback while preserving state.",
  ],
};

export function ButtonDefaultSpecimens() {
  return (
    <div className="lab-specimen-row">
      {buttonVariants.map(([variant, label]) => (
        <Button data-lab-variant={variant} key={variant} variant={variant}>
          {label}
        </Button>
      ))}
    </div>
  );
}

export function ButtonIconSpecimens() {
  return (
    <div className="lab-specimen-row">
      <Button aria-label="More actions" size="icon" variant="subtle">
        <MoreIcon />
      </Button>
      <Button aria-label="Delete item" size="icon" variant="destructive">
        <TrashIcon />
      </Button>
    </div>
  );
}

export function ButtonDisabledSpecimens() {
  return (
    <div className="lab-specimen-row">
      <Button disabled>Unavailable action</Button>
    </div>
  );
}
