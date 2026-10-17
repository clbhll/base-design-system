import {
  Button,
  TextInput,
  Toast,
  useToast,
  type ToastAction,
  type ToastVariant,
} from "@calebhill/base";
import { useState, type ReactNode } from "react";

import type { LabComponentDocs } from "../catalog-types";

export const toastDocs: LabComponentDocs = {
  title: "Toast",
  status: "beta",
  summary: "One message, an optional leading image or icon, and an optional action.",
  importStatement: 'import { Toast, ToastProvider, useToast } from "@calebhill/base";',
  example:
    '// Wrap the app once:\n<ToastProvider placement="bottom-center" duration={5000}>\n  <App />\n</ToastProvider>\n\n// Inside a component:\nconst { notify, dismiss } = useToast();\nnotify({ message: "Changes saved.", duration: 5000 });\nconst id = notify({ message: "Connection lost.", duration: null });\ndismiss(id);',
  props: [
    {
      name: "Toast.message",
      type: "string",
      description: "One text string; wraps without truncation.",
    },
    {
      name: "Toast.leading",
      type: "ReactNode",
      description: "Optional decorative icon or image in a 32px slot.",
    },
    {
      name: "Toast.action",
      type: "ToastAction",
      description: "Optional label and onClick callback; always a subtle, pill-shaped Base Button.",
    },
    {
      name: "notify(options)",
      type: "(ToastOptions) => string",
      description:
        "Displays or queues a notification and returns its id. Adds duration, variant, and dedupeKey to the anatomy options.",
    },
    {
      name: "duration",
      type: "number | null",
      description: "Provider default: 5000ms. Override per toast; null persists until dismissed.",
    },
    {
      name: "placement",
      type: "ToastPlacement",
      description:
        "Bottom-center by default. Top/bottom paired with left/center/right; includes mobile safe-area spacing.",
    },
    {
      name: "maxVisible",
      type: "number",
      description:
        "Provider default: 3. Additional notifications queue in insertion order; their timers start on display.",
    },
    {
      name: "variant",
      type: '"neutral" | "success" | "error"',
      description:
        "Controls announcement urgency, not decorative color. Error is assertive; neutral/success are polite.",
    },
    {
      name: "dedupeKey",
      type: "string",
      description:
        "Defaults to variant and message. Duplicate open or queued notifications reuse the existing id.",
    },
    {
      name: "dismiss / dismissAll",
      type: "(id: string) => void / () => void",
      description: "Dismiss one notification, or immediately clear the full queue.",
    },
    {
      name: "theme / portalContainer",
      type: "BaseTheme / HTMLElement",
      description:
        "Provider: optionally set a portal theme or destination; defaults to the document body and its inherited theme.",
    },
    {
      name: "label / viewportLabel / dismissLabel",
      type: "string",
      description:
        "Localized notification, keyboard landmark, and fallback button labels. Defaults: Notification, Notifications ({hotkey}), Dismiss.",
    },
  ],
  accessibility: [
    "Showing a notification does not move focus. F8 enters the notification area; Tab reaches notifications and their actions.",
    "Escape dismisses from within the notification area. Swiping right also dismisses.",
    "Timers pause during pointer hover, keyboard focus, and window blur.",
    "Persistent notifications without an action receive a Dismiss button. Actions invoke their callback and close the notification; callbacks do not wait for asynchronous work.",
    "The entrance starts immediately and lasts 150ms. Reduced motion uses a fade.",
    "Toast alone is visual anatomy; ToastProvider supplies live announcements and lifecycle.",
  ],
};

export function ToastSpecimens() {
  const [message, setMessage] = useState("Your changes have been saved.");
  const [leading, setLeading] = useState("icon");
  const [showAction, setShowAction] = useState(true);
  const [actionLabel, setActionLabel] = useState("Undo");
  const [actionFeedback, setActionFeedback] = useState("");
  const leadingMedia =
    leading === "none" ? undefined : leading === "image" ? (
      <img
        src={`${import.meta.env.BASE_URL}toast-image.svg`}
        alt=""
        width="32"
        height="32"
        data-testid="toast-leading-image"
      />
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="m5 12 4 4L19 6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  const action: ToastAction | undefined = showAction
    ? {
        label: actionLabel.trim() || "Undo",
        onClick: () => setActionFeedback(`“${actionLabel.trim() || "Undo"}” clicked.`),
      }
    : undefined;

  return (
    <div className="lab-toast-band">
      <div className="lab-toast-stage" role="group" aria-label="Toast preview">
        <Toast message={message} leading={leadingMedia} action={action} />
      </div>
      <section className="lab-band-panel" aria-labelledby="toast-options">
        <h3 className="lab-band-panel-title base-type-caption" id="toast-options">
          Try the anatomy
        </h3>
        <div className="lab-toast-controls">
          <label className="lab-toast-field base-type-body-sm" htmlFor="toast-message">
            Message
            <TextInput
              id="toast-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <label className="lab-toast-field base-type-body-sm">
            Leading media
            <select
              className="lab-toast-select base-focus-ring"
              value={leading}
              onChange={(event) => setLeading(event.target.value)}
            >
              <option value="none">None</option>
              <option value="icon">Icon</option>
              <option value="image">Image</option>
            </select>
          </label>
          <label className="lab-toast-toggle base-type-body-sm">
            <input
              type="checkbox"
              checked={showAction}
              onChange={(event) => setShowAction(event.target.checked)}
            />
            Trailing button
          </label>
          {showAction ? (
            <label className="lab-toast-field base-type-body-sm" htmlFor="toast-button-label">
              Button label
              <TextInput
                id="toast-button-label"
                value={actionLabel}
                onChange={(event) => setActionLabel(event.target.value)}
              />
            </label>
          ) : null}
        </div>
        <p className="lab-toast-feedback base-type-body-sm" role="status">
          {actionFeedback}
        </p>
      </section>
      <ToastDemo message={message} leading={leadingMedia} action={action} />
    </div>
  );
}

function ToastDemo({
  message,
  leading,
  action,
}: {
  message: string;
  leading: ReactNode;
  action?: ToastAction;
}) {
  const { notify, dismissAll } = useToast();
  const [persistent, setPersistent] = useState(false);
  const [variant, setVariant] = useState<ToastVariant>("neutral");
  return (
    <section className="lab-band-panel" aria-labelledby="toast-live">
      <h3 className="lab-band-panel-title base-type-caption" id="toast-live">
        Live notifications
      </h3>
      <label className="lab-toast-field base-type-body-sm">
        Announcement
        <select
          className="lab-toast-select base-focus-ring"
          value={variant}
          onChange={(event) => setVariant(event.target.value as ToastVariant)}
        >
          <option value="neutral">Neutral — polite</option>
          <option value="success">Success — polite</option>
          <option value="error">Error — assertive</option>
        </select>
      </label>
      <label className="lab-toast-toggle base-type-body-sm">
        <input
          type="checkbox"
          checked={persistent}
          onChange={(event) => setPersistent(event.target.checked)}
        />
        Keep visible until dismissed
      </label>
      <div className="lab-specimen-row">
        <Button
          onClick={() =>
            notify({
              message: message.trim() || "Changes saved.",
              leading,
              action,
              variant,
              duration: persistent ? null : 5000,
            })
          }
        >
          Show toast
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            for (let index = 1; index <= 4; index++)
              notify({ message: `Notification ${index}`, duration: 5000 });
          }}
        >
          Show a sequence
        </Button>
        <Button variant="text" onClick={dismissAll}>
          Dismiss all
        </Button>
      </div>
    </section>
  );
}
