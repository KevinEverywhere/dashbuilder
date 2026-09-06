# RosettaDash

[![GitHub](https://img.shields.io/badge/GitHub-KevinEverywhere%2Frosettadash-181717?logo=github)](https://github.com/KevinEverywhere/rosettadash)
[![npm @rosettadash/core](https://img.shields.io/npm/v/@rosettadash/core.svg)](https://www.npmjs.com/package/@rosettadash/core)

RosettaDash is a **local visual dashboard builder** plus **five typed component libraries**. Design dashboards in the Angular builder, drop the same components into an existing app from npm, or run Destination Atlas — a real consumer demo on every runtime.

**Author:** Kevin Ready \<kevin@planetkevin.com\>

## What exists today

This is not a scaffold. As of this repo:

| Surface | Status |
|---------|--------|
| Visual builder (`npm start` → http://localhost:4200) | Shipped |
| Five scoped npm packages (`@rosettadash/core` + five runtimes) | Shipped; taxonomy complete (DAS-93 / DAS-116–119) |
| Five Storybook catalogs (ports 6006–6010) | Shipped |
| Five Destination Atlas proof apps (ports 4310–4314) | Shipped (DAS-120–159) |
| Multi-target export (UI + server + database) | Shipped |
| GitHub Actions | `verify` + `e2e` on PRs — **does not publish npm** |

Unscoped **`rosettadash`** is this product clone (`private: true` in the repo). It is **not** a component barrel. The npm page is a landing README only — install `@rosettadash/<runtime>` for UI.

## Who this is for

RosettaDash runs on **your machine** during development. There is no required public deployment.

## Four ways to use RosettaDash

| Path | When | How |
|------|------|-----|
| **Product (this repo)** | Contribute, run the visual builder | `git clone` → `npm install` → `npm start` |
| **Components (scoped npm)** | Drop typed elements into an existing app | `npm install @rosettadash/<runtime>` |
| **Destination Atlas (proof apps)** | See a full consumer product on each runtime | Clone repo → `npm install` → `npm run proof:react` (or `:web-components`, `:angular`, `:vue`, `:svelte`) |
| **Storybook (repo only)** | Browse components in isolation | `npm run storybook:web-components` (or `:react`, `:vue`, `:angular`, `:svelte`) |

```ts
import { Accordion } from '@rosettadash/web-components/layout/accordion';
import { Accordion } from '@rosettadash/react/layout/accordion';
import { registerRosettaDashMediaElements } from '@rosettadash/web-components/media';
```

Details: [Public API](docs/34-public-component-api.md) · [Styling](docs/35-styling-and-classnames.md) · [Consumer install](docs/39-npm-consumer-install.md) · [Destination Atlas](docs/43-destination-atlas-proof-apps.md).

## Install from npm

Packages live on [npm under `@rosettadash`](https://www.npmjs.com/org/rosettadash). This checkout and the registry are both **0.1.3**:

| Package | Version |
|---------|---------|
| [`@rosettadash/core`](https://www.npmjs.com/package/@rosettadash/core) | **0.1.3** |
| [`@rosettadash/web-components`](https://www.npmjs.com/package/@rosettadash/web-components) | **0.1.3** |
| [`@rosettadash/react`](https://www.npmjs.com/package/@rosettadash/react) | **0.1.3** |
| [`@rosettadash/angular`](https://www.npmjs.com/package/@rosettadash/angular) | **0.1.3** |
| [`@rosettadash/vue`](https://www.npmjs.com/package/@rosettadash/vue) | **0.1.3** |
| [`@rosettadash/svelte`](https://www.npmjs.com/package/@rosettadash/svelte) | **0.1.3** |

Framework packages pin `"@rosettadash/web-components": "0.1.3"` to match this release.

```bash
npm install @rosettadash/core @rosettadash/react
# or: @rosettadash/web-components | @rosettadash/angular | @rosettadash/vue | @rosettadash/svelte
```

## Destination Atlas (working consumer demo)

Five Nx apps share mock data from `libs/destination-atlas/` and the same screens. This is a location explorer, not a kitchen-sink catalog.

| Runtime | App | Command | Port |
|---------|-----|---------|------|
| Web Components | `apps/proof-web-components` | `npm run proof:web-components` | 4310 |
| React (UX reference) | `apps/proof-react` | `npm run proof:react` | 4311 |
| Angular | `apps/proof-angular` | `npm run proof:angular` | 4312 |
| Vue | `apps/proof-vue` | `npm run proof:vue` | 4313 |
| Svelte | `apps/proof-svelte` | `npm run proof:svelte` | 4314 |

**Screens:** About (`/` — only page-level scroller) · Overview · Destinations · Maps · Media · Authoring · Plan · Stack · Settings.

Most screens are native to that runtime. **Svelte** embeds Vue Globe, Angular Media, and `<rd-geo-map>` on Map ([DAS-158](https://planetkevin.atlassian.net/browse/DAS-158)); Authoring is native Svelte ([DAS-179](https://planetkevin.atlassian.net/browse/DAS-179)). **Web Components** and **Vue** proofs stay native end to end ([DAS-121](https://planetkevin.atlassian.net/browse/DAS-121), [DAS-157](https://planetkevin.atlassian.net/browse/DAS-157)).

Full guide: [docs/43-destination-atlas-proof-apps.md](docs/43-destination-atlas-proof-apps.md).

After `npm install`, Authoring 360° clips and `demo:tour` media are
linked automatically (`postinstall` → `authoring:link-360`). Clips live
in `libs/destination-atlas/media/authoring-360/` (thirty MP4s,
~15 MB, tracked in git).

## Component examples (Storybook)

Five catalogs, one per runtime. See [Storybook component catalog](docs/38-storybook-component-catalog.md).

| Runtime | Port | Command |
|---------|------|---------|
| Web Components (primary) | 6006 | `npm run storybook:web-components` |
| React | 6007 | `npm run storybook:react` |
| Vue | 6008 | `npm run storybook:vue` |
| Angular | 6009 | `npm run storybook:angular` |
| Svelte | 6010 | `npm run storybook:svelte` |

Run all five: `npm run storybook:all`. Static build: `npm run build-storybook`.

If Storybook logs **Unable to index files** / `ENOENT` after switching branches, stop the server, run `npm run storybook:clean-cache`, and start again.

All five share the same sidebar. Open **http://localhost:6006/** (or any runtime port) to land on **Getting Started → Start here**.

| Section | Stories |
|---------|---------|
| **Getting Started** | Start here · Component count · Styling modes |
| **Catalog / Components** | One story per builder group, All components scroll, NPM layout atoms |
| **Catalog / Meta components** | Live dashboard recipes (diagram, preview, XML, Controls, Interactions) |

## Build your first dashboard

This walkthrough uses a built-in starter template — no manual wiring required.

### 1. Start RosettaDash

```bash
npm start
```

Open **http://localhost:4200**.

### 2. Choose a stack

On the welcome page:

1. Expand **Component model** and pick **W3C Web Components** (or React / Angular / Vue / Svelte).
2. Optionally expand **Server**, **Database**, and **Styling** — for a UI-only demo, leave server and database as **None**.
3. Click **Continue to builder**.

Tip: expand **Documentation → README** on the welcome page to read this guide at runtime (`npm run sync:readme` copies this file into the client).

### 3. Apply a starter template

In the builder toolbar:

1. Open the **Select template…** dropdown.
2. Choose **Analytics overview** or any **Office / Media / Dev** starter such as **Executive KPI dashboard**.
3. Click **Apply template**.

### 4. Preview with mock data

1. Switch to **Preview** in the toolbar.
2. Interact with filters, tables, and charts — mock data comes from the local NestJS API.
3. Add a **Collapsible** from the palette (**Layout** group) to wrap sections; Web Components export includes matching `<rd-*>` elements and `{ComponentName}.css`.

### 5. Export

1. Click **Export** in the toolbar.
2. Pick your UI target and download the zip.
3. For Web Components exports, each custom element has a sibling CSS file (for example `KpiCard.ts` + `KpiCard.css`).

See [Local development & component how-to](docs/13-local-development-and-components.md) for adding palette components.

## Run locally

### First-time setup

From the repo root (`rosettadash/`):

```bash
npm install
npm run setup:e2e      # Playwright Chromium (required once for e2e)
npm run e2e:fresh      # use once after setup:e2e if Nx replays an old cached failure
npm run verify:all     # optional sanity check
```

`npm install` also runs **`authoring:link-360`** (via `postinstall`): it
symlinks the thirty shipped Authoring / tour MP4s from
`libs/destination-atlas/media/authoring-360/` into each proof app and
`demo:tour`. Those clips are **in the repo** (~14 MB). To rebuild from
Wikimedia Commons stills: `npm run authoring:fetch-360` (needs **ffmpeg**
and network).

If you skip `npm run setup:e2e`, e2e fails with `Executable doesn't exist at .../ms-playwright/...`. Equivalent:

```bash
npx playwright install chromium
```

Full guide: **[docs/13-local-development-and-components.md](docs/13-local-development-and-components.md)**.

### Run with Docker (no local Node required)

See **[docs/14-docker-containers.md](docs/14-docker-containers.md)**.

```bash
npm run docker:dev     # hot reload on http://localhost:4200
npm run docker:app     # production-style build on http://localhost:8080
```

Requires [Docker](https://docs.docker.com/get-docker/) with Compose v2.

### Backend parity stack (databases and servers you can actually run)

RosettaDash names four databases and four server frameworks as export targets.
Those claims are backed by containers you can start from this repository —
one per promise, each seeded with the same mock data the builder previews and
with a known set of base users.

Full guide: **[docs/44-backend-parity-stack.md](docs/44-backend-parity-stack.md)**.

```bash
npm run parity:db:up        # PostgreSQL, MySQL, MongoDB, Supabase (seeded)
npm run parity:check:db     # assert the seeded rows and base users are there
npm run parity:down         # stop everything
```

**Databases** — every container is seeded from
`packages/ui-primitives/preview-content.json`, so container rows and builder
preview rows are the same rows:

| Promise | Image | Host port | Connection |
|---------|-------|-----------|------------|
| PostgreSQL | `postgres:16-bookworm` | 55432 | `DATABASE_URL` |
| MySQL | `mysql:8.4` | 53306 | `MYSQL_URL` |
| MongoDB | `mongo:7` | 57017 | `MONGODB_URI` |
| Supabase | `postgres:16-bookworm` + `postgrest/postgrest:v12.2.3` + `nginx:1.27-alpine` | 54321 | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

Supabase is a stack rather than a single image, so it is assembled locally the
way Supabase itself is. It answers on the same `/rest/v1` paths as the hosted
product, which means no cloud account is needed to exercise the claim.

**Base users** — seeded identically into all four databases, covering every
role in [the domain model](docs/05-domain-model.md). Password for all of them
is `rosettadash-dev`, and they exist only inside these containers:

| Role | Emails |
|------|--------|
| `owner` | `owner@rosettadash.test` |
| `admin` | `admin@rosettadash.test` |
| `editor` | `editor@rosettadash.test`, `editor2@rosettadash.test` |
| `viewer` | `viewer@rosettadash.test`, `viewer2@rosettadash.test` |

**Servers** — each container runs the files the matching exporter actually
emits, so a passing check means the generated code compiles, boots, connects,
and returns seeded rows:

| Promise | Runs on | Host port | Generated dependencies |
|---------|---------|-----------|------------------------|
| NestJS | `node:22-bookworm-slim` | 53101 | `@nestjs/*` 11, `pg` |
| Express | `node:22-bookworm-slim` | 53102 | `express` 4, `pg` |
| Next.js | `node:22-bookworm-slim` | 53103 | `next` 15, `react` 19, `pg` |
| Nuxt | `node:22-bookworm-slim` | 53104 | `nuxt` 3, `pg` |

```bash
npm run start:server        # the builder API does the generating
npm run parity:generate     # exporter output → .parity/servers/<target>
npm run parity:servers:up   # boot all four generated servers
npm run parity:check        # seeds + servers + the documented matrix
```

> `npm run parity:check:promises` compares the documented server × database
> matrix against what the exporters will really generate, and fails naming any
> combination the docs claim but the code refuses. All sixteen currently
> generate; treat a future failure as either a missing exporter capability or an
> overstated claim.

### Start the builder (client + server)

You need **both** processes for save, preview, and export:

```bash
npm start
```

Then open **http://localhost:4200**.

### Builder guides & AI assist

| Feature | Where | What it does |
|---------|-------|----------------|
| **Builder guides** | Palette **i** icon, canvas placement prompt, **Admin → Builder guides** | Animated instructions for each palette component |
| **AI assist drawer** | Builder toolbar → **AI assist** | Local **Ollama** or BYOK cloud; review actions, then **Apply to canvas** |
| **Voice input** | AI drawer microphone | Chrome/Edge; enable **Voice** under Admin → AI, voice & environment |
| **Inspector suggestions** | Inspector → **Suggestions** | Rule-based patches from the defaults engine |

**Enable AI**

1. Open **Settings** (nav bar) or `/environment`.
2. Local: install [Ollama](https://ollama.com), pull a model (e.g. `llama3.2`), confirm **Test connection**.
3. Cloud: enter a provider API key (OpenAI, Anthropic, Google, Azure OpenAI) and pick a model.
4. Under **Admin → AI, voice & environment**, ensure **AI assist** (and optionally **Voice**) are enabled.

Guides work offline. AI requires Ollama or BYOK — keys stay in the browser, never on the RosettaDash server.

See [Builder creation assistance](docs/21-builder-creation-assistance.md) and [AI & BYOK integration](docs/20-ai-and-byok-integration.md).

| Service | URL | Notes |
|---------|-----|-------|
| Angular client | http://localhost:4200 | Builder UI |
| NestJS API | http://localhost:3000/api | REST backend |
| Health check | http://localhost:3000/api/health | Confirms server is up |

```bash
curl http://localhost:3000/api/health
```

The Angular dev server proxies `/api/*` to NestJS, so the client calls `/api/...` with no CORS setup.

### Run client or server separately

```bash
npm run start:server   # NestJS only → http://localhost:3000/api
npm run start:client   # Angular only → http://localhost:4200 (needs server for API)
```

### Quality checks (run before committing)

```bash
npm run verify         # lint + typecheck + unit tests
npm run setup:e2e      # re-run if Playwright was upgraded and e2e fails
npm run e2e            # Playwright (starts server + client on :4201/:3001)
npm run verify:all     # both
```

Playwright uses **4201** (client) and **3001** (API) so it can run alongside `npm start` on 4200/3000.

## Publish to npm and GitHub

Maintainers only. CI does **not** publish. Do not publish exporters, proof apps, or Storybook. Do not `npm publish` this monorepo root.

**Packages that go to npm** (built into `dist/packages/`, then packed from there — not from `packages/` source trees):

`@rosettadash/core`, `@rosettadash/web-components`, `@rosettadash/react`, `@rosettadash/angular`, `@rosettadash/vue`, `@rosettadash/svelte`.

Unscoped [`rosettadash`](https://www.npmjs.com/package/rosettadash) is a **thin landing page** (this README + LICENSE), published with `npm run publish:npm:product`. It is not a component barrel.

```bash
npm whoami                          # must be logged in with publish rights on @rosettadash
npm run pack:consumer               # build six packages + media bundle + npm pack
npm run publish:npm:dry-run         # same, then npm publish --dry-run (no registry write)
npm run publish:npm                 # live publish scoped packages --access public
npm run publish:npm:product         # thin unscoped landing page (README + LICENSE)
```

`publish:npm:frameworks` skips `@rosettadash/web-components` when that package is unchanged.

After a successful publish:

1. Tag the commit: `git tag v0.1.3` (match the version you published).
2. Push the tag: `git push origin v0.1.3`.
3. Optional GitHub Release: `gh release create v0.1.3 --title "v0.1.3" --generate-notes`.

This checkout and npm are aligned at **0.1.3** for all six scoped packages. The unscoped landing page is `rosettadash@0.1.3` after `npm run publish:npm:product`.

## Monorepo

This repository is an [Nx](https://nx.dev) workspace (free tier, no Nx Cloud required).

| Project | Path | Description |
|---------|------|-------------|
| `client` | `apps/client` | Angular builder UI |
| `server` | `apps/server` | NestJS API |
| `core` | `packages/core` | Shared types and utilities (`@rosettadash/core`) |
| `web-components` | `packages/web-components` | Custom elements (`@rosettadash/web-components`) |
| `runtime-react` | `packages/react` | React runtime (`@rosettadash/react`) |
| `runtime-vue` | `packages/vue` | Vue 3 runtime (`@rosettadash/vue`) |
| `runtime-angular` | `packages/angular` | Angular runtime (`@rosettadash/angular`) |
| `runtime-svelte` | `packages/svelte` | Svelte 5 runtime (`@rosettadash/svelte`) |
| `destination-atlas` | `libs/destination-atlas` | Shared Destination Atlas screens, mock data, About copy |
| `proof-web-components` | `apps/proof-web-components` | Destination Atlas — custom elements (port 4310) |
| `proof-react` | `apps/proof-react` | Destination Atlas — React (port 4311) |
| `proof-angular` | `apps/proof-angular` | Destination Atlas — Angular (port 4312) |
| `proof-vue` | `apps/proof-vue` | Destination Atlas — Vue (port 4313) |
| `proof-svelte` | `apps/proof-svelte` | Destination Atlas — Svelte (port 4314) |
| `ui-primitives` | `packages/ui-primitives` | Preview mock data and generators |
| `storybook-web-components` | `apps/storybook-web-components` | Storybook — Web Components (port 6006) |
| `storybook-react` | `apps/storybook-react` | Storybook — React (port 6007) |
| `storybook-vue` | `apps/storybook-vue` | Storybook — Vue (port 6008) |
| `storybook-angular` | `apps/storybook-angular` | Storybook — Angular (port 6009) |
| `storybook-svelte` | `apps/storybook-svelte` | Storybook — Svelte (port 6010) |
| `exporters-*` | `packages/exporters-*` | UI / server / database code generators from ExportIR |

Supporting directories that are not Nx projects:

| Path | Description |
|------|-------------|
| `docker/` | Dockerfiles, nginx configs, and `compose.backends.yml` (included by the root `docker-compose.yml`) |
| `docker/seed/` | Generated database seed scripts — committed, so a fresh clone can seed without running anything first |
| `tools/backend-parity/` | Seed model, exporter-driven server generator, and the promise checks |
| `.parity/servers/` | Generated, git-ignored server apps produced by `npm run parity:generate` |

## API (in-memory MVP)

### Projects & composites

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project `{ "name": "..." }` |
| GET | `/api/projects/:id` | Get project with composites |
| PATCH | `/api/projects/:id` | Update project metadata |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/composites` | List composites |
| POST | `/api/projects/:id/composites` | Create composite (validated) |
| PUT | `/api/projects/:id/composites/:cid` | Update composite (validated, version++) |
| DELETE | `/api/projects/:id/composites/:cid` | Delete composite |

Invalid composites return `400` with `{ message, issues }`.

### Preview mock data

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/preview/data` | Generate seeded mock rows/chart/KPI fixtures for builder preview |

Example body:

```json
{
  "projectName": "Revenue Ops",
  "compositeName": "Overview",
  "dateRangePreset": "last-7-days",
  "limit": 5
}
```

### Export

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/export/ir` | Build ExportIR from a strictly validated composite (400 on validation errors) |
| POST | `/api/export/react` | Build ExportIR and generate React UI source files |
| POST | `/api/export/angular` | Build ExportIR and generate Angular UI source files |
| POST | `/api/export/vue` | Build ExportIR and generate Vue UI source files |
| POST | `/api/export/svelte` | Build ExportIR and generate Svelte UI source files |
| POST | `/api/export/nest` | Build ExportIR and generate NestJS + PostgreSQL server files |
| POST | `/api/export/express` | Build ExportIR and generate Express + PostgreSQL server files |
| POST | `/api/export/next` | Build ExportIR and generate Next.js + PostgreSQL server files |
| POST | `/api/export/nuxt` | Build ExportIR and generate Nuxt + PostgreSQL server files |
| POST | `/api/export/mongodb` | Build ExportIR and generate MongoDB database layer files |
| POST | `/api/export/supabase` | Build ExportIR and generate Supabase database layer files |
| POST | `/api/export/mysql` | Build ExportIR and generate MySQL database layer files |
| POST | `/api/export/bundle` | Combined UI + server file list (targets from composite `exportTargets`) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Serve client and server |
| `npm run proof:web-components` | Destination Atlas WC proof (port 4310) |
| `npm run proof:react` | Destination Atlas React proof (port 4311) |
| `npm run proof:angular` | Destination Atlas Angular proof (port 4312) |
| `npm run proof:vue` | Destination Atlas Vue proof (port 4313) |
| `npm run proof:svelte` | Destination Atlas Svelte proof (port 4314) |
| `npm run storybook:web-components` | Storybook WC (port 6006); see also `:react` `:vue` `:angular` `:svelte` |
| `npm run pack:consumer` | Build and pack the six scoped npm packages |
| `npm run publish:npm:dry-run` | Pack, then `npm publish --dry-run` (no registry write) |
| `npm run publish:npm` | Pack and publish the six scoped packages `--access public` |
| `npm run publish:npm:product` | Thin unscoped `rosettadash@0.1.3` landing page (README + LICENSE) |
| `npm run parity:db:up` | Start the four seeded database containers |
| `npm run parity:generate` | Write real exporter output to `.parity/servers/<target>` |
| `npm run parity:servers:up` | Start the four generated server containers |
| `npm run parity:check` | Assert every backend promise holds (seeds, servers, matrix) |
| `npm run parity:check:exporters` | Verify all 16 server × database combinations generate and compile (no Docker needed) |
| `npm run parity:seed` | Regenerate `docker/seed/**` from the preview content |
| `npm run parity:down` | Stop the parity stack |
| `npm run verify` | Lint + typecheck + unit tests |
| `npm run e2e` | Playwright E2E tests |
| `npm run verify:all` | verify + e2e |
| `npm run setup:e2e` | Install Playwright Chromium (required once) |
| `npm run build` | Build client, server, and runtime packages |
| `npm run sync:readme` | Copy this README into `apps/client/public/readme.md` |

## Documentation

See [docs/README.md](docs/README.md) for the full index.

- [Local development & component how-to](docs/13-local-development-and-components.md)
- [Destination Atlas proof apps](docs/43-destination-atlas-proof-apps.md)
- [Storybook component catalog](docs/38-storybook-component-catalog.md)
- [npm consumer install](docs/39-npm-consumer-install.md)
- [CI and hosting](docs/12-ci-and-hosting.md)
- [Docker containers (local)](docs/14-docker-containers.md)
- [Backend parity stack (databases and servers)](docs/44-backend-parity-stack.md)
- [Builder guides & AI assist](docs/21-builder-creation-assistance.md)

## Workflow

**Gate:** Jira ticket + matching branch **before any work.** See [Workflow & Branching](docs/07-workflow-and-branching.md).

1. **Create Jira ticket** in [DAS](https://planetkevin.atlassian.net/jira/software/projects/DAS/boards/68/backlog) (REST API with `.env` credentials; Jira MCP is optional).
2. **Branch** from `development`: `feature/DAS-<n>-<description>` (must match ticket key).
3. Implement on that branch only.
4. Run `npm run verify` before committing.
5. Kevin commits and merges to `development`.

## Current ticket

**[DAS-160](https://planetkevin.atlassian.net/browse/DAS-160)** — this README + npm/GitHub publish docs (`feature/DAS-160-readme-truth-and-npm-release`).

Web Components proof ([DAS-121](https://planetkevin.atlassian.net/browse/DAS-121)): [docs/43-destination-atlas-proof-apps.md](docs/43-destination-atlas-proof-apps.md). Full ticket list: [Planned Tickets](docs/11-planned-tickets.md).

## License

MIT
