import { BASE_THEME_ATTRIBUTE, type BaseTheme } from "@calebhill/base";
import type { CSSProperties } from "react";

import { DocumentHeader } from "../components/document-header";

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

const linkSurfaces = [
  ["Background", "background"],
  ["Subtle", "background-subtle"],
  ["Surface", "surface"],
  ["Surface hover", "surface-hover"],
  ["Surface active", "surface-active"],
  ["Surface disabled", "surface-disabled"],
  ["Accent subtle", "accent-subtle"],
] as const;

function FoundationPanel({ theme }: { theme: BaseTheme }) {
  return (
    <section className="lab-panel" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      <header className="lab-section">
        <p className="base-type-caption">{theme} theme</p>
        <h2 className="base-type-heading-lg">Semantic foundations</h2>
      </header>

      <div className="lab-section lab-swatches" aria-label={`${theme} semantic colors`}>
        {[
          ["Background", "background"],
          ["Subtle", "background-subtle"],
          ["Surface", "surface"],
          ["Accent", "accent"],
        ].map(([label, token]) => (
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

      <div className="lab-section">
        {typeRoles.map(([label, className]) => (
          <p className={className} key={className}>
            {label} — Base foundations
          </p>
        ))}
      </div>

      <div className="lab-section lab-link-surfaces">
        {linkSurfaces.map(([label, token]) => (
          <div
            className="lab-link-surface"
            data-semantic-color={token}
            key={token}
            style={{ background: `var(--base-color-${token})` }}
          >
            <span className="base-type-caption">{label}</span>
            <span className="base-type-body">
              <a className="base-link" href={`#${theme}-${token}-standard`}>
                Standard link
              </a>{" "}
              <a className="base-link-muted" href={`#${theme}-${token}-muted`}>
                Muted link
              </a>
            </span>
          </div>
        ))}
      </div>

      <div className="lab-section base-type-body">
        <code className="base-type-mono lab-code">inline code</code>{" "}
        <span className="base-tabular-nums">01:23:45</span>
      </div>

      <button className="lab-pressable base-focus-ring base-pressable base-type-action" type="button">
        Press me
      </button>
    </section>
  );
}

export function FoundationsDocument() {
  return (
    <article className="lab-component-document">
      <DocumentHeader
        summary="Semantic color, typography, focus, interaction, and theming contracts shared by every Base component."
        title="Foundations"
      />
      <div className="lab-grid">
        <FoundationPanel theme="light" />
        <FoundationPanel theme="dark" />
      </div>
      <section
        className="lab-override"
        data-base-theme="light"
        style={
          {
            "--base-color-accent": "#0082f6",
            "--base-color-focus-ring": "#0082f6",
          } as CSSProperties
        }
      >
        <p className="base-type-body">
          Scoped override: <a className="base-link" href="#override">consumer accent</a>
        </p>
        <button className="lab-pressable base-focus-ring base-pressable base-type-action" type="button">
          Consumer accent
        </button>
      </section>
    </article>
  );
}
