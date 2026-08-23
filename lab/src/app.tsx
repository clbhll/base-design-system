import {
  BASE_THEME_ATTRIBUTE,
  Button,
  ButtonLink,
  Dialog,
  DialogFooter,
  DialogHeading,
  MoreIcon,
  ProgressBar,
  TextInput,
  TrashIcon,
  type BaseTheme,
  type ButtonVariant,
} from "@calebhill/base";
import { useState, type CSSProperties } from "react";
import "@calebhill/base/styles.css";

import { DevTools } from "./dev-tools";
import { StatusTag } from "./status-tag";

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

const buttonVariants = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["subtle", "Subtle"],
  ["destructive", "Destructive"],
  ["text", "Text"],
  ["text-accent", "Text accent"],
] as const satisfies ReadonlyArray<readonly [ButtonVariant, string]>;

function FoundationSpecimens({ theme }: { theme: BaseTheme }) {
  return (
    <>
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
    </>
  );
}

function DialogExhibit({ theme }: { theme: BaseTheme }) {
  const compact = theme === "light";
  const size = compact ? "compact" : "wide";
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  return (
    <section className="lab-component-section">
      <h3 className="base-type-heading-sm">Dialog</h3>
      <Button onClick={() => setOpen(true)} variant="secondary">
        Open {size} Dialog
      </Button>
      <p className="base-type-body-sm">
        {compact
          ? "Escape and backdrop clicks dismiss, then focus returns to this trigger."
          : "Backdrop dismissal is disabled. The extra section demonstrates size layout motion."}
      </p>
      <code className="lab-code-sample base-type-mono">
        {`<Dialog open={open} onOpenChange={setOpen} size="${size}">`}
      </code>
      <div className="lab-dialog-portal" ref={setPortalContainer} />

      <Dialog
        className="lab-dialog-content"
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
              : "Check the content and expand the supporting information before publishing."
          }
          title={compact ? "Edit profile" : "Review details"}
        />
        <div className="lab-dialog-fields">
          {compact ? (
            <>
              <TextInput aria-label="Display name" defaultValue="Caleb Hill" />
              <TextInput aria-label="Email" defaultValue="hello@example.com" />
            </>
          ) : (
            <>
              <TextInput
                aria-label="Project summary"
                defaultValue="A focused Dialog system for Base."
              />
              <Button
                onClick={() => setShowDetails((visible) => !visible)}
                variant="subtle"
              >
                {showDetails ? "Hide supporting details" : "Show supporting details"}
              </Button>
              {showDetails ? (
                <div className="lab-dialog-expanded base-type-body-sm">
                  <p>Focus remains contained as this section changes the Dialog height.</p>
                  <a className="base-link" href="#dialog-motion-guidance">
                    Review motion guidance
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
    </section>
  );
}

function ComponentPanel({ theme }: { theme: BaseTheme }) {
  return (
    <section className="lab-panel" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      <header className="lab-section">
        <p className="base-type-caption">{theme} theme</p>
        <h2 className="base-type-heading-lg">Base alpha components</h2>
      </header>

      <FoundationSpecimens theme={theme} />

      <section className="lab-component-section" id={`${theme}-button-link-target`}>
        <h3 className="base-type-heading-sm">Actions</h3>
        <div className="lab-component-grid">
          {buttonVariants.map(([variant, label]) => (
            <Button data-lab-variant={variant} key={variant} variant={variant}>
              {label}
            </Button>
          ))}
          <Button aria-label="More actions" size="icon" variant="subtle">
            <MoreIcon />
          </Button>
          <Button aria-label="Delete item" size="icon" variant="destructive">
            <TrashIcon />
          </Button>
          <Button disabled>Unavailable action</Button>
          <ButtonLink href={`#${theme}-button-link-target`}>Button link</ButtonLink>
        </div>
        <code className="lab-code-sample base-type-mono">{`<Button variant="primary">Primary</Button>`}</code>
      </section>

      <section className="lab-component-section">
        <h3 className="base-type-heading-sm">Text input</h3>
        <div className="lab-input-grid">
          <TextInput aria-label="Default input" placeholder="Default input" />
          <TextInput aria-label="Filled input" defaultValue="A filled value" />
          <TextInput aria-label="Disabled input" disabled placeholder="Disabled input" />
          <TextInput aria-label="Error input" error="This field needs attention." />
        </div>
        <code className="lab-code-sample base-type-mono">{`<TextInput error="This field needs attention." />`}</code>
      </section>

      <DialogExhibit theme={theme} />

      <section className="lab-component-section">
        <h3 className="base-type-heading-sm">Progress</h3>
        <div className="lab-progress-list">
          <ProgressBar label="Upload start" value={0} />
          <ProgressBar label="Upload progress" value={45} />
          <ProgressBar label="Upload complete" value={100} />
        </div>
        <code className="lab-code-sample base-type-mono">{`<ProgressBar label="Upload progress" value={45} />`}</code>
      </section>

      <section className="lab-component-section">
        <h3 className="base-type-heading-sm">Component lifecycle</h3>
        <div className="lab-status-list">
          <StatusTag status="stable" />
          <StatusTag status="beta" />
          <StatusTag status="unstable" />
          <StatusTag status="deprecated" />
        </div>
        <p className="base-type-body-sm">
          Lifecycle labels are visible text so their meaning does not depend on color.
        </p>
      </section>

      <div className="lab-guidance">
        <p className="base-type-caption">Usage notes</p>
        <ul className="base-type-body-sm">
          <li>Tab to each control; Enter and Space activate native buttons.</li>
          <li>Icon-only controls require an accessible name.</li>
          <li>Error text is announced through the input’s error association.</li>
          <li>Reduced motion removes spatial movement while brief opacity feedback remains.</li>
        </ul>
      </div>
    </section>
  );
}

export function App() {
  return (
    <>
      <main className="lab-shell">
        <header className="lab-intro">
          <p className="base-type-caption">@calebhill/base</p>
          <h1 className="base-type-display">Base alpha component lab</h1>
          <p className="base-type-body-lg">Portable foundations and accessible public components.</p>
        </header>
        <div className="lab-grid">
          <ComponentPanel theme="light" />
          <ComponentPanel theme="dark" />
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
      </main>
      <DevTools />
    </>
  );
}
