# Base Design System

`@calebhill/base` is a reusable React design system for building consistent, accessible interfaces across products, teams, and brands. It provides semantic design tokens, accessible components, stable package APIs, and compiled CSS without requiring consumer Tailwind configuration.

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

Apply product-specific branding by overriding semantic properties through the normal CSS cascade, without creating a separate Base theme:

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

## Status

Base is in public alpha. Its foundations and first action, input, and feedback primitives are available, with the component lab documenting current APIs and behavior.

## License

MIT © Caleb Hill
