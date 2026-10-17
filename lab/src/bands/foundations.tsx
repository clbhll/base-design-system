import type { CSSProperties } from "react";

import type { LabComponentDocs } from "../catalog-types";

const typeRoles = [
  ["Display", "base-type-display"],
  ["Heading large", "base-type-heading-lg"],
  ["Heading medium", "base-type-heading-md"],
  ["Heading small", "base-type-heading-sm"],
  ["Action", "base-type-action"],
  ["Input", "base-type-input"],
  ["Body large", "base-type-body-lg"],
  ["Body", "base-type-body"],
  ["Body small", "base-type-body-sm"],
  ["Caption", "base-type-caption"],
  ["Mono", "base-type-mono"],
] as const;

const colorSwatches = [
  ["Background", "background"],
  ["Subtle", "background-subtle"],
  ["Surface", "surface"],
  ["Accent", "accent"],
] as const;

const linkSurfaces = [
  ["Background", "background"],
  ["Subtle", "background-subtle"],
  ["Surface", "surface"],
  ["Surface hover", "surface-hover"],
  ["Surface active", "surface-active"],
  ["Surface disabled", "surface-disabled"],
  ["Accent subtle", "accent-subtle"],
] as const;

export const foundationDocs = {
  color: {
    title: "Color",
    summary:
      "Semantic color tokens with light and dark defaults. Components consume these rather than raw scales.",
    example: "color: var(--base-color-text-primary);\nbackground: var(--base-color-surface);",
  },
  typography: {
    title: "Typography",
    summary: "Reusable type roles applied with opt-in .base-type-* classes.",
    example: '<p className="base-type-body">…</p>',
  },
  links: {
    title: "Links",
    summary: "Standard and muted link treatments that stay legible on every semantic surface.",
    example: '<a className="base-link" href="/about">About</a>',
  },
  interaction: {
    title: "Focus and press",
    summary:
      "Visible focus rings, press feedback, inline code, and tabular numerals shared by every Base component.",
    example: '<button className="base-focus-ring base-pressable">…</button>',
    accessibility: [
      "Focus indicators remain visible in both themes and under consumer overrides.",
      "Reduced motion removes spatial press feedback while preserving state.",
    ],
  },
  override: {
    title: "Consumer override",
    summary: "Consumers override public semantic tokens through the normal CSS cascade.",
    example: '.brand {\n  --base-color-accent: #0082f6;\n  --base-color-focus-ring: #0082f6;\n}',
  },
} as const satisfies Record<string, LabComponentDocs>;

export function ColorSpecimens() {
  return (
    <div className="lab-swatches" aria-label="Semantic colors" role="group">
      {colorSwatches.map(([label, token]) => (
        <div
          className="lab-swatch"
          data-semantic-color={token}
          key={token}
          style={{ background: `var(--base-color-${token})` }}
        >
          <span className="base-type-caption">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function TypographySpecimens() {
  return (
    <div className="lab-type-roles">
      {typeRoles.map(([label, className]) => (
        <p className={className} key={className}>
          {label} — Base foundations
        </p>
      ))}
    </div>
  );
}

export function LinkSpecimens() {
  return (
    <div className="lab-link-surfaces">
      {linkSurfaces.map(([label, token]) => (
        <div
          className="lab-link-surface"
          data-semantic-color={token}
          key={token}
          style={{ background: `var(--base-color-${token})` }}
        >
          <span className="base-type-caption">{label}</span>
          <span className="base-type-body">
            <a className="base-link" href="#/foundations/links">
              Standard link
            </a>{" "}
            <a className="base-link-muted" href="#/foundations/links">
              Muted link
            </a>
          </span>
        </div>
      ))}
    </div>
  );
}

export function InteractionSpecimens() {
  return (
    <div className="lab-specimen-row">
      <button className="lab-pressable base-focus-ring base-pressable base-type-action" type="button">
        Press me
      </button>
      <span className="base-type-body">
        <code className="base-type-mono lab-code">inline code</code>{" "}
        <span className="base-tabular-nums">01:23:45</span>
      </span>
    </div>
  );
}

export function OverrideSpecimens() {
  return (
    <div
      className="lab-override"
      style={
        {
          "--base-color-accent": "#0082f6",
          "--base-color-focus-ring": "#0082f6",
        } as CSSProperties
      }
    >
      <p className="base-type-body">
        Scoped override: <a className="base-link" href="#/foundations/override">consumer accent</a>
      </p>
      <button className="lab-pressable base-focus-ring base-pressable base-type-action" type="button">
        Consumer accent
      </button>
    </div>
  );
}

export function ColorPreview() {
  return (
    <div className="lab-specimen-row">
      {colorSwatches.map(([, token]) => (
        <span
          className="lab-preview-swatch"
          key={token}
          style={{ background: `var(--base-color-${token})` }}
        />
      ))}
    </div>
  );
}

export function TypographyPreview() {
  return (
    <div className="lab-preview-type">
      <p className="base-type-display">Aa</p>
      <p className="base-type-body-sm">Display to mono, 11 roles</p>
    </div>
  );
}

export function LinkPreview() {
  return (
    <span className="base-type-body">
      <a className="base-link" href="#/foundations/links">
        Standard link
      </a>{" "}
      <a className="base-link-muted" href="#/foundations/links">
        Muted link
      </a>
    </span>
  );
}

export function InteractionPreview() {
  return (
    <button className="lab-pressable base-focus-ring base-pressable base-type-action" type="button">
      Press me
    </button>
  );
}

export function OverridePreview() {
  return (
    <button
      className="lab-pressable base-pressable base-type-action"
      style={{ "--base-color-accent": "#0082f6" } as CSSProperties}
      type="button"
    >
      Consumer accent
    </button>
  );
}
