import { ButtonLink, MoreIcon } from "@calebhill/base";

import type { LabComponentDocs } from "../catalog-types";
import { buttonVariants } from "./button";

const destination = "#/actions/button-link";

export const buttonLinkDocs: LabComponentDocs = {
  title: "Button Link",
  status: "beta",
  summary: "A native anchor with Button's visual variants and no disabled-anchor contract.",
  importStatement: 'import { ButtonLink, MoreIcon } from "@calebhill/base";',
  example: '<ButtonLink href="/account">Account</ButtonLink>',
  props: [
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
  ],
  accessibility: [
    "Renders a native anchor and preserves native link behavior.",
    "Icon-size links require an accessible label at the TypeScript boundary.",
    "Base does not expose disabled or aria-disabled anchor props.",
    "Focus remains visible in both themes.",
    "Reduced motion removes spatial press feedback while preserving state.",
  ],
};

export function ButtonLinkSpecimens() {
  return (
    <div className="lab-specimen-row">
      {buttonVariants.map(([variant, label]) => (
        <ButtonLink href={destination} key={variant} variant={variant}>
          {label}
        </ButtonLink>
      ))}
      <ButtonLink aria-label="More destinations" href={destination} size="icon" variant="subtle">
        <MoreIcon />
      </ButtonLink>
    </div>
  );
}

export function ButtonLinkPreview() {
  return (
    <div className="lab-specimen-row">
      <ButtonLink href={destination}>Account</ButtonLink>
      <ButtonLink href={destination} variant="text-accent">
        Learn more
      </ButtonLink>
    </div>
  );
}
