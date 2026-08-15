import { BASE_THEME_ATTRIBUTE, type BaseTheme } from "@calebhill/base";
import "@calebhill/base/styles.css";

import { DevTools } from "./dev-tools";

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

function ThemePanel({ theme }: { theme: BaseTheme }) {
  return (
    <section className="lab-panel" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      <header className="lab-section">
        <p className="base-type-caption">{theme} theme</p>
        <h2 className="base-type-heading-lg">Foundation contract</h2>
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

export function App() {
  return (
    <>
      <main className="lab-shell">
        <header className="lab-intro">
          <p className="base-type-caption">@calebhill/base</p>
          <h1 className="base-type-display">Foundations</h1>
          <p className="base-type-body-lg">Portable tokens, type, links, and interaction.</p>
        </header>
        <div className="lab-grid">
          <ThemePanel theme="light" />
          <ThemePanel theme="dark" />
        </div>
        <section className="lab-override" data-base-theme="light">
          <p className="base-type-body">
            Scoped override: <a className="base-link" href="#override">consumer accent</a>
          </p>
          <button className="lab-pressable base-focus-ring base-pressable base-type-action" type="button">
            Consumer accent
          </button>
        </section>
      </main>
      <DevTools />
    </>
  );
}
