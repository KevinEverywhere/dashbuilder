# Planned Tickets

Forward-looking Jira ticket plan for RosettaDash.

**Rule:** Every change requires a **Jira ticket first**, then a **matching feature branch** (`feature/DAS-<n>-…`). One ticket at a time. See [Workflow & Branching](./07-workflow-and-branching.md) and `.cursor/rules/01-jira-ticket-and-branch.mdc`.

## Completed

| Ticket | Branch | Summary |
|--------|--------|---------|
| [DAS-1](https://planetkevin.atlassian.net/browse/DAS-1) | `feature/DAS-1-project-foundation` | Vision, architecture, workflow docs |
| [DAS-2](https://planetkevin.atlassian.net/browse/DAS-2) | `feature/DAS-2-monorepo-scaffold` | Nx monorepo: client, server, core |
| [DAS-3](https://planetkevin.atlassian.net/browse/DAS-3) | `feature/DAS-3-core-component-model` | Types, registry, schemas, validation |
| [DAS-4](https://planetkevin.atlassian.net/browse/DAS-4) | `feature/DAS-4-projects-api` | Projects/composites REST API |
| [DAS-5](https://planetkevin.atlassian.net/browse/DAS-5) | `feature/DAS-5-builder-shell` | Three-panel builder shell |
| [DAS-6](https://planetkevin.atlassian.net/browse/DAS-6) | `feature/DAS-6-canvas-persistence` | Canvas persistence + save |
| [DAS-7](https://planetkevin.atlassian.net/browse/DAS-7) | `feature/DAS-7-ci-baseline` | Lint, typecheck, verify scripts |
| [DAS-8](https://planetkevin.atlassian.net/browse/DAS-8) | `feature/DAS-8-playwright-e2e` | Playwright E2E + CI job |
| [DAS-9](https://planetkevin.atlassian.net/browse/DAS-9) | `feature/DAS-9-bindings-ui` | Canvas bindings UI |
| [DAS-10](https://planetkevin.atlassian.net/browse/DAS-10) | `feature/DAS-10-preview-renderers` | Preview renderers for P0 visuals |
| [DAS-11](https://planetkevin.atlassian.net/browse/DAS-11) | `feature/DAS-11-preview-mock-data` | Preview mock data API |
| [DAS-12](https://planetkevin.atlassian.net/browse/DAS-12) | `feature/DAS-12-filter-table-chart-flow` | Date range → table → chart preview |
| [DAS-13](https://planetkevin.atlassian.net/browse/DAS-13) | `feature/DAS-13-export-ir` | ExportIR builder |
| [DAS-14](https://planetkevin.atlassian.net/browse/DAS-14) | `feature/DAS-14-react-ui-exporter` | React UI exporter |
| [DAS-15](https://planetkevin.atlassian.net/browse/DAS-15) | `feature/DAS-15-nest-pg-exporter` | NestJS + PostgreSQL exporter |
| [DAS-16](https://planetkevin.atlassian.net/browse/DAS-16) | `feature/DAS-16-export-wizard` | Export wizard UI |
| [DAS-17](https://planetkevin.atlassian.net/browse/DAS-17) | `feature/DAS-17-ci-npm-lockfile` | CI npm 11 / lockfile fix |
| [DAS-18](https://planetkevin.atlassian.net/browse/DAS-18) | `feature/DAS-18-angular-ui-exporter` | Angular UI exporter |
| [DAS-19](https://planetkevin.atlassian.net/browse/DAS-19) | `feature/DAS-19-export-wizard-ui-targets` | Export wizard React/Angular picker |
| [DAS-20](https://planetkevin.atlassian.net/browse/DAS-20) | `feature/DAS-20-vue-ui-exporter` | Vue UI exporter |
| [DAS-21](https://planetkevin.atlassian.net/browse/DAS-21) | `feature/DAS-21-export-wizard-ui-polish` | Export wizard UI polish |
| [DAS-22](https://planetkevin.atlassian.net/browse/DAS-22) | `feature/DAS-22-express-server-exporter` | Express server exporter |
| [DAS-23](https://planetkevin.atlassian.net/browse/DAS-23) | `feature/DAS-23-next-server-exporter` | Next.js server exporter |
| [DAS-24](https://planetkevin.atlassian.net/browse/DAS-24) | `feature/DAS-24-nuxt-server-exporter` | Nuxt server exporter |
| [DAS-25](https://planetkevin.atlassian.net/browse/DAS-25) | `feature/DAS-25-svelte-ui-exporter` | Svelte UI exporter |
| [DAS-26](https://planetkevin.atlassian.net/browse/DAS-26) | `feature/DAS-26-export-wizard-server-targets` | Export wizard server target picker |
| [DAS-27](https://planetkevin.atlassian.net/browse/DAS-27) | `feature/DAS-27-mongodb-exporter` | MongoDB database exporter |
| [DAS-28](https://planetkevin.atlassian.net/browse/DAS-28) | `feature/DAS-28-supabase-exporter` | Supabase database exporter |
| [DAS-29](https://planetkevin.atlassian.net/browse/DAS-29) | `feature/DAS-29-export-wizard-database-targets` | Export wizard database target picker |
| [DAS-30](https://planetkevin.atlassian.net/browse/DAS-30) | `feature/DAS-30-mysql-exporter` | MySQL database exporter |
| [DAS-31](https://planetkevin.atlassian.net/browse/DAS-31) | `feature/DAS-31-export-target-matrix-tests` | Export target matrix testing |
| [DAS-32](https://planetkevin.atlassian.net/browse/DAS-32) | `feature/DAS-32-defaults-engine` | Defaults engine + inspector suggestions |
| [DAS-33](https://planetkevin.atlassian.net/browse/DAS-33) | `feature/DAS-33-domain-context` | Domain context on composites, preview, ExportIR |
| [DAS-34](https://planetkevin.atlassian.net/browse/DAS-34) | `feature/DAS-34-role-visibility` | Role visibility in builder + export stubs |
| [DAS-35](https://planetkevin.atlassian.net/browse/DAS-35) | `feature/DAS-35-scoped-query-filters` | Scoped query filters in exporters |
| [DAS-36](https://planetkevin.atlassian.net/browse/DAS-36) | `feature/DAS-36-onboarding-template` | Onboarding composite template + export stubs |
| [DAS-37](https://planetkevin.atlassian.net/browse/DAS-37) | `feature/DAS-37-docker-local-containers` | Docker Compose local dev + Jira/branch workflow enforcement |
| [DAS-38](https://planetkevin.atlassian.net/browse/DAS-38) | `feature/DAS-38-component-page-design-plan` | Docs refresh + component/page design planning |
| [DAS-39](https://planetkevin.atlassian.net/browse/DAS-39) | `feature/DAS-39-p1-form-inputs` | P1 form inputs (number, checkbox, textarea) |
| [DAS-40](https://planetkevin.atlassian.net/browse/DAS-40) | `feature/DAS-40-page-template-library` | Page template library + e2e port prep |
| [DAS-41](https://planetkevin.atlassian.net/browse/DAS-41) | `feature/DAS-41-export-wizard-scope` | Export wizard full / single / selection scopes |
| [DAS-42](https://planetkevin.atlassian.net/browse/DAS-42) | `feature/DAS-42-canvas-layout-polish` | Canvas snap, resize, multi-select |
| [DAS-43](https://planetkevin.atlassian.net/browse/DAS-43) | `feature/DAS-43-component-grouping-guides` | Grouping guides + companion prompts |
| [DAS-44](https://planetkevin.atlassian.net/browse/DAS-44) | `feature/DAS-44-palette-accordion-groups` | Palette functional accordion groups |
| [DAS-45](https://planetkevin.atlassian.net/browse/DAS-45) | `feature/DAS-45-undo-redo` | Builder undo/redo |
| [DAS-46](https://planetkevin.atlassian.net/browse/DAS-46) | `feature/DAS-46-pie-chart-flex-layout` | Pie chart + flex layout |
| [DAS-47](https://planetkevin.atlassian.net/browse/DAS-47) | `feature/DAS-47-detail-panel` | Detail panel for table drill-down |
| [DAS-48](https://planetkevin.atlassian.net/browse/DAS-48) | `feature/DAS-48-time-preset` | Domain time preset filter |
| [DAS-49](https://planetkevin.atlassian.net/browse/DAS-49) | `feature/DAS-49-skeleton` | Loading skeleton visual component |
| [DAS-50](https://planetkevin.atlassian.net/browse/DAS-50) | `feature/DAS-50-logic-timer` | Logic timer + Phase 6 doc closeout |
| [DAS-51](https://planetkevin.atlassian.net/browse/DAS-51) | `feature/DAS-51-builder-auth` | Optional builder API key authentication |
| [DAS-52](https://planetkevin.atlassian.net/browse/DAS-52) | `feature/DAS-52-composite-version-diff` | Composite version history and diff |
| [DAS-53](https://planetkevin.atlassian.net/browse/DAS-53) | `feature/DAS-53-large-composite-performance` | Large composite performance optimizations |
| [DAS-54](https://planetkevin.atlassian.net/browse/DAS-54) | `feature/DAS-54-exporter-plugin-sdk-docs` | Exporter plugin SDK documentation |
| [DAS-55](https://planetkevin.atlassian.net/browse/DAS-55) | `feature/DAS-55-custom-component-sdk` | Custom component SDK for palette and preview plugins |
| [DAS-56](https://planetkevin.atlassian.net/browse/DAS-56) | `feature/DAS-56-threejs-visual` | First three.js visual — 3D bar chart + VR palette group |
| [DAS-57](https://planetkevin.atlassian.net/browse/DAS-57) | `feature/DAS-57-project-stack-setup` | Framework-first project stack entry screen |
| [DAS-58](https://planetkevin.atlassian.net/browse/DAS-58) | `feature/DAS-58-3d-scatter-field-mapping` | 3D scatter rowset field mapping + React export stub |
| [DAS-59](https://planetkevin.atlassian.net/browse/DAS-59) | `feature/DAS-59-welcome-stack-page` | Welcome page with tech stack selection above builder |
| [DAS-60](https://planetkevin.atlassian.net/browse/DAS-60) | `feature/DAS-60-3d-scene-point-cloud` | 3D scene rowset point-cloud field mapping + React export stub |
| [DAS-61](https://planetkevin.atlassian.net/browse/DAS-61) | `feature/DAS-61-multi-target-3d-export-stubs` | Multi-target 3D export stubs (Vue, Svelte, Angular) |
| [DAS-62](https://planetkevin.atlassian.net/browse/DAS-62) | `feature/DAS-62-gltf-model-host` | GLTF model host preview + multi-target export stubs |
| [DAS-63](https://planetkevin.atlassian.net/browse/DAS-63) | `feature/DAS-63-geo-globe` | 3D geo globe lat/lng markers + multi-target export stubs |
| [DAS-64](https://planetkevin.atlassian.net/browse/DAS-64) | `feature/DAS-64-stack-styling-selection` | Stack styling / CSS framework in project stack profile |
| [DAS-65](https://planetkevin.atlassian.net/browse/DAS-65) | `feature/DAS-65-welcome-stack-none-options` | Welcome None server/database, heading, server ecosystem copy |
| [DAS-66](https://planetkevin.atlassian.net/browse/DAS-66) | `feature/DAS-66-mobile-tablet-viewport-gate` | Minimum viewport gate and unified availability UX |
| [DAS-67](https://planetkevin.atlassian.net/browse/DAS-67) | `feature/DAS-67-compact-builder-layout` | Collapsible palette/inspector for tablet and small desktop |
| [DAS-69](https://planetkevin.atlassian.net/browse/DAS-69) | `feature/DAS-69-builder-creation-assistance` | Animated builder guides for all palette components (Phase 18) |
| [DAS-70](https://planetkevin.atlassian.net/browse/DAS-70) | `feature/DAS-70-byok-key-management` | BYOK key management — unified `/environment` page, encrypted storage, validation (Phase 19) |
| [DAS-71](https://planetkevin.atlassian.net/browse/DAS-71) | `feature/DAS-71-app-lock-and-content-library` | App lock for env secrets + welcome stack reset |
| [DAS-72](https://planetkevin.atlassian.net/browse/DAS-72) | `feature/DAS-72-app-lock-recovery-codes` | App lock recovery codes + forgot-password reset |

## Active work

| Ticket | Branch | Status |
|--------|--------|--------|
| [DAS-160](https://planetkevin.atlassian.net/browse/DAS-160) | `feature/DAS-160-readme-truth-and-npm-release` | Root README as current truth; npm/GitHub publish docs and `publish:npm` / `publish:npm:dry-run` |
| [DAS-74](https://planetkevin.atlassian.net/browse/DAS-74) | `feature/DAS-74-admin-control-panel` | Admin control panel + content library |
| [DAS-90](https://planetkevin.atlassian.net/browse/DAS-90) | `feature/DAS-90-npm-package-prep` | npm prep docs (`rosettadash` public API) — docs only |

## npm library follow-ups (after DAS-90 docs; see [Post–DAS-90 plan](./36-npm-post-90-plan.md))

| Ticket | Summary |
|--------|---------|
| [DAS-91](https://planetkevin.atlassian.net/browse/DAS-91) | Build + identical `exports` for runtime packages — **done** |
| [DAS-92](https://planetkevin.atlassian.net/browse/DAS-92) | Public `--rd-*` / `rd-*` stylesheet contract — **done** |
| [DAS-93](https://planetkevin.atlassian.net/browse/DAS-93) | Full taxonomy on all runtime packages @ **0.1.1** — **in progress** (`feature/DAS-93-runtime-taxonomy-0-1-1-gate`) |
| [DAS-94](https://planetkevin.atlassian.net/browse/DAS-94) | Hand-maintained recipe helpers (`LinkList`, `AccordionLinkList`) — **done** |
| [DAS-95](https://planetkevin.atlassian.net/browse/DAS-95) | E2E: compact layout `openBuilder` palette-ready race |
| [DAS-98](https://planetkevin.atlassian.net/browse/DAS-98) | Per-framework Storybook catalogs — **done** |
| [DAS-99](https://planetkevin.atlassian.net/browse/DAS-99) | npm consumer install path — **done**; scoped `@0.0.1` publish via `npm run publish:npm` |
| [DAS-104](https://planetkevin.atlassian.net/browse/DAS-104) | React runtime integration — native accordion parity, CE hosts + WasmMedia, stack styling guides — **done** |
| [DAS-105](https://planetkevin.atlassian.net/browse/DAS-105) | Storybook meta compositions — live dashboards covering all components — **done** |
| [DAS-106](https://planetkevin.atlassian.net/browse/DAS-106) | Storybook palette cleanup — meta composition deep links and VR/3D live previews — **done** |
| [DAS-107](https://planetkevin.atlassian.net/browse/DAS-107) | Meta compositions three-panel view — diagram, live preview, component XML — **done** |
| [DAS-108](https://planetkevin.atlassian.net/browse/DAS-108) | Storybook getting started — hero intro, component index, sidebar reorder — **done** |
| [DAS-109](https://planetkevin.atlassian.net/browse/DAS-109) | Storybook WASM compute lab — live Rust/Node/React sandbox in meta composition — **done** |
| [DAS-110](https://planetkevin.atlassian.net/browse/DAS-110) | Storybook sidebar tightening — retire redundant Layout/Visual/Recipes/Wasm atom stories (web-components) — **done** |
| [DAS-111](https://planetkevin.atlassian.net/browse/DAS-111) | Docs & README sync — current ticket, Storybook examples, backlog refresh — **done** |
| [DAS-112](https://planetkevin.atlassian.net/browse/DAS-112) | Per-framework Storybook sidebar alignment (React, Vue, Angular, Svelte) — **done** |
| [DAS-113](https://planetkevin.atlassian.net/browse/DAS-113) | Storybook meta composition tightening — panel tabs and selection highlighting — **done** |
| [DAS-114](https://planetkevin.atlassian.net/browse/DAS-114) | Storybook Controls, Actions, and Interactions — operationalize addon panels — **done** |
| [DAS-115](https://planetkevin.atlassian.net/browse/DAS-115) | Storybook taxonomy docs sync — README, npm package READMEs, catalog docs — **in progress** (`feature/DAS-115-storybook-taxonomy-docs-sync`) |
| [DAS-116](https://planetkevin.atlassian.net/browse/DAS-116) | `@rosettadash/react` full taxonomy @ 0.1.1 — **done** (merged to `development`) |
| [DAS-117](https://planetkevin.atlassian.net/browse/DAS-117) | `@rosettadash/angular` full taxonomy @ 0.1.1 — **done** (merged to `development`) |
| [DAS-118](https://planetkevin.atlassian.net/browse/DAS-118) | `@rosettadash/vue` full taxonomy @ 0.1.1 — **done** (merged to `development`) |
| [DAS-119](https://planetkevin.atlassian.net/browse/DAS-119) | `@rosettadash/svelte` full taxonomy @ 0.1.1 — **done** (merged to `development`) |

### DAS-93 deferred follow-ups (post epic merge)

| Item | Scope | Notes |
|------|-------|-------|
| Angular runtime TestBed specs | `@rosettadash/angular` | Match React RTL depth (deferred) |
| Storybook runtime catalog smoke | ports 6007–6010 | Spot-check generated atoms (deferred) |
| **Destination Atlas proof apps** | [DAS-120](https://planetkevin.atlassian.net/browse/DAS-120) | Five **identical** Nx apps under `apps/` — current/historic world-location explorer (not kitchen sink): [DAS-121](https://planetkevin.atlassian.net/browse/DAS-121) WC, [DAS-122](https://planetkevin.atlassian.net/browse/DAS-122) React, [DAS-123](https://planetkevin.atlassian.net/browse/DAS-123) Angular, [DAS-124](https://planetkevin.atlassian.net/browse/DAS-124) Vue, [DAS-125](https://planetkevin.atlassian.net/browse/DAS-125) Svelte. Research [DAS-126](https://planetkevin.atlassian.net/browse/DAS-126); gap WC [DAS-127](https://planetkevin.atlassian.net/browse/DAS-127)–[129](https://planetkevin.atlassian.net/browse/DAS-129). About + ScrollRegion: [DAS-130](https://planetkevin.atlassian.net/browse/DAS-130). Authoring tab shell: [DAS-131](https://planetkevin.atlassian.net/browse/DAS-131). Authoring sphere + ffmpeg.wasm: [DAS-132](https://planetkevin.atlassian.net/browse/DAS-132). Client routing: [DAS-134](https://planetkevin.atlassian.net/browse/DAS-134). Consumer BYOK: [DAS-135](https://planetkevin.atlassian.net/browse/DAS-135). Env reference: [DAS-136](https://planetkevin.atlassian.net/browse/DAS-136). See [docs/43](./43-destination-atlas-proof-apps.md). |

**DAS-93 gate (this branch):** extend `pack:consumer` + `publish:npm` for all six scoped packages @ 0.1.1; pin runtime `web-components` deps; framework export parity (116–119 merged).

**Order:** merge DAS-90 → DAS-91 → DAS-92 → DAS-94 + DAS-116–119 → **DAS-93 gate** → publish `0.1.1` → DAS-120 proof apps.

## Planned (not yet ticketed)

| Phase | Summary | Doc |
|-------|---------|-----|
| Post–DAS-93 | **[DAS-120](https://planetkevin.atlassian.net/browse/DAS-120)** Destination Atlas — five identical proof apps; provider-selectable geo-map; app-language-select for developer i18n | DAS-121–125, DAS-126–129 · [docs/43](./43-destination-atlas-proof-apps.md) |
| 20 — AI assist | Natural-language component creation in builder | [AI & BYOK Integration](./20-ai-and-byok-integration.md) |
| 21 — Demo dashboards | Three animated example dashboards (discuss before build) | [Demo Dashboards](./22-demo-dashboards.md) |

## Delivery status

- **Phases 0–3 (foundation → export MVP):** complete (DAS-1–DAS-16)
- **Phase 4 multi-target export:** complete (DAS-17–DAS-31)
- **Phase 5 smart defaults & domain:** complete (DAS-32–DAS-36)
- **Docker local containers:** complete (DAS-37)
- **Phase 6 component & page design:** complete (DAS-39–DAS-49)
- **Phase 8 component plugins & 3D:** complete (DAS-55–DAS-56)
- **Phase 9 project stack setup:** complete (DAS-57)
- **Phase 10 VR / 3D expansion:** DAS-58 and DAS-60 complete on branch
- **Phase 11 welcome & entry:** complete (DAS-59)
- **Phase 12 multi-target 3D export:** complete (DAS-61, DAS-62)
- **Phase 13 geo globe:** complete (DAS-63)
- **Phase 14 stack styling:** complete (DAS-64)
- **Phase 15 display availability:** complete (DAS-66)
- **Phase 16 compact builder layout:** complete (DAS-67)
- **Phase 17 welcome onboarding UX:** complete (DAS-68)
- **Phase 18 builder creation assistance:** complete (DAS-69)
- **Phase 19 BYOK key management:** complete (DAS-70)
- **DAS-71 app lock:** complete (merged); content library remains on DAS-71
- **DAS-72 app lock recovery codes:** complete (branch ready)
- **DAS-73 AI assist drawer:** complete
- **DAS-74 admin control panel:** in progress
- **Phase 21 animated demo dashboards:** planned — discuss after Phase 20

## Phase 6 — complete

See [Component & Page Design](./15-component-and-page-design.md) for patterns. All planned Phase 6 tickets shipped:

1. ~~P1 form inputs (number, checkbox, textarea)~~ — DAS-39
2. ~~Page template library (analytics, CRUD, settings)~~ — DAS-40
3. ~~Export wizard: single/selection modes~~ — DAS-41
4. ~~Canvas layout polish (snap, resize, multi-select)~~ — DAS-42
5. ~~Undo/redo~~ — DAS-45
6. ~~Pie chart + flex layout~~ — DAS-46
7. ~~Detail panel~~ — DAS-47
8. ~~`domain.time-preset`~~ — DAS-48
9. ~~`visual.skeleton`~~ — DAS-49
10. ~~Component grouping guides & animated placement hints~~ — DAS-43
11. ~~Palette accordion reorganization (2–7 items per group)~~ — DAS-44

## Phase 7 — complete

1. ~~`logic.timer`~~ — DAS-50
2. ~~Builder authentication~~ — DAS-51
3. ~~Project versioning and diff~~ — DAS-52
4. ~~Large composite performance~~ — DAS-53
5. ~~Exporter plugin SDK documentation~~ — DAS-54

See [Exporter Plugin SDK](./16-exporter-plugin-sdk.md) for extending code generators.

## Phase 8 — complete

1. ~~Custom component SDK~~ — DAS-55
2. ~~First three.js visual (3D bar chart + VR group)~~ — DAS-56

See [Component Plugin SDK](./17-component-plugin-sdk.md).

## Phase 9 — complete

1. ~~Framework-first entry screen + `any` scratch-pad mode~~ — DAS-57

Stack selection moves upstream: UI framework (or **Any**) at the top level, then compatible server/database partners as second-level defaults. Persisted on the project; export wizard and builder read from it.

## Phase 10 — VR / 3D expansion (complete)

1. ~~3D scatter rowset field mapping~~ — DAS-58
2. ~~3D scene point-cloud field mapping~~ — DAS-60

## Phase 11 — Welcome & entry (complete)

1. ~~Welcome page with tech stack selection above builder~~ — DAS-59

## Phase 12 — Multi-target 3D export (complete)

1. ~~Vue/Svelte/Angular 3D export stubs~~ — DAS-61
2. ~~GLTF model host preview + export stubs~~ — DAS-62

## Phase 13 — Geo globe (complete)

1. ~~3D geo globe lat/lng marker mapping + export stubs~~ — DAS-63

## Phase 14 — Stack styling (complete)

1. ~~CSS / styling framework in project stack profile (extends DAS-57)~~ — DAS-64

## Phase 15 — Display availability (complete)

1. ~~Minimum 1024px landscape viewport gate + unified fallback UX~~ — DAS-66
2. [Display Availability](./19-display-availability.md) documentation

## Phase 16 — Compact builder layout (complete)

1. Collapsible palette/inspector drawers for 1024–1280px viewports — DAS-67

## Phase 17 — Welcome onboarding UX (complete)

1. Empty initial stack state, gated continue, returning-user confirmations — DAS-68

## Phase 18 — Builder creation assistance (complete)

1. Animated multi-step guides for all palette components — DAS-69

See [Builder Creation Assistance](./21-builder-creation-assistance.md).

## Phase 19 — BYOK key management (complete)

1. Client-side provider API key storage and settings UI — DAS-70

See [AI & BYOK Integration](./20-ai-and-byok-integration.md).

## DAS-73 — AI assist drawer (in progress)

1. Ollama-first AI drawer, structured graph actions, BYOK cloud — DAS-73

See [AI & BYOK Integration](./20-ai-and-byok-integration.md).

## DAS-72 — App lock recovery codes (complete)

1. Recovery codes, password hint, forgot-password reset — DAS-72

See [App Lock](./24-app-lock.md).

## DAS-71 — Content library (planned)

1. User-controlled content library — [spec](./23-content-library.md)

See [Content Library](./23-content-library.md).

## Phase 20 — AI-assisted component creation (in progress)

1. AI assistant drawer, structured graph actions, Ollama free local + BYOK cloud — DAS-73

See [AI & BYOK Integration](./20-ai-and-byok-integration.md).

## Phase 21 — Animated demo dashboards (planned)

1. Three purpose-built dashboards with animated walkthroughs — discuss after Phase 20

See [Demo Dashboards](./22-demo-dashboards.md).

## Future — VR / 3D expansion

- (none scheduled)

## Related documents

- [Roadmap](./10-roadmap.md)
- [Component & Page Design](./15-component-and-page-design.md)
- [Workflow & Branching](./07-workflow-and-branching.md)
- [Component Model](./03-component-model.md)
