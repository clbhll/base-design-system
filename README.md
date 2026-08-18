# Base Design System

`@calebhill/base` is a project-agnostic React design system for Caleb Hill's web projects. It provides framework-independent package APIs, semantic tokens, accessible components, and compiled CSS that requires no consumer Tailwind configuration.

Read the [AI-first design contract](DESIGN.md) before changing tokens, components, motion, accessibility behavior, or public APIs. Repository workflow and validation commands live in [AGENTS.md](AGENTS.md).

## Consumer setup

Install the package and its React peer dependencies:

```sh
pnpm add @calebhill/base react react-dom
```

Import the complete package stylesheet once in the application entry point:

```ts
import "@calebhill/base/styles.css";
```

Light tokens are the default. Set the package theme contract on an application root to select a theme explicitly:

```html
<html data-base-theme="light">
```

Supported values are `data-base-theme="light"` and `data-base-theme="dark"`.

Import only the token contract when a consumer supplies all component and foundation styles itself:

```ts
import "@calebhill/base/tokens.css";
```

Override semantic properties through normal CSS cascade. For example, CalebHill's light theme retains its product accent without creating another Base theme:

```css
[data-base-theme="light"] {
  --base-color-accent: #0082f6;
  --base-color-accent-hover: #56afff;
  --base-color-accent-active: #0062b8;
  --base-color-focus-ring: #0082f6;
}
```

The complete stylesheet exports opt-in `.base-type-*`, `.base-link*`, `.base-tabular-nums`, `.base-focus-ring`, and `.base-pressable` classes. It does not style `body`, reset elements, or require Tailwind.

## Development

Install dependencies and run the same fail-fast gate used by CI:

```sh
pnpm install
pnpm verify
```

Start the local component lab with:

```sh
pnpm lab:dev
```

Validate the packed npm artifact in the standalone Vite consumer fixture with:

```sh
pnpm fixture:test
```

See [docs/releasing.md](docs/releasing.md) for the Changesets release-preparation flow. Publishing remains deferred to CLB-705.

## Roadmap

CLB-691 is the completed package scaffold. CLB-692 is the completed foundation and token slice. CLB-694 is the next Button, ButtonLink, and icon slice; CLB-695 is the next TextInput and ProgressBar slice. CLB-716 will add the front-facing component lab, including a lab-only StatusTag that is never exported or included in the npm package.

## License

MIT © Caleb Hill
