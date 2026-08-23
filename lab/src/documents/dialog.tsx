import {
  Button,
  Dialog,
  DialogFooter,
  DialogHeading,
  TextInput,
  type BaseTheme,
  type DialogSize,
} from "@calebhill/base";
import { useState } from "react";

import { AccessibilityNotes } from "../components/accessibility-notes";
import { CodeSample } from "../components/code-sample";
import { DocumentHeader } from "../components/document-header";
import { PropsTable } from "../components/props-table";
import { Specimen } from "../components/specimen";

export function DialogDocument() {
  const [theme, setTheme] = useState<BaseTheme>("light");
  const [size, setSize] = useState<DialogSize>("compact");
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const compact = size === "compact";

  function openDialog(nextSize: DialogSize) {
    setSize(nextSize);
    setShowDetails(false);
    setOpen(true);
  }

  return (
    <article className="lab-component-document">
      <DocumentHeader
        importStatement={
          'import { Dialog, DialogFooter, DialogHeading } from "@calebhill/base";'
        }
        status="beta"
        summary="A controlled modal surface with package-owned focus, dismissal, scroll locking, presence, and compact or wide layouts."
        title="Dialog"
      />
      <Specimen onThemeChange={setTheme} theme={theme} title="Sizes and behavior">
        <div className="lab-dialog-triggers">
          <Button onClick={() => openDialog("compact")} variant="secondary">
            Open compact Dialog
          </Button>
          <Button onClick={() => openDialog("wide")} variant="secondary">
            Open wide Dialog
          </Button>
        </div>
        <div className="lab-dialog-portal" ref={setPortalContainer} />
        <Dialog
          dismissOnBackdrop={compact}
          layoutDependency={compact ? undefined : showDetails ? "expanded" : "collapsed"}
          onOpenChange={setOpen}
          open={open}
          portalContainer={portalContainer}
          size={size}
        >
          <DialogHeading
            subtitle={
              compact
                ? "Update the public details shown with your work."
                : "Check the content and supporting information before publishing."
            }
            title={compact ? "Edit profile" : "Review details"}
          />
          <div className="lab-dialog-fields">
            <TextInput
              aria-label={compact ? "Display name" : "Project summary"}
              defaultValue={compact ? "Caleb Hill" : "A focused Dialog system for Base."}
            />
            {compact ? (
              <TextInput aria-label="Email" defaultValue="hello@example.com" />
            ) : (
              <>
                <Button
                  onClick={() => setShowDetails((visible) => !visible)}
                  variant="subtle"
                >
                  {showDetails ? "Hide supporting details" : "Show supporting details"}
                </Button>
                {showDetails ? (
                  <div className="lab-dialog-expanded base-type-body-sm">
                    <p>Focus remains contained as this section changes the Dialog height.</p>
                    <a className="base-link" href="#/components/dialog">
                      Review Dialog guidance
                    </a>
                  </div>
                ) : null}
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="secondary">
              Close {size} Dialog
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </DialogFooter>
        </Dialog>
      </Specimen>
      <CodeSample
        code={
          '<Dialog open={open} onOpenChange={setOpen}>\n  <DialogHeading title="Edit profile" />\n  <DialogFooter>…</DialogFooter>\n</Dialog>'
        }
      />
      <PropsTable
        props={[
          {
            name: "open",
            type: "boolean",
            description: "Controls whether the modal is open.",
          },
          {
            name: "onOpenChange",
            type: "(open: boolean) => void",
            description: "Receives dismissal and controlled-state requests.",
          },
          {
            name: "size",
            type: '"compact" | "wide"',
            defaultValue: '"compact"',
            description: "Selects the surface width.",
          },
          {
            name: "dismissOnBackdrop",
            type: "boolean",
            defaultValue: "true",
            description: "Allows pointer interaction on the backdrop to request closing.",
          },
          {
            name: "dismissOnEscape",
            type: "boolean",
            defaultValue: "true",
            description: "Allows Escape to request closing.",
          },
          {
            name: "initialFocusRef",
            type: "RefObject<HTMLElement | null>",
            description: "Overrides the first focus target when necessary.",
          },
          {
            name: "layoutDependency",
            type: "boolean | number | string",
            description: "Opts changing content into size-only layout animation.",
          },
          {
            name: "onExitComplete",
            type: "() => void",
            description: "Runs once after exit presence completes or is skipped.",
          },
        ]}
      />
      <AccessibilityNotes>
        <li>Focus enters the Dialog, remains contained, and returns to the opener.</li>
        <li>DialogHeading supplies the accessible title and optional description.</li>
        <li>Escape and backdrop dismissal can be configured independently.</li>
        <li>Background interaction and body scrolling remain locked while open.</li>
        <li>Reduced motion removes spatial movement while retaining brief opacity feedback.</li>
      </AccessibilityNotes>
    </article>
  );
}
