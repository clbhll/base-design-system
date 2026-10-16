import type { BaseTheme } from "@calebhill/base";
import { useState } from "react";

export const labSurfaces = {
  grey: { label: "Grey", theme: "light" },
  white: { label: "White", theme: "light" },
  black: { label: "Black", theme: "dark" },
} as const satisfies Record<string, { label: string; theme: BaseTheme }>;

export type LabSurface = keyof typeof labSurfaces;

const storageKey = "base-lab-surface";

function isLabSurface(value: unknown): value is LabSurface {
  return typeof value === "string" && Object.hasOwn(labSurfaces, value);
}

function readStoredSurface(): LabSurface {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return isLabSurface(stored) ? stored : "grey";
  } catch {
    return "grey";
  }
}

export function useLabSurface() {
  const [surface, setSurface] = useState(readStoredSurface);

  function selectSurface(next: LabSurface) {
    setSurface(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the choice still applies.
    }
  }

  return [surface, selectSurface] as const;
}

export function SurfaceControl({
  onChange,
  surface,
}: {
  surface: LabSurface;
  onChange: (surface: LabSurface) => void;
}) {
  return (
    <div aria-label="Canvas surface" className="lab-segmented" role="group">
      {(Object.keys(labSurfaces) as LabSurface[]).map((option) => (
        <button
          aria-pressed={surface === option}
          className="lab-segmented-button base-focus-ring"
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {labSurfaces[option].label}
        </button>
      ))}
    </div>
  );
}
