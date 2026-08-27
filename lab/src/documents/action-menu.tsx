import {
  ActionMenu,
  MoreIcon,
  type BaseTheme,
} from "@calebhill/base";
import { useState } from "react";

import { AccessibilityNotes } from "../components/accessibility-notes";
import { ActionMenuParityReference } from "../components/action-menu-parity-reference";
import { CodeSample } from "../components/code-sample";
import { DocumentHeader } from "../components/document-header";
import { PropsTable } from "../components/props-table";
import { Specimen } from "../components/specimen";

const parityItems = [
  { label: "Edit", onSelect: () => undefined },
  { label: "Delete", tone: "destructive" as const, onSelect: () => undefined },
  { label: "Unavailable", disabled: true, onSelect: () => undefined },
] as const;

export function ActionMenuDocument() {
  const [theme, setTheme] = useState<BaseTheme>("light");
  const [selection, setSelection] = useState("None");
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const [parityPortal, setParityPortal] = useState<HTMLDivElement | null>(null);
  const [parityOpen, setParityOpen] = useState(false);

  return (
    <article className="lab-component-document">
      <DocumentHeader
        importStatement={'import { ActionMenu, MoreIcon } from "@calebhill/base";'}
        status="beta"
        summary="A compact menu with typed actions, collision-aware positioning, complete keyboard navigation, restrained motion, and focus-safe selection handoff."
        title="ActionMenu"
      />
      <Specimen onThemeChange={setTheme} theme={theme} title="States, behavior, and parity">
        <div className="lab-action-menu-specimen">
          <ActionMenu
            icon={<MoreIcon />}
            items={[
              { label: "Edit", onSelect: () => setSelection("Edit") },
              {
                label: "Delete",
                tone: "destructive",
                onSelect: () => setSelection("Delete"),
              },
              {
                label: "Unavailable",
                disabled: true,
                onSelect: () => setSelection("Unavailable"),
              },
            ]}
            label="Photo options"
            portalContainer={portalContainer}
          />
          <span className="base-type-body-sm" role="status">
            Selected: {selection}
          </span>
          <div className="lab-action-menu-portal" ref={setPortalContainer} />
        </div>
        <div className="lab-action-menu-parity-grid">
          <section className="lab-action-menu-parity-cell">
            <span className="base-type-caption">photos.me reference</span>
            <ActionMenuParityReference />
          </section>
          <section className="lab-action-menu-parity-cell" data-parity-target="base">
            <span className="base-type-caption">Base ActionMenu reference</span>
            <div className="lab-action-menu-base-anchor">
              <ActionMenu
                align="start"
                icon={<MoreIcon />}
                items={parityItems}
                label="Base parity options"
                onOpenChange={setParityOpen}
                open={parityOpen}
                portalContainer={parityPortal}
                side="bottom"
              />
              <div className="lab-action-menu-parity-portal" ref={setParityPortal} />
            </div>
          </section>
        </div>
      </Specimen>
      <CodeSample
        code={
          '<ActionMenu\n  label="Photo options"\n  icon={<MoreIcon />}\n  items={[\n    { label: "Edit", onSelect: edit },\n    { label: "Delete", tone: "destructive", onSelect: remove },\n  ]}\n/>'
        }
      />
      <PropsTable
        props={[
          {
            name: "label",
            type: "string",
            description: "Names both the icon trigger and menu for assistive technology.",
          },
          {
            name: "icon",
            type: "ReactNode",
            description: "Supplies the decorative icon shown in the package-owned trigger.",
          },
          {
            name: "items",
            type: "readonly ActionMenuItem[]",
            description: "Provides labelled default, destructive, or disabled actions.",
          },
          {
            name: "open / defaultOpen",
            type: "boolean",
            description: "Selects controlled state or an uncontrolled initial state.",
          },
          {
            name: "onOpenChange",
            type: "(open: boolean) => void",
            description: "Required in controlled mode and optional for uncontrolled observation.",
          },
          {
            name: "side / align / sideOffset",
            type: '"top" | "right" | "bottom" | "left" / "start" | "center" | "end" / number',
            defaultValue: '"top" / "end" / 8',
            description: "Places the collision-aware menu relative to its trigger.",
          },
          {
            name: "portalContainer",
            type: "HTMLElement | null",
            description: "Overrides the default document-body portal when theme or containment requires it.",
          },
        ]}
      />
      <AccessibilityNotes>
        <li>Arrow Down and Arrow Up open at the first or last enabled action.</li>
        <li>Arrow keys, Home, End, and typeahead move through enabled menuitems.</li>
        <li>Escape and outside pointer interaction close without selecting.</li>
        <li>Disabled actions remain visible but cannot receive focus or activate.</li>
        <li>Focus returns before selection runs, so a following Dialog can take focus correctly.</li>
        <li>Reduced motion removes translation, scale, spring, and stagger while retaining opacity.</li>
      </AccessibilityNotes>
    </article>
  );
}
