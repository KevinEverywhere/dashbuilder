# Component & Page Design

Planning guide for **single components** and **pages built from component groups**. This doc reflects what RosettaDash ships today (DAS-1–DAS-37) and how we expand the palette and composite patterns next.

## Current project state (summary)

| Area | Status |
|------|--------|
| Builder shell (palette, canvas, inspector, save/load) | Shipped |
| Bindings UI + preview renderers (P0 visuals) | Shipped |
| Mock preview data API | Shipped |
| Export IR + multi-target exporters (4 UI × 4 server × 4 DB) | Shipped |
| Defaults engine + domain context + role visibility | Shipped |
| Onboarding composite template | Shipped |
| Docker Compose local dev | Shipped (DAS-37) |
| Single-component export mode in wizard | Shipped (DAS-41) — full / single / selection scopes |
| Page templates library | Shipped (DAS-40) — analytics, CRUD, settings, empty |
| Canvas snap, resize, multi-select | Shipped (DAS-42) |
| Grouping guides & animated hints | Shipped (DAS-43) |
| Palette accordion groups (2–7 rule) | DAS-44 |

**Registry source of truth:** `packages/core/src/lib/registry/p0-components.ts` plus `*-component-plugins.ts` (**60 types** — see [Component Taxonomy snapshot](./08-component-taxonomy.md#shipped-registry-snapshot)).

---

## Part 1 — Designing a single component

A **single component** is one node in the composite graph: one type key, property schema, ports, preview renderer, and exporter template(s).

### Design checklist

When adding or refining a component, define each layer:

| Layer | Location | Question to answer |
|-------|----------|-------------------|
| **Type & schema** | `packages/core` — registry + validation | What is the `type` key? Which properties and ports? Required vs optional? |
| **Palette** | Auto from registry | Label, category, description for sidebar |
| **Preview** | `apps/client/.../preview/` | How does it behave with mock data and bindings? |
| **Export (UI)** | `packages/exporters-{react,angular,vue,svelte}` | Idiomatic template for each framework |
| **Export (infra)** | `packages/exporters-{nest,express,next,nuxt,...}` | Only for infrastructure types |
| **Tests** | Unit + e2e `data-testid` | Registry validation, exporter output, builder smoke |

### Anatomy (recap)

Every component node has:

- **`type`** — stable string, e.g. `visual.table`, `domain.role-gate`
- **`properties`** — schema-driven inspector fields
- **`ports`** — typed inputs/outputs for bindings (`rowset`, `string`, `event`, etc.)
- **`layout`** — canvas position (visual nodes only)
- **`meta`** — optional hints (defaults engine, framework notes)

See [Component Model](./03-component-model.md) for graph-level detail.

### Single-component export

**Export scopes** in the wizard: **Full composite**, **Selected node** (primary selection + upstream deps), **Selection neighborhood** (all selected nodes + binding-connected subgraph). Multi-select on the canvas (Shift+click) feeds multiple seed nodes into scoped export.

Export modes (see [Component Model — Piecemeal vs grouped export](./03-component-model.md#piecemeal-vs-grouped-export)):

| Mode | Delivers | Use when |
|------|----------|----------|
| **Single node** | One component + minimal deps | Dropping a KPI card or invite form into an existing app |
| **Selection** | Selected nodes + internal bindings + required infra | A filter + table pair without the full page |
| **Full composite** | Entire graph as a page/module | Shipping a complete dashboard screen |

**Implementation note:** The export wizard exposes full, single-node, and selection-neighborhood scopes via `resolveExportComposite` in `packages/core`.

### P0 components — implemented today

These types are registered, previewable, and covered by exporters (visual → UI exporters; infra → server/DB exporters):

| Type key | Role |
|----------|------|
| `visual.input.text` | Single-line input |
| `visual.input.select` | Dropdown (options port) |
| `visual.input.number` | Numeric input (min/max/step) |
| `visual.input.checkbox` | Boolean toggle |
| `visual.input.textarea` | Multi-line text |
| `visual.input.date-range` | Time filter driver |
| `visual.table` | Data table |
| `visual.detail` | Row drill-down detail panel |
| `visual.kpi` | Single metric card |
| `visual.chart.line` | Line chart |
| `visual.chart.bar` | Bar chart |
| `visual.chart.pie` | Pie / donut chart |
| `layout.grid` | Responsive layout container |
| `layout.flex` | Flex row/column layout container |
| `layout.tabs` | Tabbed regions |
| `layout.modal` | Dialog shell |
| `domain.role-gate` | Role-based visibility wrapper |
| `domain.person-invite` | Onboarding invite form |
| `domain.role-assign` | Onboarding role confirmation |
| `infra.env` | Env var definitions |
| `infra.postgresql` | PostgreSQL connection |
| `infra.mongodb` | MongoDB connection |
| `infra.supabase` | Supabase connection |
| `infra.mysql` | MySQL connection |
| `infra.server.nest` | NestJS server target |
| `infra.server.express` | Express server target |
| `infra.server.next` | Next.js server target |
| `infra.server.nuxt` | Nuxt server target |

### Next single components (suggested P1 order)

1. ~~`visual.input.number`, `visual.input.checkbox`, `visual.input.textarea`~~ — shipped (DAS-39)
2. ~~`visual.chart.pie`~~ — shipped (DAS-46)
3. ~~`layout.flex`~~ — shipped (DAS-46)
4. ~~`visual.detail`~~ — shipped (DAS-47)
5. ~~`domain.time-preset`~~ — shipped (DAS-48)
6. ~~`visual.skeleton`~~ — shipped (DAS-49)

P1 component expansion from the suggested order is **complete**. Next components come from Phase 7 / P2 taxonomy (starting with `logic.timer`, DAS-50).

---

## Part 2 — Designing pages from component groups

A **page** (full composite) is a persisted graph: visual + layout + domain + infrastructure nodes with bindings. Users assemble pages on the canvas; export produces a routable screen plus server/DB stubs.

### Page layers

Think in four layers when designing a page composite:

```
┌─────────────────────────────────────────────────────────┐
│  Domain layer     role gates, client/project context    │
├─────────────────────────────────────────────────────────┤
│  Layout layer     grid, tabs, modal, header (future)    │
├─────────────────────────────────────────────────────────┤
│  Content layer    tables, charts, KPIs, forms           │
├─────────────────────────────────────────────────────────┤
│  Filter layer     date range, selects, time presets     │
└─────────────────────────────────────────────────────────┘
         │ bindings (rowset, events, visibility)
         ▼
┌─────────────────────────────────────────────────────────┐
│  Infrastructure   DB + server + env (invisible nodes)   │
└─────────────────────────────────────────────────────────┘
```

### Reference pattern — analytics overview page

Typical **filter → table + chart** dashboard (validated by DAS-12 e2e):

| Node | Role |
|------|------|
| `visual.input.date-range` | Drives time context |
| `visual.table` | Rowset display; bound to date filter |
| `visual.chart.line` or `visual.chart.bar` | Aggregated series; bound to same filter |
| `layout.grid` | Places filter, KPI row, table, chart |
| `infra.postgresql` + `infra.server.nest` + `infra.env` | Export targets |

Binding flow:

```
[date-range] ──range──► [table.dataFilter]
[date-range] ──range──► [chart.dataFilter]
[postgresql] ──rowset──► [table.data]
[postgresql] ──rowset──► [chart.data]
```

### Reference pattern — onboarding page

Shipped as **onboarding template** (DAS-36):

| Node | Role |
|------|------|
| `domain.person-invite` | Collect email / invite |
| `domain.role-assign` | Confirm role assignment |
| `layout.tabs` or `layout.grid` | Step layout |
| `domain.role-gate` | Admin-only sections (optional) |
| Server + env infra | Export stubs for invite/assign API routes |

### Reference pattern — role-scoped admin page

| Node | Role |
|------|------|
| `domain.role-gate` | Wraps admin-only panels |
| `visual.table` | Persons or settings list |
| `domain.client-select` / `domain.project-select` | Future — scope selectors |
| Preview role switch | Builder tests visibility (DAS-34) |

### Page design rules

1. **One primary data source per page** unless explicitly multi-source — keeps export IR and scoped queries predictable (DAS-35).
2. **Filters at the top of the binding graph** — date range and selects propagate downward; avoid circular data dependencies.
3. **Infrastructure closure** — every data-bound visual must trace to a DB node; every API route traces to a server node; env keys centralized in `infra.env`.
4. **Role gates wrap layout subtrees**, not individual port bindings — export stubs emit conditional render or route guards.
5. **Name composites for the page intent** — e.g. `Revenue Overview`, `Team Onboarding`; description documents target route and roles.

### Page templates (shipped)

Reusable starting graphs applied from the builder toolbar (**Select template → Apply template**):

| Template ID | Components | Target persona |
|-------------|------------|----------------|
| `onboarding` | person-invite, role-assign, KPI, infra | Admin |
| `analytics-overview` | date-range, KPI × 2, table, line chart, infra | Viewer / editor |
| `crud-list` | table, modal, text input, infra | Editor |
| `settings-admin` | role-gate, table, text input, infra | Admin |
| `empty-starter` | grid, env, postgres, nest | Custom |

Fixtures live in `packages/core/src/lib/templates/`. Register new templates in `composite-template-registry.ts`.

---

## Part 3 — Implementation planning

### Phase 6 — recommended ticket order

Create a Jira ticket **before** each branch:

1. ~~**P1 form inputs** — number, checkbox, textarea (registry + preview + React)~~ — DAS-39
2. ~~**Page template library** — apply template from builder; 5 fixtures~~ — DAS-40
3. ~~**Export wizard: single/selection modes** — UX for piecemeal export~~ — DAS-41
4. ~~**Layout polish** — snap, resize, multi-select on canvas~~ — DAS-42
5. ~~**Undo/redo** — command pattern over graph mutations~~ — DAS-45
6. ~~**Pie chart + flex layout** — expand visualization and layout palette~~ — DAS-46
7. ~~**Detail panel** — table row drill-down~~ — DAS-47
8. ~~**Palette accordion groups** — 2–7 functional groups, default collapsed~~ — DAS-44

### Component grouping guides (DAS-43)

Shipped usability layer on the palette and canvas:

| Affordance | Behavior |
|------------|----------|
| **Info (i) icon** | Palette row panel with summary + CSS animation preview |
| **Chain/link icon** | Lists typical companions with one-click add |
| **Placement prompt** | Canvas card after add when companions are missing; dismiss + add buttons |
| **Defaults engine** | Companion hints on `nodeAdded` via `packages/core/src/lib/grouping/` |

Registry: `getGroupingGuide`, `listMissingCompanionTypes`, `computeCompanionLayout`.

### Palette accordion groups (DAS-44)

Functional accordion groups replace flat registry categories in the builder palette:

| Behavior | Detail |
|----------|--------|
| **Taxonomy** | `PALETTE_GROUP_DEFINITIONS` in `packages/core/src/lib/palette/` — 10 groups (including `plugin-extensions` and `vr-visuals`), 2–7 items each |
| **Default state** | All groups collapsed on load |
| **Multi-open** | Expanding one group does not collapse others |
| **Accessibility** | Group headers are buttons with `aria-expanded` and Enter/Space support |
| **DAS-43 preserved** | Info, link, and + add affordances unchanged on expanded rows |

Helpers: `resolvePaletteGroups`, `findPaletteGroupIdForType`, `validatePaletteGroupDefinitions`.

### Builder undo/redo (DAS-45)

Snapshot-based history stack over graph mutations in `apps/client/src/app/builder/history/`:

| Behavior | Detail |
|----------|--------|
| **Mutations tracked** | Add/remove node, property edits, bindings, layout drag/resize (coalesced), domain context |
| **UI** | Undo / Redo toolbar buttons; Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y) |
| **Stack rules** | Redo cleared on new mutation; history reset on load/save/template apply |

### Pie chart + flex layout (DAS-46)

| Type | Preview | Export |
|------|---------|--------|
| `visual.chart.pie` | Conic-gradient pie/donut with legend | React, Angular, Vue, Svelte UI exporters |
| `layout.flex` | Row/column flex slots with gap + align | Preview only (layouts export via IR `layouts` array) |

Registry properties for pie: `title`, `labelField`, `valueField`, `donut`. Flex: `direction`, `gap`, `align`.

### Detail panel (DAS-47)

| Type | Preview | Export |
|------|---------|--------|
| `visual.detail` | Key-value fields for selected table row | React, Angular, Vue, Svelte UI exporters |

Bind `[table].selected-row → [detail].row`. Preview supports clickable table rows with shared selection state.

### Loading skeleton (DAS-49)

| Type | Preview | Export |
|------|---------|--------|
| `visual.skeleton` | Shimmer placeholder (table/chart/kpi/card variants) | React, Angular, Vue, Svelte UI exporters |

Bind `[checkbox].value → [skeleton].loading` or pair with data visuals — preview hides the skeleton once mock data finishes loading.

### Phase 6 complete

All planned Phase 6 tickets (DAS-39–DAS-49) are shipped. The registry now includes **60 component types** across form inputs, data display, logic/motion, charts, layout, news, media, SVG, VR/3D, WASM, plugins, access/onboarding, and infrastructure targets — see [Component Taxonomy snapshot](./08-component-taxonomy.md#shipped-registry-snapshot).

### Timer (DAS-50)

| Type | Preview | Export |
|------|---------|--------|
| `logic.timer` | Live interval/countdown tick display | React, Angular, Vue, Svelte UI exporters |

Outputs `tick` (event) and `elapsed` (number). Pair with tables and charts for polling refresh patterns.

---

- [ ] Type registered in `packages/core` with validation tests
- [ ] Preview renderer in Angular client
- [ ] React exporter template (minimum); Angular/Vue/Svelte when touching export matrix
- [ ] Listed in [Component Taxonomy](./08-component-taxonomy.md) with **Implemented** status
- [ ] E2e or unit test proving add → configure → preview/export path

### Definition of done — new page template

- [ ] JSON fixture with nodes, bindings, domainContext, exportTargets
- [ ] Builder action: "Apply template" with confirmation
- [ ] Saves and reloads correctly
- [ ] Export bundle validates in strict mode
- [ ] Documented in this file under reference patterns

---

## Related documents

- [Component Model](./03-component-model.md)
- [Component Taxonomy](./08-component-taxonomy.md)
- [Domain Model](./05-domain-model.md)
- [Local Development & Components](./13-local-development-and-components.md)
- [Roadmap](./10-roadmap.md)
- [Planned Tickets](./11-planned-tickets.md)
