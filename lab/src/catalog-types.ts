import type { ComponentType } from "react";

import type { PropDefinition } from "./components/props-table";
import type { LabStatus } from "./components/status-tag";

export interface LabComponentDocs {
  title: string;
  summary: string;
  status?: LabStatus;
  importStatement?: string;
  example?: string;
  props?: ReadonlyArray<PropDefinition>;
  accessibility?: ReadonlyArray<string>;
}

export interface LabBand {
  /** URL segment, unique across the whole canvas so legacy component URLs resolve. */
  id: string;
  label: string;
  componentId: string;
  Specimens: ComponentType;
}

export interface LabCategory {
  id: string;
  label: string;
  bands: ReadonlyArray<LabBand>;
}
