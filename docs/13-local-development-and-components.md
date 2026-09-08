# Local Development & Component Guide

This guide covers **everything you need running locally** (client, server, tests) and **how to add a new palette component** end to end.

## Prerequisites

| Requirement | Version / notes |
| ------------- | ----------------- |
| Node.js | 22.x (matches CI) |
| npm | Comes with Node |
| Git | For branching workflow |

Optional: [Cursor](https://cursor.com) or VS Code with Angular/NestJS extensions.

**Docker alternative:** skip local Node and use [Docker Containers](./14-docker-containers.md) (`npm run docker:dev`).

---

## First-time setup

From the repository root (`rosettadash/`):

```bash
# 1. Install JavaScript dependencies
npm install

# 2. Install Playwright Chromium (required for e2e — one-time per machine / after @playwright/test upgrades)
npm run setup:e2e

# 3. Confirm unit tests pass (no browser needed)
npm run verify
```

**Destination Atlas / Authoring 360°:** thirty short MP4 clips ship
in `libs/destination-atlas/media/authoring-360/` (~15 MB). `npm install`
runs `authoring:link-360` and symlinks them into each proof app and
`demo:tour`. Regenerate from Wikimedia Commons: `npm run
authoring:fetch-360` (ffmpeg + network).

If step 2 is skipped, `npm run e2e` and `npm run verify:all` fail with:

```text
Error: browserType.launch: Executable doesn't exist at .../ms-playwright/chromium_headless_shell-...
Please run: npx playwright install chromium
```

---

## Daily startup (builder)

You need **both** the NestJS API and the Angular client for save, preview, and export to work.

### Recommended: one command

```bash
npm start
```

This runs `client` and `server` in parallel via Nx.

| Service | URL | Purpose |
| --------- | ----- | --------- |
| Builder UI | <http://localhost:4200> | Palette, canvas, inspector, preview, export |
| REST API | <http://localhost:3000/api> | Projects, preview mock data, export |
| Health | <http://localhost:3000/api/health> | Quick “is the API up?” check |

The Angular dev server proxies `/api/*` → `http://localhost:3000`, so the browser always calls relative `/api/...` URLs.

### Verify the stack is healthy

```bash
# API
curl http://localhost:3000/api/health

# Builder (should return HTML)
curl -I http://localhost:4200
```

In the browser: open <http://localhost:4200> → wait for “Loading project…” to finish → palette and canvas appear.

### Run client and server separately (optional)

Useful when debugging one side only.

**Terminal 1 — API (start this first):**

```bash
npm run start:server
# → http://localhost:3000/api
```

**Terminal 2 — client:**

```bash
npm run start:client
# → http://localhost:4200 (proxies /api to :3000)
```

The client **requires** the server for:

- Creating/restoring projects (`/api/projects/...`)
- Preview mock data (`POST /api/preview/data`)
- Export preview/download (`POST /api/export/bundle`)

Without the server you will see errors in the toolbar or a stuck loading state.

---

## Backend parity stack (optional)

Separate from the builder dev loop: **seeded databases in Docker** and
**generated server apps** that prove export output serves real rows.

**One command (full verify):** `npm run parity:verify`

**Live UI demos (one terminal each):**

| Command | Opens |
| ------- | ----- |
| `npm run parity:stack:proof:react` | React proof Stack → Next :53103 |
| `npm run parity:stack:proof:angular` | Angular proof Stack → Nest :53101 |
| `npm run parity:stack:storybook:react` | Storybook full-stack orders → Next |
| `npm run parity:stack:storybook:angular` | Storybook full-stack orders → Nest |

**Builder API + Destination Atlas news:** `npm run proof:react:live` (swap
`:react` for any proof runtime). **Builder API + Storybook news:**
`npm run storybook:react:live`.

**Generate only (builder API orchestrated):** `npm run parity:generate:live`

Low-level steps when you need them individually:

| Step | Command | Notes |
| ------ | --------- | ------- |
| 1 | `npm run parity:db:up` | Postgres :55432, MySQL :53306, Mongo :57017, Supabase :54321 |
| 2 | `npm run parity:generate` | Requires builder API on :3000 |
| 3 | `npm run parity:servers:up` | Nest :53101, Express :53102, Next :53103, Nuxt :53104 |
| 4 | `npm run parity:check` | Seeds + servers + documented matrix |

Full reference: [Backend parity stack](./44-backend-parity-stack.md).

Proof dev servers proxy `/parity-api` to the matching host port and
`/builder-api` to the builder API.

---

## Quality checks before commit

```bash
npm run verify         # lint + typecheck + unit tests + live-script wiring
npm run test:orchestration   # orchestration node:test only
npm run smoke:live-scripts   # wiring + manual smoke checklist
npm run e2e            # Playwright — starts its own servers on :4201 / :3001
npm run e2e            # Playwright (starts server + client on :4201/:3001)
npm run e2e:fresh      # bypass Nx cache — use once after setup:e2e if failures persist
npm run verify:all     # verify + e2e
npm run verify:master  # verify:all + parity:verify + smoke:live-scripts
```

E2E uses **ports 4201 and 3001** so it can run while `npm start` is still on 4200/3000. E2E starts dedicated `serve-e2e` Nx targets so it does not block on the dev `serve` lock.

See [CI and Hosting](./12-ci-and-hosting.md) for troubleshooting hung tests or stale Nx processes.

---

## Builder workflow (manual smoke test)

1. Open <http://localhost:4200>
2. **Design** — add components from the palette (+), edit properties in the inspector, connect ports (click output → input)
3. **Save** — toolbar shows “Saved” after `PUT` to the API
4. **Preview** — toggle Preview mode; mock data loads from `POST /api/preview/data`
5. **Export** — toolbar **Export** → review files → **Download zip**
   (requires PostgreSQL + NestJS infra nodes and valid bindings for a full
   bundle)

### API-backed table (PostgreSQL → Nest → Svelte)

Minimal stack to prove **database rowset → REST route → UI fetch**:

1. **Welcome** — choose **Svelte** UI, **Nest** server, **PostgreSQL**
   database, and name the dashboard.
2. **Canvas** — add **PostgreSQL**, **Nest Server**, and **Table** from the
   palette.
3. **Bind** — click PostgreSQL **rowset** output, then Table **data** input.
4. **Inspector** — select PostgreSQL and set **Table** to your DB table name
   (e.g. `sales`). An empty value falls back to the table component label.
5. **Export** — open the wizard; expect files such as
   `server/src/sales/sales.controller.ts`,
   `src/lib/data/usePg1Data.svelte.ts`, and `src/Dashboard.svelte`.
6. **Run exported app** — set `DATABASE_URL`, start the Nest server and Svelte
   dev server; the dashboard fetches `GET /api/sales`.

**Automated coverage:** `apps/server/src/app/export/svelte-nest-api-bundle.spec.ts`
(unit) and `apps/client-e2e/src/builder-export.spec.ts` (Svelte stack e2e).

---

## How to add a new component

Components live in three layers:

```text
packages/core              → definition, validation, registry (source of truth)
apps/client/.../preview    → builder Preview mode renderer
packages/exporters-react   → generated React source (when applicable)
packages/exporters-nest    → generated server/infra (when applicable)
```

### Step 1 — Define the component in `core`

**File:** `packages/core/src/lib/registry/p0-components.ts` (or a new definitions file imported by the registry)

Add a `ComponentDefinition`:

```typescript
{
  type: 'visual.input.number',           // stable type key — never rename after ship
  category: 'visual',                    // visual | layout | domain | infra
  label: 'Number Input',
  description: 'Numeric field with min/max',
  isVisual: true,
  inputs: [],                            // bound data inputs
  outputs: [{ id: 'value', name: 'value', dataType: 'number' }],
  properties: [
    { key: 'min', label: 'Min', type: 'number', default: 0 },
    { key: 'max', label: 'Max', type: 'number', default: 100 },
  ],
}
```

Register it in `defaultComponentRegistry` (via `P0_COMPONENT_DEFINITIONS`).

**Data types** for ports: see `packages/core/src/lib/model/data-types.ts`. Bindings must connect compatible types (`string` → `string`, `rowset` → `rowset`, etc.).

**Validation:** `validateComposite(..., { mode: 'strict' })` is used for export; builder save uses `draft` mode (unbound ports allowed while designing).

Run:

```bash
npx nx test core
```

### Step 2 — Preview renderer (builder UI)

**Files:**

- `apps/client/src/app/builder/preview/preview-node.component.html` — add `@case ('visual.input.number') { ... }`
- `apps/client/src/app/builder/preview/preview-node.component.ts` — helpers if needed
- `apps/client/src/app/builder/preview/preview-node.component.scss` — styles

Use `data-testid="preview-..."` on key elements for Playwright.

Mock data for preview comes from `packages/ui-primitives` (`generatePreviewData`, `resolvePreviewGraph`). Extend those if the component needs bound rowsets or filters.

**Manual check:** `npm start` → add component → **Preview** mode.

### Step 3 — React export template (visual components)

**File:** `packages/exporters-react/src/lib/component-templates.ts`

1. Add the type to `SUPPORTED_TYPES`
2. Implement `generateNumberInput(name)` (or similar)
3. Wire `generateComponentFile` switch case

**File:** `packages/exporters-react/src/lib/generate-react-ui.spec.ts` — extend or add a composite that includes the new type.

```bash
npx nx test exporters-react
```

### Step 4 — Infra / server components (if applicable)

For database or server nodes, update `packages/exporters-nest` instead of (or in addition to) React templates.

### Step 5 — E2E smoke (recommended)

Add or extend a spec under `apps/client-e2e/src/`:

- Palette add: `page.getByTestId('palette-add-visual.input.number')`
- Preview: `page.getByTestId('preview-...')`

```bash
npm run setup:e2e   # if browsers missing
npm run e2e
```

### Step 6 — Document

- Add a row to [Component Taxonomy](./08-component-taxonomy.md)
- Note any smart-default or binding rules in [Component Model](./03-component-model.md)

---

## Project map (quick reference)

| Task | Location |
| ------ | ---------- |
| Component definitions | `packages/core/src/lib/registry/` |
| Composite validation | `packages/core/src/lib/validation/` |
| Palette (auto from registry) | `apps/client/src/app/builder/palette/` |
| Canvas & bindings | `apps/client/src/app/builder/canvas/` |
| Inspector | `apps/client/src/app/builder/inspector/` |
| Preview panel | `apps/client/src/app/builder/preview/` |
| Export wizard | `apps/client/src/app/builder/export/` |
| Projects API | `apps/server/src/app/projects/` |
| Preview API | `apps/server/src/app/preview/` |
| Export API | `apps/server/src/app/export/` |
| Preview mock data | `packages/ui-primitives/` |
| React exporter | `packages/exporters-react/` |
| Nest/PostgreSQL exporter | `packages/exporters-nest/` |
| E2E tests | `apps/client-e2e/src/` |

---

## Common issues

| Symptom | Likely cause | Fix |
| --------- | -------------- | ----- |
| Stuck on “Loading project…” | Server not running or not reachable | Start `npm run start:server` or full `npm start`; check `curl localhost:3000/api/health` |
| Preview shows “default” data only | Preview API failed | Confirm server is up; check browser network tab for `POST /api/preview/data` |
| Export wizard shows validation errors | Composite not export-ready | Add PostgreSQL + NestJS infra, bind required ports (e.g. `rowset` → table `data`) |
| `Executable doesn't exist` in e2e (first time) | Playwright browsers not installed | `npm run setup:e2e` |
| `Executable doesn't exist` after `setup:e2e` | Nx replaying a cached failed e2e run | `npm run e2e:fresh` or `npx nx reset` then `npm run e2e` |
| E2E hangs / `Timed out waiting … config.webServer` | Stale e2e servers on :3001/:4201, or old `nx serve` lock before `serve-e2e` targets | `npm run e2e:prep` prints PIDs; `kill <pid>` then re-run `npm run e2e` |
| `…/api/health is already used` | Stale e2e server on :3001 (or :4201) | Same — `npm run e2e:prep` or `lsof -i :3001 -i :4201` |
| Save fails with 400 | Composite schema/validation error | Read `issues` in network response; fix in inspector |

---

## Large composite performance

The builder applies a few optimizations when graphs grow beyond ~50 nodes:

| Area | Behavior |
| ------ | ---------- |
| **Canvas drag/resize** | Batched layout updates (`updateNodesLayoutBatch`) — one nodes pass per pointer frame |
| **Selection / bindings** | Computed `Set` lookups instead of per-node linear scans |
| **Canvas rendering** | Viewport culling hides off-screen nodes (selected nodes always render) |
| **Preview reload** | Debounced API load keyed on data-relevant fields (layout-only edits skip reload) |

If performance still degrades, split dashboards into multiple composites or reduce live preview scope while editing.

---

## Related documents

- [README](../README.md) — quick start
- [Docker Containers](./14-docker-containers.md)
- [Component & Page Design](./15-component-and-page-design.md) — run without local Node
- [Architecture](./02-architecture.md)
- [Component Model](./03-component-model.md)
- [Component Taxonomy](./08-component-taxonomy.md)
- [Workflow & Branching](./07-workflow-and-branching.md)
- [CI and Hosting](./12-ci-and-hosting.md)
