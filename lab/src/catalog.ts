import { actionMenuDocs, ActionMenuPreview, ActionMenuSpecimens } from "./bands/action-menu";
import {
  buttonDocs,
  ButtonDefaultSpecimens,
  ButtonDisabledSpecimens,
  ButtonIconSpecimens,
  ButtonPreview,
} from "./bands/button";
import { buttonLinkDocs, ButtonLinkPreview, ButtonLinkSpecimens } from "./bands/button-link";
import { dialogDocs, DialogPreview, DialogSpecimens } from "./bands/dialog";
import {
  ColorPreview,
  ColorSpecimens,
  foundationDocs,
  InteractionPreview,
  InteractionSpecimens,
  LinkPreview,
  LinkSpecimens,
  OverridePreview,
  OverrideSpecimens,
  TypographyPreview,
  TypographySpecimens,
} from "./bands/foundations";
import { iconDocs, IconPreview, IconSpecimens } from "./bands/icons";
import { progressBarDocs, ProgressBarPreview, ProgressBarSpecimens } from "./bands/progress-bar";
import { textInputDocs, TextInputPreview, TextInputSpecimens } from "./bands/text-input";
import { toastDocs, ToastPreview, ToastSpecimens } from "./bands/toast";
import type { LabCategory } from "./catalog-types";

export const labCategories: ReadonlyArray<LabCategory> = [
  {
    id: "foundations",
    label: "Foundations",
    components: [
      {
        id: "color",
        caption: "4 semantic surfaces · light and dark",
        docs: foundationDocs.color,
        Preview: ColorPreview,
        bands: [{ id: "colors", label: "Semantic colors", Specimens: ColorSpecimens }],
      },
      {
        id: "typography",
        caption: "11 type roles · .base-type-*",
        docs: foundationDocs.typography,
        Preview: TypographyPreview,
        bands: [{ id: "roles", label: "Type roles", Specimens: TypographySpecimens }],
      },
      {
        id: "links",
        caption: "standard and muted · 7 surfaces",
        docs: foundationDocs.links,
        Preview: LinkPreview,
        bands: [{ id: "surfaces", label: "Link surfaces", Specimens: LinkSpecimens }],
      },
      {
        id: "interaction",
        caption: "focus ring · press feedback · mono",
        docs: foundationDocs.interaction,
        Preview: InteractionPreview,
        bands: [
          { id: "interaction", label: "Focus, press, and code", Specimens: InteractionSpecimens },
        ],
      },
      {
        id: "override",
        caption: "scoped token cascade",
        docs: foundationDocs.override,
        Preview: OverridePreview,
        bands: [{ id: "scoped", label: "Scoped override", Specimens: OverrideSpecimens }],
      },
      {
        id: "icons",
        caption: "2 icons · currentColor · decorative",
        docs: iconDocs,
        Preview: IconPreview,
        bands: [{ id: "current", label: "Current icons", Specimens: IconSpecimens }],
      },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    components: [
      {
        id: "button",
        caption: "6 variants · 2 sizes · disabled",
        docs: buttonDocs,
        Preview: ButtonPreview,
        bands: [
          { id: "default", label: "Default size", Specimens: ButtonDefaultSpecimens },
          { id: "icon", label: "Icon size", Specimens: ButtonIconSpecimens },
          { id: "disabled", label: "Disabled", Specimens: ButtonDisabledSpecimens },
        ],
      },
      {
        id: "button-link",
        caption: "6 variants · 2 sizes · native anchor",
        docs: buttonLinkDocs,
        Preview: ButtonLinkPreview,
        bands: [{ id: "variants", label: "Variants and sizes", Specimens: ButtonLinkSpecimens }],
      },
      {
        id: "action-menu",
        caption: "2 tones · disabled items · 4 sides",
        docs: actionMenuDocs,
        Preview: ActionMenuPreview,
        bands: [
          { id: "behavior", label: "States, behavior, and parity", Specimens: ActionMenuSpecimens },
        ],
      },
    ],
  },
  {
    id: "inputs",
    label: "Inputs",
    components: [
      {
        id: "text-input",
        caption: "4 states · error association",
        docs: textInputDocs,
        Preview: TextInputPreview,
        bands: [{ id: "states", label: "States", Specimens: TextInputSpecimens }],
      },
    ],
  },
  {
    id: "feedback",
    label: "Feedback",
    components: [
      {
        id: "progress-bar",
        caption: "determinate · clamps 0–100",
        docs: progressBarDocs,
        Preview: ProgressBarPreview,
        bands: [{ id: "states", label: "Progress states", Specimens: ProgressBarSpecimens }],
      },
      {
        id: "toast",
        caption: "message · leading media · action",
        docs: toastDocs,
        Preview: ToastPreview,
        bands: [
          { id: "anatomy", label: "Anatomy and live notifications", Specimens: ToastSpecimens },
        ],
      },
    ],
  },
  {
    id: "overlays",
    label: "Overlays",
    components: [
      {
        id: "dialog",
        caption: "2 sizes · contained focus · presence",
        docs: dialogDocs,
        Preview: DialogPreview,
        bands: [{ id: "behavior", label: "Sizes and behavior", Specimens: DialogSpecimens }],
      },
    ],
  },
];

export function getLabCategory(id: string) {
  return labCategories.find((category) => category.id === id) ?? labCategories[0];
}
