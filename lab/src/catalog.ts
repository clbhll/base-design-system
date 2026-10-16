import { actionMenuDocs, ActionMenuSpecimens } from "./bands/action-menu";
import {
  buttonDocs,
  ButtonDefaultSpecimens,
  ButtonDisabledSpecimens,
  ButtonIconSpecimens,
} from "./bands/button";
import { buttonLinkDocs, ButtonLinkSpecimens } from "./bands/button-link";
import { dialogDocs, DialogSpecimens } from "./bands/dialog";
import {
  ColorSpecimens,
  foundationDocs,
  InteractionSpecimens,
  LinkSpecimens,
  OverrideSpecimens,
  TypographySpecimens,
} from "./bands/foundations";
import { iconDocs, IconSpecimens } from "./bands/icons";
import { progressBarDocs, ProgressBarSpecimens } from "./bands/progress-bar";
import { textInputDocs, TextInputSpecimens } from "./bands/text-input";
import { toastDocs, ToastSpecimens } from "./bands/toast";
import type { LabCategory, LabComponentDocs } from "./catalog-types";

export const labComponentDocs: Readonly<Record<string, LabComponentDocs>> = {
  ...foundationDocs,
  icons: iconDocs,
  button: buttonDocs,
  "button-link": buttonLinkDocs,
  "action-menu": actionMenuDocs,
  "text-input": textInputDocs,
  "progress-bar": progressBarDocs,
  toast: toastDocs,
  dialog: dialogDocs,
};

export const labCategories: ReadonlyArray<LabCategory> = [
  {
    id: "foundations",
    label: "Foundations",
    bands: [
      { id: "color", label: "Color", componentId: "color", Specimens: ColorSpecimens },
      {
        id: "typography",
        label: "Typography",
        componentId: "typography",
        Specimens: TypographySpecimens,
      },
      { id: "links", label: "Links", componentId: "links", Specimens: LinkSpecimens },
      {
        id: "interaction",
        label: "Focus and press",
        componentId: "interaction",
        Specimens: InteractionSpecimens,
      },
      {
        id: "override",
        label: "Consumer override",
        componentId: "override",
        Specimens: OverrideSpecimens,
      },
      { id: "icons", label: "Icons", componentId: "icons", Specimens: IconSpecimens },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    bands: [
      {
        id: "button",
        label: "Button · default size",
        componentId: "button",
        Specimens: ButtonDefaultSpecimens,
      },
      {
        id: "button-icon",
        label: "Button · icon size",
        componentId: "button",
        Specimens: ButtonIconSpecimens,
      },
      {
        id: "button-disabled",
        label: "Button · disabled",
        componentId: "button",
        Specimens: ButtonDisabledSpecimens,
      },
      {
        id: "button-link",
        label: "Button Link",
        componentId: "button-link",
        Specimens: ButtonLinkSpecimens,
      },
      {
        id: "action-menu",
        label: "ActionMenu",
        componentId: "action-menu",
        Specimens: ActionMenuSpecimens,
      },
    ],
  },
  {
    id: "inputs",
    label: "Inputs",
    bands: [
      {
        id: "text-input",
        label: "Text Input",
        componentId: "text-input",
        Specimens: TextInputSpecimens,
      },
    ],
  },
  {
    id: "feedback",
    label: "Feedback",
    bands: [
      {
        id: "progress-bar",
        label: "Progress Bar",
        componentId: "progress-bar",
        Specimens: ProgressBarSpecimens,
      },
      { id: "toast", label: "Toast", componentId: "toast", Specimens: ToastSpecimens },
    ],
  },
  {
    id: "overlays",
    label: "Overlays",
    bands: [{ id: "dialog", label: "Dialog", componentId: "dialog", Specimens: DialogSpecimens }],
  },
];

export function getLabCategory(id: string) {
  return labCategories.find((category) => category.id === id) ?? labCategories[0];
}
