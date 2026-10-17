import {
  Button,
  Dialog,
  DialogFooter,
  DialogHeading,
  TextInput,
  type DialogSize,
} from "@calebhill/base";
import { useState } from "react";

import type { LabComponentDocs } from "../catalog-types";

export const dialogDocs: LabComponentDocs = {
  title: "Dialog",
  status: "beta",
  summary:
    "A controlled modal surface with package-owned focus, dismissal, scroll locking, presence, and compact or wide layouts.",
  importStatement: 'import { Dialog, DialogFooter, DialogHeading } from "@calebhill/base";',
  example:
    '<Dialog open={open} onOpenChange={setOpen}>\n  <DialogHeading title="Edit profile" />\n  <DialogFooter>…</DialogFooter>\n</Dialog>',
  props: [
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
  ],
  accessibility: [
    "Focus enters the Dialog, remains contained, and returns to the opener.",
    "DialogHeading supplies the accessible title and optional description.",
    "Escape and backdrop dismissal can be configured independently.",
    "Background interaction and body scrolling remain locked while open.",
    "Reduced motion removes spatial movement while retaining brief opacity feedback.",
  ],
};

export function DialogSpecimens() {
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
    <>
      <div className="lab-specimen-row">
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
              <Button onClick={() => setShowDetails((visible) => !visible)} variant="subtle">
                {showDetails ? "Hide supporting details" : "Show supporting details"}
              </Button>
              {showDetails ? (
                <div className="lab-dialog-expanded base-type-body-sm">
                  <p>Focus remains contained as this section changes the Dialog height.</p>
                  <a className="base-link" href="#/overlays/dialog">
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
    </>
  );
}

export function DialogPreview() {
  return (
    <div className="lab-specimen-row">
      <Button variant="secondary">Open compact Dialog</Button>
    </div>
  );
}
