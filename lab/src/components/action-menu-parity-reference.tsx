import { MoreIcon } from "@calebhill/base";

export function ActionMenuParityReference() {
  return (
    <div
      aria-hidden="true"
      aria-label="photos.me reference"
      className="lab-action-menu-reference"
      data-parity-target="reference"
      data-testid="action-menu-parity-reference"
    >
      <button
        className="lab-action-menu-reference-trigger"
        tabIndex={-1}
        type="button"
      >
        <MoreIcon />
      </button>
      <div className="lab-action-menu-reference-content">
        <button className="lab-action-menu-reference-item" tabIndex={-1} type="button">
          Edit
        </button>
        <button
          className="lab-action-menu-reference-item"
          data-tone="destructive"
          tabIndex={-1}
          type="button"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
