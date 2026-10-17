import { useRef, type KeyboardEvent } from "react";

import type { LabCategory } from "../catalog-types";

export const tabId = (category: string) => `lab-tab-${category}`;
export const panelId = (category: string) => `lab-panel-${category}`;

export function CategoryTabs({
  active,
  categories,
  onSelect,
}: {
  categories: ReadonlyArray<LabCategory>;
  active: string;
  onSelect: (category: string, options?: { replace: boolean }) => void;
}) {
  const tabs = useRef(new Map<string, HTMLButtonElement>());

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = categories.findIndex(({ id }) => id === active);
    const last = categories.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;

    event.preventDefault();
    const { id } = categories[next];
    // Arrow keys sweep across tabs; record only where the user lands, not every tab passed.
    onSelect(id, { replace: true });
    tabs.current.get(id)?.focus();
  }

  return (
    <div
      aria-label="Component categories"
      className="lab-tabs"
      role="tablist"
    >
      {categories.map(({ id, label }) => {
        const selected = id === active;
        return (
          <button
            aria-controls={panelId(id)}
            aria-selected={selected}
            className="lab-tab base-focus-ring"
            id={tabId(id)}
            key={id}
            onClick={() => onSelect(id)}
            onKeyDown={handleKeyDown}
            ref={(element) => {
              if (element) tabs.current.set(id, element);
              else tabs.current.delete(id);
            }}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
