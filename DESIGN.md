# Base Design Contract

This document is the durable design contract for `@calebhill/base`. It explains what the system preserves, where decisions belong, and how humans and AI agents must evaluate changes. `README.md` covers installation and consumption. `AGENTS.md` covers repository workflow. Component documentation and the lab cover individual APIs and examples.

The words **must**, **must not**, and **may** are normative. Examples and items labeled “current” describe today’s implementation; they are not permission to bypass the rules below.

## 1. System purpose and principles

Base provides project-agnostic foundations and React components shared by Caleb Hill’s web products. It must make the correct accessible implementation easier to reuse while preserving intentional differences between products.

- Prefer semantic, composable primitives over page-shaped abstractions.
- Prefer native platform behavior over custom behavior.
- Keep the public API small, typed, predictable, and framework-independent.
- Preserve accessibility, clarity, and restraint before visual novelty.
- Promote proven patterns; do not use Base as a speculative component workshop.
- Make customization explicit through semantic tokens, props, and composition.

## 2. Package boundary

A pattern belongs in Base when it is broadly useful, has no product-state assumptions, can be named without reference to a specific page or workflow, and is approved through a Base issue. Evidence from both `photos.me` and `calebhill.me` strengthens a promotion case, but an approved universal need may originate in one product.

Base owns semantic foundations, universal interaction behavior, accessible component mechanics, package styles, and stable public APIs. Consumers own routing, data fetching, analytics, application state, content models, page layout, business rules, and product-specific orchestration. Product-local exceptions must remain local until an approved Base issue promotes them.

Base must not depend on Next.js, Vercel, consumer path aliases, product types, product CSS, or product state. A component that cannot function without those dependencies is a product component, not a Base component.

## 3. Sources of truth

Each artifact has a distinct authority:

| Question | Owning artifact |
| --- | --- |
| System purpose, boundaries, and change criteria | `DESIGN.md` |
| Public API, behavior, accessibility, and packaging | Package source and executable tests |
| Approved visual specification | Figma library |
| Integrated states and usage examples | Canonical component lab |
| Shared motion primitives | `@calebhill/animations` |
| Product-specific composition and exceptions | The owning consumer |
| Scope, tradeoffs, and approval history | Linear issue and linked decisions |

Resolve conflicts in this order: first satisfy accessibility and native-platform requirements; then apply this contract; then consult the approved Linear decision; then update the owning artifact and every dependent representation in the same delivery sequence. Code, Figma, and the lab must not silently overrule one another. When they disagree and no approved decision resolves the conflict, stop, document the mismatch in Linear, and obtain a decision before implementation. “Newest file” is not a source-of-truth rule.

## 4. Tokens and themes

Primitive values describe raw scales; semantic tokens describe intent. Public custom properties must use the `--base-` prefix and semantic names. Components must consume semantic tokens rather than product variables or unexplained raw colors.

Base must ship light and dark defaults without a reset or global `body` styling. The current theme selector is `data-base-theme="light" | "dark"`. Consumers may override public semantic tokens through normal CSS cascade and may choose their own theme-selection mechanism. They must not need Tailwind configuration to consume published CSS.

Add a public token only when its meaning is reusable, its theme behavior is defined, and an existing semantic token cannot express the need. Do not mirror a product token merely to avoid a local override. Removing or redefining a public token is an API change and requires migration review.

## 5. Typography and icons

Typography APIs describe reusable roles, not page templates. Roles must define the minimum coherent typographic contract and allow consumer context to provide layout. Base must not ship article shells, marketing hierarchy, or product copy styles as universal roles.

Icons must be generally useful, have verified redistribution terms, inherit `currentColor`, accept standard SVG props, and avoid embedded product meaning. Decorative icons must be hidden from assistive technology. Controls that contain only an icon must receive an accessible name at the component API boundary.

## 6. Component contract

Components must expose the native element’s applicable attributes, forward refs to the operative native element, and support composition without leaking internal implementation details. Variants must represent durable semantic intent rather than one screen’s appearance.

Every interactive component must define relevant default, hover, active, focus-visible, disabled, loading, error, and success behavior. Unsupported states must be excluded deliberately rather than left accidental. Components must not own validation policy, navigation policy, network state, or product workflows.

Public names, props, variants, DOM semantics, style hooks, and exported types are API. Changes must be evaluated for compatibility even when the rendered pixels appear unchanged.

## 7. Interaction and accessibility

Use native semantic elements whenever they satisfy the contract. Keyboard operation, focus order, focus visibility, accessible names, roles, state announcements, target size, contrast, and disabled behavior must be designed and tested—not inferred from appearance.

Focus indicators must remain visible in both themes and consumer overrides. Color must not be the only state signal. Loading or progress behavior must expose appropriate accessible semantics. Reduced-motion preferences must remove or soften disorienting movement while preserving essential state communication.

Accessibility regressions block delivery. Automated checks are necessary but do not replace keyboard review and visual review of focus, contrast, zoom, and supported component states.

## 8. Motion ownership

`@calebhill/animations` is the sole owner of shared easing, spring, stagger, entrance, and reduced-motion primitives. Base owns how a component applies those primitives to its anatomy and state changes. It must not duplicate shared motion constants under new names.

Add `@calebhill/animations` as a runtime dependency when the first exported animated component requires it. Consumers may orchestrate product-specific sequences locally. Changes to shared motion primitives must land and be verified in the animation package before Base or consumer migrations.

## 9. Figma parity

The Figma library must represent approved anatomy, variants, states, token intent, and accessibility annotations using names that map clearly to the public component model. The lab must demonstrate the same supported states in real code.

A public visual or state change must identify its Figma and lab impact. Update all affected artifacts in the same issue or record an explicit, temporary divergence with an owner and follow-up. Future Code Connect mappings should point from approved Figma components to the narrowest public Base component; they must not encode product wrappers as Base APIs.

## 10. AI change protocol

Agents must use this sequence for token, component, motion, or accessibility changes:

1. **Inspect** — read `DESIGN.md`, `README.md`, `AGENTS.md`, related source and tests, the lab, the Linear issue, relevant Figma nodes, and both supported consumers where public behavior is affected.
2. **Classify** — decide whether the request belongs to Base, `@calebhill/animations`, or a product. Keep product exceptions local.
3. **Propose** — state the boundary, public API or token impact, artifact owners, accessibility requirements, migration risk, and verification plan. Obtain approval when the decision is not already recorded.
4. **Implement** — begin with a failing contract or behavior test when executable behavior changes. Follow existing names and patterns; do not invent extra abstractions.
5. **Verify** — run `pnpm verify` and `pnpm tsc --noEmit`. Review the lab for visual/state changes. Test the packed artifact and affected consumers for public changes.
6. **Document** — update the lab, API guidance, Figma, release note or changeset, and this contract only where their owned decisions changed.
7. **Migrate** — land consumer updates explicitly after the package change. Do not claim completion while supported consumers depend on an incompatible contract.

## 11. Forbidden shortcuts and drift risks

Agents and contributors must not:

- invent a token, variant, icon, component, or abstraction only to finish a local task;
- copy product code into Base without removing product assumptions and reviewing the public API;
- import Next.js, Vercel, application aliases, product modules, or product types;
- require consumer Tailwind configuration, ship a CSS reset, or style global `body` behavior;
- duplicate motion primitives owned by `@calebhill/animations`;
- treat a screenshot, stale Figma node, lab example, or current implementation as universal approval;
- change code, Figma, or the lab while leaving a known contradiction undocumented;
- weaken tests, accessibility, types, or package boundaries to make a check pass;
- bundle unrelated product patterns into a component extraction; or
- make a public breaking change without versioning and consumer migration work.

## 12. Versioning, deprecation, and migration

Components progress through `unstable`, `beta`, `stable`, and `deprecated` lifecycle states. Stability must be visible in component documentation and release notes once component publishing begins. Experimental APIs may change during prereleases, but changes still require migration notes for active consumers.

Use semantic versioning: compatible additions are minor, compatible fixes are patch, and breaking stable API or token changes are major. Prerelease policy and trusted publishing are owned by CLB-705. Deprecation must name the replacement, document the migration, preserve the old path for an announced window, and verify both supported consumers before removal. Published versions are never overwritten.

## 13. Review checklist

- [ ] The Linear issue has scope, ownership, estimate, and acceptance criteria.
- [ ] The pattern is universal; product assumptions remain in the consumer.
- [ ] Public APIs, tokens, variants, and lifecycle impact are explicit.
- [ ] Native semantics, keyboard behavior, focus, contrast, names, states, and reduced motion are covered.
- [ ] Shared motion comes from `@calebhill/animations`.
- [ ] Tests began with the relevant failing behavior or contract.
- [ ] Figma and lab impact is implemented or tracked as an explicit divergence.
- [ ] `pnpm verify` and `pnpm tsc --noEmit` pass.
- [ ] The packed package and affected consumers are verified when public contracts change.
- [ ] Documentation, changeset or release notes, and migration steps are complete.
- [ ] The PR contains no unrelated product work; Linear is updated after merge.

## 14. Approved decisions and open questions

Approved now:

- The public package is `@calebhill/base` with React and React DOM as peers.
- Published CSS is framework-independent; Tailwind may be an internal build concern only.
- Public CSS provides token-only and complete stylesheet entry points.
- Light and dark defaults use the `data-base-theme` contract.
- `@calebhill/animations` owns shared motion primitives.
- `photos.me` and `calebhill.me` are the supported reference consumers.

Intentionally open:

- CLB-692 will approve the complete semantic token and typography vocabulary.
- Component lifecycle labels and documentation presentation will mature with the alpha slice.
- The canonical Figma file, library publication model, and Code Connect mapping are future approved work.
- CLB-705 owns the first prerelease version, dist-tag, and trusted publishing workflow.

An open question is not permission to guess. Record and resolve it in the owning issue before encoding a durable public contract.
