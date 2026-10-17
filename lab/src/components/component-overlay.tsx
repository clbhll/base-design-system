import { BASE_THEME_ATTRIBUTE, type BaseTheme } from "@calebhill/base";
import { easingConfigs } from "@calebhill/animations";
import { useEffect, useRef } from "react";

import type { LabComponent } from "../catalog-types";
import { Band } from "./band";
import { cardId } from "./card";
import { Inspector } from "./inspector";
import { StatusTag } from "./status-tag";
import type { LabSurface } from "./surface-control";

const expandEase = `cubic-bezier(${(easingConfigs.general.ease as number[]).join(", ")})`;

/** Grows the panel out of the card that opened it. Reduced motion zeroes the duration token. */
function expandFrom(origin: Element | null, panel: HTMLElement) {
  const duration = Number.parseFloat(
    getComputedStyle(panel).getPropertyValue("--base-duration-interaction-standard"),
  );
  if (!origin || !panel.animate || !(duration > 0)) return;

  const from = origin.getBoundingClientRect();
  const to = panel.getBoundingClientRect();
  if (!to.width || !to.height) return;

  panel.animate(
    [
      {
        opacity: 0,
        transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${
          from.width / to.width
        }, ${from.height / to.height})`,
      },
      { opacity: 1, transform: "none" },
    ],
    { duration, easing: expandEase },
  );
}

export function ComponentOverlay({
  component: { bands, docs, id },
  onClose,
  onToastHost,
  surface,
  theme,
}: {
  component: LabComponent;
  surface: LabSurface;
  theme: BaseTheme;
  onClose: () => void;
  onToastHost: (element: HTMLElement | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = `lab-overlay-${id}-title`;

  useEffect(() => {
    const element = dialog.current;
    if (!element || !panel.current) return;
    if (!element.open) element.showModal();
    expandFrom(document.getElementById(cardId(id)), panel.current);
  }, [id]);

  return (
    <dialog aria-labelledby={titleId} className="lab-overlay" onClose={onClose} ref={dialog}>
      <div className="lab-overlay-panel" ref={panel}>
        <div className="lab-overlay-header">
          <div className="lab-overlay-title-row">
            <h2 className="base-type-heading-md" id={titleId}>
              {docs.title}
            </h2>
            {docs.status ? <StatusTag status={docs.status} /> : null}
          </div>
          <button
            className="lab-overlay-close base-focus-ring"
            onClick={() => dialog.current?.close()}
            type="button"
          >
            Close
          </button>
        </div>
        <div className="lab-overlay-body">
          <div
            className="lab-canvas-surface lab-overlay-surface"
            data-lab-surface={surface}
            data-testid="lab-overlay-surface"
            {...{ [BASE_THEME_ATTRIBUTE]: theme }}
          >
            {bands.map((band) => (
              <Band band={band} id={`lab-band-${id}-${band.id}`} key={band.id} />
            ))}
          </div>
          <Inspector docs={docs} />
        </div>
        {/* Live notifications render here while the modal makes the rest of the page inert. */}
        <div className="lab-overlay-toasts" ref={onToastHost} />
      </div>
    </dialog>
  );
}
