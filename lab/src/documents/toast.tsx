import { Button, TextInput, type BaseTheme } from "@calebhill/base";
import { useState } from "react";

import { DocumentHeader } from "../components/document-header";
import { Specimen } from "../components/specimen";

// Lab-only anatomy exploration. Notification lifecycle belongs to the later package pass.
export function ToastDocument() {
  const [theme, setTheme] = useState<BaseTheme>("light");
  const [message, setMessage] = useState("Your changes have been saved.");
  const [leading, setLeading] = useState("icon");
  const [showAction, setShowAction] = useState(true);
  const [actionLabel, setActionLabel] = useState("Undo");
  const [actionFeedback, setActionFeedback] = useState("");

  return (
    <article className="lab-component-document">
      <DocumentHeader
        title="Toast"
        status="unstable"
        summary="One message, an optional leading image or icon, and an optional action."
      />
      <Specimen title="First pass" theme={theme} onThemeChange={setTheme}>
        <div className="lab-toast-stage" role="group" aria-label="Toast preview">
          <div className="lab-toast" data-leading={leading !== "none"} data-action={showAction}>
            {leading !== "none" ? (
              <span className="lab-toast-leading" aria-hidden="true">
                {leading === "image" ? (
                  <img
                    src={`${import.meta.env.BASE_URL}toast-image.svg`}
                    alt=""
                    width="32"
                    height="32"
                    data-testid="toast-leading-image"
                  />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            ) : null}
            <span className="lab-toast-message base-type-body">{message}</span>
            {showAction ? (
              <Button
                variant="subtle"
                onClick={() => setActionFeedback(`“${actionLabel.trim() || "Undo"}” clicked.`)}
              >
                {actionLabel.trim() || "Undo"}
              </Button>
            ) : null}
          </div>
        </div>
      </Specimen>
      <section className="lab-document-section" aria-labelledby="toast-options">
        <h2 className="base-type-heading-md" id="toast-options">Try the anatomy</h2>
        <div className="lab-toast-controls">
          <label className="lab-toast-field base-type-body-sm" htmlFor="toast-message">
            Message
            <TextInput id="toast-message" value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <label className="lab-toast-field base-type-body-sm">
            Leading media
            <select className="lab-toast-select base-focus-ring" value={leading} onChange={(event) => setLeading(event.target.value)}>
              <option value="none">None</option>
              <option value="icon">Icon</option>
              <option value="image">Image</option>
            </select>
          </label>
          <label className="lab-toast-toggle base-type-body-sm">
            <input type="checkbox" checked={showAction} onChange={(event) => setShowAction(event.target.checked)} />
            Trailing button
          </label>
          {showAction ? (
            <label className="lab-toast-field base-type-body-sm" htmlFor="toast-button-label">
              Button label
              <TextInput id="toast-button-label" value={actionLabel} onChange={(event) => setActionLabel(event.target.value)} />
            </label>
          ) : null}
        </div>
        <p className="lab-toast-feedback base-type-body-sm" role="status">{actionFeedback}</p>
        <p className="lab-toast-note base-type-body-sm">Visual exploration · not yet available in the package.</p>
      </section>
    </article>
  );
}
