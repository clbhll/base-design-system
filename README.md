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

Validate one packed npm artifact in the standalone Vite and Next.js consumer fixtures with:

```sh
pnpm fixture:test
```

Registry verification is release-only and requires an exact published prerelease:

```sh
pnpm fixture:registry -- 0.1.0-alpha.0
```

See [docs/releasing.md](docs/releasing.md) for the Changesets, trusted-publishing, verification, and rollback runbook. Public alphas publish under npm's `next` tag; `StatusTag` remains documentation-only and is never consumable from the package.

## Roadmap

CLB-691 and CLB-692 established the package and foundations. CLB-694 and CLB-695 added the first public action, input, and feedback primitives. CLB-716 added the front-facing component lab, including a lab-only `StatusTag` that is never exported or included in the npm package. CLB-705 owns the alpha release process.

## License

MIT © Caleb Hill
