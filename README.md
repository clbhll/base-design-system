# Base Design System

`@calebhill/base` is a project-agnostic React design system for Caleb Hill's web projects. It provides framework-independent package APIs, semantic tokens, accessible components, and compiled CSS that requires no consumer Tailwind configuration.

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

The first real component migrations follow this package foundation: Button in CLB-692, TextInput in CLB-694, and ProgressBar plus StatusTag in CLB-695.

## License

MIT © Caleb Hill
