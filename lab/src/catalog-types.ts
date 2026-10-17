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
  id: string;
  label: string;
  Specimens: ComponentType;
}

export interface LabComponent {
  /** URL segment, unique across the whole canvas so legacy component URLs resolve. */
  id: string;
  /** One-line anatomy summary shown on the grid card. */
  caption: string;
  docs: LabComponentDocs;
  /** Small live rendering for the grid card; shown inert and hidden from assistive technology. */
  Preview: ComponentType;
  bands: ReadonlyArray<LabBand>;
}

export interface LabCategory {
  id: string;
  label: string;
  components: ReadonlyArray<LabComponent>;
}
