import type { ComponentType } from "react";

import { ButtonLinkDocument } from "./documents/button-link";
import { ButtonDocument } from "./documents/button";
import { FoundationsDocument } from "./documents/foundations";
import { IconsDocument } from "./documents/icons";
import { ProgressBarDocument } from "./documents/progress-bar";
import { TextInputDocument } from "./documents/text-input";

export type LabDocumentGroup = "foundations" | "components";

export interface LabDocumentDefinition {
  path: string;
  label: string;
  group: LabDocumentGroup;
  Document: ComponentType;
}

export const labDocuments = [
  {
    path: "/foundations",
    label: "Foundations",
    group: "foundations",
    Document: FoundationsDocument,
  },
  {
    path: "/components/button",
    label: "Button",
    group: "components",
    Document: ButtonDocument,
  },
  {
    path: "/components/button-link",
    label: "Button Link",
    group: "components",
    Document: ButtonLinkDocument,
  },
  {
    path: "/components/text-input",
    label: "Text Input",
    group: "components",
    Document: TextInputDocument,
  },
  {
    path: "/components/progress-bar",
    label: "Progress Bar",
    group: "components",
    Document: ProgressBarDocument,
  },
  {
    path: "/components/icons",
    label: "Icons",
    group: "components",
    Document: IconsDocument,
  },
] as const satisfies ReadonlyArray<LabDocumentDefinition>;

export const labDocumentPaths = new Set(labDocuments.map(({ path }) => path));

export function getLabDocument(path: string) {
  return labDocuments.find((document) => document.path === path) ?? labDocuments[0];
}
