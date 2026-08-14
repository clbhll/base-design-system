# Base Design System

A project-agnostic React design system for Caleb Hill's web projects.

This repository will contain reusable foundations, components, and patterns that can be published as a package and consumed by projects such as [photos.me](https://photos.calebhill.me) and [calebhill.me](https://calebhill.me).

## Direction

- React and TypeScript
- Framework-agnostic package APIs
- Semantic design tokens with light and dark themes
- Accessible, composable components
- Compiled CSS that does not require a consumer's Tailwind configuration
- Shared motion provided by the standalone animations package
- A matching published Figma library

## Package boundary

The base library is for elements that could reasonably be used in any product. It will not depend on Next.js, application routing, product state, storage, authentication, or photo-specific features such as uploads, media processing, and canvas tools.

## Status

Initial repository setup. Package scaffolding and component extraction are tracked in the [base-design-system Linear project](https://linear.app/clb/project/base-design-system-62c51661b458).

## License

License details will be added before the first public package release.
