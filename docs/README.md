# RosettaDash Documentation

Foundational documents for the RosettaDash project. Start with the vision doc, then architecture, then dive into specifics.

## Ticket plan

See **[Planned Tickets](./11-planned-tickets.md)** for the full Jira ticket list (DAS-1–DAS-38).

**Workflow:** Jira ticket → matching branch → implement. Never skip. See [Workflow & Branching](./07-workflow-and-branching.md).

## Reading order

1. [Vision & Product Overview](./01-vision-and-product-overview.md) — what we're building and why
2. [Architecture](./02-architecture.md) — system design
3. [Component Model](./03-component-model.md) — how components and composites work
4. [Export Pipeline](./04-export-pipeline.md) — code generation flow
5. [Domain Model](./05-domain-model.md) — dashboard business context
6. [Technology Stack](./06-technology-stack.md) — chosen technologies
7. [Workflow & Branching](./07-workflow-and-branching.md) — Jira + branch gate (mandatory)
8. [Component Taxonomy](./08-component-taxonomy.md) — palette inventory
9. [Glossary](./09-glossary.md) — terms
10. [Roadmap](./10-roadmap.md) — phased delivery
11. [Planned Tickets](./11-planned-tickets.md) — Jira ticket index
12. [CI and Hosting](./12-ci-and-hosting.md) — GitHub Actions, Nx, Pages
13. [Local Development & Components](./13-local-development-and-components.md) — startup, e2e, adding components
14. [Docker Containers](./14-docker-containers.md) — run locally with Docker Compose
15. [Component & Page Design](./15-component-and-page-design.md) — single components, page patterns, implementation plan
16. [Exporter Plugin SDK](./16-exporter-plugin-sdk.md) — adding UI/server/database code generators
17. [Component Plugin SDK](./17-component-plugin-sdk.md) — registering custom palette and preview components
18. [Display Availability](./19-display-availability.md) — phone/tablet/desktop tiers and builder gating
19. [AI & BYOK Integration](./20-ai-and-byok-integration.md) — BYOK key management and AI-assisted creation (Phases 19–20)
20. [Builder Creation Assistance](./21-builder-creation-assistance.md) — animated guides for common components (Phase 18, DAS-69)
21. [Demo Dashboards](./22-demo-dashboards.md) — three animated example dashboards (Phase 21, post–Phase 20)
22. [Content Library](./23-content-library.md) — user-controlled save/revisit (DAS-71, spec)
23. [App Lock](./24-app-lock.md) — optional local password for env secrets (DAS-71)
24. [Admin Control Panel](./25-admin-control-panel.md) — content library hub (DAS-74)
25. [App component CSS convention](./28-app-component-css-convention.md) — `app-*` BEM classes and shared collapsible primitive
26. [Stack server & database validation](./29-stack-server-database-validation.md) — UI-filtered server/database options (DAS-78)
27. [npm package prep](./33-npm-package-prep.md) — product vs scoped vendor imports, exports map (DAS-90)
28. [Public component API](./34-public-component-api.md) — `@rosettadash/<vendor>/<group>/<component>`, recipes (DAS-90)
29. [Styling and classnames](./35-styling-and-classnames.md) — `rd-*` / `--rd-*`, minimal opt-in styles (DAS-90)
30. [Post–DAS-90 plan](./36-npm-post-90-plan.md) — delivery order after npm docs (DAS-90)
31. [npm library build](./37-npm-library-build.md) — runtime packages + exports + pack (DAS-91)
32. [React runtime integration](./40-react-runtime-integration.md) — native React + CE hosts, refs (DAS-104)
33. [Stack styling guides](./41-stack-styling-guides.md) — Tailwind, CSS Modules, MUI, plain CSS (DAS-104)
34. [Storybook meta components](./42-storybook-meta-compositions.md) — live dashboard demos for all components (DAS-105)
35. [Storybook component catalog](./38-storybook-component-catalog.md) — per-runtime Storybook apps and ports (DAS-98)
36. [npm consumer install](./39-npm-consumer-install.md) — scoped packages for ffmp3Console & siblings (DAS-99)
37. [Destination Atlas proof apps](./43-destination-atlas-proof-apps.md) — DAS-120 consumer demos (five runtimes)

## Active work

See [Planned Tickets](./11-planned-tickets.md) for the full backlog.

Recently closed: DAS-112–115 (framework Storybook alignment, Controls/Interactions, taxonomy docs sync).

## Current capabilities (at a glance)

| Capability | Status |
|------------|--------|
| Visual builder (palette, canvas, inspector, save/load) | Shipped |
| Bindings + live preview (P0 components) | Shipped |
| Multi-target export (React/Angular/Vue/Svelte + 4 servers + 4 DBs) | Shipped |
| Defaults engine, domain context, role visibility | Shipped |
| Display availability gate (phone / tablet portrait) | Shipped (DAS-66) |
| Compact builder layout (tablet / small desktop) | Shipped (DAS-67) |
| Welcome onboarding UX (empty stack, confirmations) | Shipped (DAS-68) |
| Builder creation assistance (animated guides) | Shipped (DAS-69) |
| BYOK key management | Shipped (DAS-70, Phase 19) |
| App lock (local env password) | Shipped (DAS-71); recovery codes in progress (DAS-72) |
| AI-assisted component creation | Shipped (DAS-73) |
| Admin control panel + content library | DAS-74 — in progress |
| Animated demo dashboards (3 examples) | Phase 21 — planned after Phase 20 |
| Docker Compose local dev | Shipped |
| Scoped npm `@rosettadash/*` | **0.1.3** on the registry (core, web-components, react, angular, vue, svelte) |
| Per-runtime Storybook catalogs (ports 6006–6010) | Shipped (DAS-98); sidebar tightened (DAS-110); framework alignment (DAS-112); docs sync (DAS-115) |
| Full taxonomy + page template library | Phase 6 — complete |
| Phase 7 production hardening | Complete (DAS-50–DAS-54) |
| Phase 8 component plugins & 3D | Complete (DAS-55–DAS-56) |
