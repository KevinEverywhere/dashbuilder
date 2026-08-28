# Component Taxonomy

Initial palette organization for RosettaDash. Components are grouped for palette navigation; each maps to a `type` string in the component model.

**npm note (DAS-90):** Public imports are `@rosettadash/<runtime>/<group>/…/<component>` (one or more groups; same subpaths on every runtime). Multi-component patterns are **recipes over atoms**, not extra taxonomy rows — see [Public component API](./34-public-component-api.md).

## Shipped registry snapshot

**Source of truth (code):**

| Artifact | Location | Count |
|----------|----------|------:|
| Builder registry types | `packages/core/src/lib/registry/` | **60** |
| npm runtime manifest | `tools/runtime-taxonomy/manifest.mjs` | **60** subpaths |

Re-count when adding components: `rg "^\s+type: '(visual|layout|domain|logic|infra)\." packages/core/src/lib/registry -g '*.ts' | … | sort -u | wc -l`

Sections **1–8 below** describe the **full target taxonomy** (including types not yet in the registry). Do not assume every table row is implemented — check the registry or [Component & Page Design — P0 table](./15-component-and-page-design.md#p0-components--implemented-today).

**Agent rules:** `.cursor/rules/10-component-library-charter.mdc` (parity + add-component workflow).

## 1. Form & Input

| Component | Type key | Notes |
|-----------|----------|-------|
| Text input | `visual.input.text` | Single-line |
| Textarea | `visual.input.textarea` | Multi-line |
| Number input | `visual.input.number` | Min/max/step |
| Select | `visual.input.select` | Static or data-bound options |
| Multi-select | `visual.input.multiselect` | |
| Checkbox | `visual.input.checkbox` | |
| Radio group | `visual.input.radio` | |
| Date picker | `visual.input.date` | |
| Date range picker | `visual.input.date-range` | Drives time context |
| Time picker | `visual.input.time` | |
| File upload | `visual.input.file` | |
| Form | `visual.form` | Groups inputs, validation |
| Submit button | `visual.button.submit` | |

## 2. Data Display

| Component | Type key | Notes |
|-----------|----------|-------|
| Data table | `visual.table` | Sort, filter, paginate |
| Detail panel | `visual.detail` | Row drill-down |
| KPI card | `visual.kpi` | Single metric + delta |
| Stat group | `visual.stat-group` | Multiple KPIs |
| List | `visual.list` | Simple list rendering |
| Badge / tag | `visual.badge` | Status indicators |
| Avatar | `visual.avatar` | User display |
| Timeline | `visual.timeline` | Event sequence |

## 3. Charts & Visualization

| Component | Type key | Notes |
|-----------|----------|-------|
| Line chart | `visual.chart.line` | Time-series default |
| Bar chart | `visual.chart.bar` | |
| Pie / donut | `visual.chart.pie` | |
| Area chart | `visual.chart.area` | |
| Scatter plot | `visual.chart.scatter` | |
| Heatmap | `visual.chart.heatmap` | |
| Gauge | `visual.chart.gauge` | |
| Chart container | `visual.chart.container` | Shared legend, title |

## 4. Layout & Navigation

| Component | Type key | Notes |
|-----------|----------|-------|
| Grid | `layout.grid` | Responsive columns |
| Flex row / column | `layout.flex` | |
| Stack | `layout.stack` | Vertical spacing |
| Split pane | `layout.split` | Resizable regions |
| Tabs | `layout.tabs` | |
| Accordion | `layout.accordion` | |
| Modal / dialog | `layout.modal` | |
| Drawer | `layout.drawer` | |
| Sidebar nav | `layout.sidebar` | |
| Breadcrumbs | `layout.breadcrumbs` | |
| Page header | `layout.header` | Title + actions |

## 5. Interaction & Motion

| Component | Type key | Notes |
|-----------|----------|-------|
| Drag handle | `interaction.drag-handle` | Reorder lists |
| Sortable list | `interaction.sortable-list` | |
| Drop zone | `interaction.drop-zone` | |
| Timer | `logic.timer` | Shipped (DAS-50) |
| Debounce | `logic.debounce` | Input throttling |
| Animation wrapper | `interaction.animation` | Enter/exit transitions |
| Loading skeleton | `visual.skeleton` | Shipped (DAS-49) |
| Toast / notification | `visual.toast` | |

## 6. Logic & Binding

| Component | Type key | Notes |
|-----------|----------|-------|
| Conditional visibility | `logic.condition` | Role/data driven |
| Data transformer | `logic.transform` | Map/filter rowsets |
| Validator | `logic.validator` | Form rules |
| Event bus | `logic.event-bus` | Decoupled events |
| Refresh trigger | `logic.refresh` | Manual/auto data reload |

## 7. Domain & Access

| Component | Type key | Notes |
|-----------|----------|-------|
| Client selector | `domain.client-select` | Tenant scoping |
| Project selector | `domain.project-select` | |
| Role gate | `domain.role-gate` | Wraps children |
| Person invite form | `domain.person-invite` | Onboarding |
| Role assignment | `domain.role-assign` | Onboarding |
| Time range preset | `domain.time-preset` | Last 7d, QTD, etc. |
| Live/historical toggle | `domain.data-mode` | |

## 8. Infrastructure (non-visual)

| Component | Type key | Notes |
|-----------|----------|-------|
| Environment config | `infra.env` | Env var definitions |
| MongoDB | `infra.mongodb` | Connection + schema hints |
| PostgreSQL | `infra.postgresql` | |
| Supabase | `infra.supabase` | URL + anon key refs |
| MySQL | `infra.mysql` | |
| Next.js server | `infra.server.next` | |
| Nuxt server | `infra.server.nuxt` | |
| NestJS server | `infra.server.nest` | |
| Express server | `infra.server.express` | |
| REST endpoint | `infra.endpoint.rest` | Generated route spec |

## Priority tiers

### P0 — MVP palette (expanded)

Original MVP was ~21 types; the registry has grown through Phase 6–8 and plugin packs (news, media, SVG, VR/3D, WASM).

**Authoritative implemented list:** [Component & Page Design — P0 components](./15-component-and-page-design.md#p0-components--implemented-today) (update that table when adding registry types).

**Rough groups shipped today (60 registry types):**

| Group | Examples |
|-------|----------|
| Form & input | text, select, number, checkbox, textarea, date-range |
| Data display | table, detail, KPI, skeleton |
| Charts | line, bar, pie, sankey, venn |
| Layout | grid, flex, tabs, modal, collapsible, scroll-region |
| Logic | timer |
| Domain | role-gate, person-invite, role-assign, time-preset |
| News | language/region/type select, search, results, article detail |
| Media | video-source, equirect viewports, live-capture, carousel |
| VR / 3D | 3d-bar-chart, scatter, scene, gltf-model, geo-globe |
| SVG | inline, icon |
| Plugins | status-badge, metric-chip |
| WASM | asset, worker-host, module, media |
| Infra | env, four DBs, four server targets |

npm runtime packages mirror manifest subpaths; parity gaps are tracked in `.cursor/rules/10-component-library-charter.mdc` (grandfathered debt).

### P1 — Early expansion

Most original P1 items are **shipped** (number, checkbox, textarea, pie, flex, detail, time-preset, skeleton, timer). Remaining P1 rows in sections 1–8 above are still target taxonomy.

### P2 — Full catalog

Animation, drag-drop lists, remaining charts, client/project selectors, geo-map/youtube-embed/i18n atoms, WebXR — see roadmap and planned tickets.

## Adding new components

See **[Local Development & Components](./13-local-development-and-components.md)** for the step-by-step (core definition → preview → exporters → tests).

For design checklists and page-level patterns, see **[Component & Page Design](./15-component-and-page-design.md)**.

## Related documents

- [Component Model](./03-component-model.md)
- [Domain Model](./05-domain-model.md)
- [Roadmap](./10-roadmap.md)
- [Component & Page Design](./15-component-and-page-design.md)
