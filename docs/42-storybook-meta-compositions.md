# Storybook meta components (DAS-105)

**Ticket:** [DAS-105](https://planetkevin.atlassian.net/browse/DAS-105)  
**Companion:** [Storybook component catalog](./38-storybook-component-catalog.md), [Demo dashboards](./22-demo-dashboards.md)

Storybook **Catalog → Meta components** replaces the old **Meta elements** markup-only stories. Each entry shows:

1. **Layout diagram** — schematic blocks (click to select; hover syncs to live preview)
2. **Live preview** — interactive dashboard or recipe with bordered preview containers per component
3. **Component XML** — underlying custom-element markup only

Panel tabs switch between diagram-only, live-only (mobile), diagram + live (≥960px), or XML full-width. Selection persists on click until another block is chosen.

## Why two catalog layers?

| Layer | Purpose |
|-------|---------|
| **Components** | One row per taxonomy component — spec card + isolated demo |
| **Meta components** | Abstract “see it working together” — dashboards and cross-group recipes |

Users browse **Components** to learn a single component; **Meta components** to understand how the library composes in real layouts.

## Compositions (10)

| Story | Covers |
| ------- | -------- |
| Operations KPI dashboard | Time preset, date range, KPI, line chart, table, detail, skeleton, timer, status badge |
| Analytics & reporting dashboard | Date range, tabs, collapsible, bar/line/pie charts, table, detail, metric chip |
| Admin & settings dashboard | All form inputs, role gate, invite, role assign, grid, flex, modal |
| News discovery flow | All six news-discovery components |
| Media authoring pipeline | Video source, equirect viewport, live capture, WASM media |
| WASM compute lab | WASM asset, worker host, module, media |
| VR & 3D gallery | All five 3D visuals + inline SVG + icon |
| Data platform panel | Env, four databases, four API servers |
| Navigation & layout shell | npm accordion, link lists, accordion-link-list + layout grid/flex/collapsible |
| **Component coverage audit** | Matrix proving 100% palette + npm atom inclusion |
| **Full-stack orders (live API)** | Infra env/postgres/server + live fetch of seeded `orders` via parity stack (React→Next :53103, Angular→Nest :53101). Requires `parity:db:up` and `parity:servers:up`. Mount: `tools/storybook-shared/full-stack-orders-demo.ts` |

<!-- DAS- 188 SUGGESTED: add row to compositions table
| **Full-stack orders (live API)** | Infra env/postgres/server + live fetch of seeded `orders` via parity stack (React→Next :53103, Angular→Nest :53101). Requires `parity:db:up` and `parity:servers:up`. Mount: `tools/storybook-shared/full-stack-orders-demo.ts` |
-->

## Implementation

- Definitions: `tools/storybook-shared/meta-compositions/composition-definitions.ts`
- Mount + wiring: `tools/storybook-shared/meta-compositions/mount-meta-composition.ts`
- Plain component XML: `tools/storybook-shared/palette-catalog/render-component-markup.ts`
- Panel tabs (diagram, live preview, component XML): `wire-meta-composition-panels.ts` — visual tabs show diagram + live side by side (≥960px); XML tab shows markup only
- **Controls / Actions / Interactions (DAS-114):** `meta-composition-story-config.ts` — story args drive live KPI, chart, timer, media, and news demos inside each composition; `play` tests cover drill-down flows
- Reuses palette demo markup and `wireCatalogInteractivity()` from the palette catalog engine
- Styles: `meta-composition-styles.css` + shared `palette-demo-styles.css`
- Stories: `apps/storybook-*/src/catalog/meta-components.stories.*` (all five runtimes)

## Adding a composition

1. Add a `MetaCompositionDefinition` to `META_COMPOSITIONS` with `componentTypes` and `sections`.
2. Export a story in each runtime’s `meta-components.stories.*` (or web-components first, then mirror via shared mount).
3. Confirm **Component coverage audit** stays green (no uncovered palette types).

## Related

- Phase 21 [Demo dashboards](./22-demo-dashboards.md) — animated in-builder walkthroughs (separate from Storybook meta components)
- DAS-102 catalog meta CEs (`rd-component-name`, etc.) remain for Components spec cards; meta components use **live preview HTML**, not markup-tree-only demos
