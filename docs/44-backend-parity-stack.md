# Backend parity stack (DAS-185)

RosettaDash was validated on the front end. The backend was not. Every backend
claim in the docs and in Storybook — four databases, four server frameworks —
was an assertion rather than a tested fact.

This stack exists to change that. It provides one container per promise, seeded
with the same mock data the builder previews and with a known set of base
users, plus checks that fail loudly when a documented promise does not hold.

Everything is reachable from the repository root, so a fresh clone or a
download from GitHub can run it without hunting through subdirectories.

## What was actually true before this

Worth stating plainly, because it shapes the design:

- `apps/server` stores projects and composites in an in-memory `Map`. Restart
  the process and the data is gone. `main.ts` says as much.
- Builder preview data came from the static
  `packages/ui-primitives/preview-content.json`, never from a database — even
  though that file describes PostgreSQL tables.
- The live data-source probe implemented PostgreSQL and Supabase only. MySQL
  and MongoDB returned the string "live probe is not implemented yet".
- There were no database containers at all. `docker-compose.yml` only built the
  app itself.
- Root dependencies included `pg` but not `mysql2` or `mongodb`, so two of the
  four promised databases had no client in the repository.
- There was no seed data and no concept of a base user. No file matching
  `*seed*` existed.
- No integration test anywhere touched a database.

## Quick start

```bash
npm run parity:db:up        # PostgreSQL, MySQL, MongoDB, Supabase — seeded
npm run parity:check:db     # assert seeded rows, base users, scope columns
npm run parity:down         # stop everything
```

The compose services live in `docker/compose.backends.yml`, which the root
`docker-compose.yml` pulls in with `include`. That means plain Docker commands
work from the root too:

```bash
docker compose --profile db up -d
docker compose --profile postgres up -d      # or mysql / mongo / supabase
docker compose --profile servers up -d
```

## Database promises

| Promise | Image | Host port | Env keys |
|---------|-------|-----------|----------|
| PostgreSQL | `postgres:16-bookworm` | 55432 | `DATABASE_URL` |
| MySQL | `mysql:8.4` | 53306 | `MYSQL_URL` |
| MongoDB | `mongo:7` | 57017 | `MONGODB_URI` |
| Supabase | `postgres:16-bookworm` + `postgrest/postgrest:v12.2.3` + `nginx:1.27-alpine` | 54321 | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

Ports are offset into the 5xxxx range so the containers never collide with a
Postgres, MySQL, or MongoDB you already run locally.

### Why Supabase is three containers

Supabase is a stack, not an image. The promise is implemented the way Supabase
itself is: Postgres for storage, PostgREST for the REST surface, and a gateway
that exposes the `/rest/v1` path Supabase clients expect. The builder's
existing Supabase probe and the generated `@supabase/supabase-js` client both
work against it unmodified, which is the point — testing against this proves
the shipped code path, and needs no cloud account.

The anon key is a real HS256 JWT signed with a fixed local secret, derived in
`tools/backend-parity/seed-model.mjs` so it cannot drift from the secret
PostgREST is configured with.

## Seed data

`docker/seed/**` is generated, and committed so that a fresh clone can seed
without running anything first:

```
docker/seed/postgres/001-schema.sql
docker/seed/mysql/001-schema.sql
docker/seed/mongo/001-seed.js
docker/seed/supabase/001-schema.sql
docker/seed/connection.env
```

Regenerate with `npm run parity:seed`. `npm run parity:seed:check` fails if the
committed artifacts have gone stale, so drift is caught rather than discovered.

### Single source of truth

Rows for `orders` and `news_articles` are read out of
`packages/ui-primitives/preview-content.json` — the same file the builder
serves as preview content. A row in the container is the row the builder
previews. Editing that file and re-running `npm run parity:seed` reseeds every
engine at once.

| Table / collection | Rows | Source |
|--------------------|------|--------|
| `orders` | 8 | `preview-content.json` → `datasets.orders` |
| `news_articles` | 4 | `preview-content.json` → `datasets.news` |
| `people` | 6 | Base users, below |
| `roles` | 4 | The role model in [docs/05-domain-model.md](./05-domain-model.md) |

### Scope columns are not optional

`packages/core/src/lib/domain/query-scope.ts` hard-codes `client_id`,
`project_id`, and `created_at` as the columns scoped exports filter on. A table
missing them makes generated scoped code return nothing, silently. Every seeded
table therefore carries all three, and `npm run parity:check:db` asserts a
scoped query still returns the full row count.

```
ROSETTADASH_CLIENT_ID=client-northwind
ROSETTADASH_PROJECT_ID=project-revenue
```

### Base users

Seeded identically into all four databases, covering every role in the domain
model. Two users each for `editor` and `viewer` so a role filter can be shown
to actually filter rather than coincidentally returning the only row.

| Role | Email | Display name |
|------|-------|--------------|
| `owner` | `owner@rosettadash.test` | Ada Owner |
| `admin` | `admin@rosettadash.test` | Bo Admin |
| `editor` | `editor@rosettadash.test` | Cy Editor |
| `editor` | `editor2@rosettadash.test` | Di Editor |
| `viewer` | `viewer@rosettadash.test` | El Viewer |
| `viewer` | `viewer2@rosettadash.test` | Fi Viewer |

The password for all of them is `rosettadash-dev`. `password_hash` is a plain
SHA-256 of `email:password` — a deterministic dev fixture, deliberately not a
real KDF, and never valid outside these containers.

## Server promises

Each server container runs the files its exporter **actually emits**. Nothing
is hand-written. `npm run parity:generate` POSTs a canonical composite to the
builder's own export endpoints and writes the response to
`.parity/servers/<target>/`, so the generation path under test is the
production one: controller → `ExportService` → exporter.

| Promise | Host port | Generated dependencies | Entry emitted by exporter |
|---------|-----------|------------------------|---------------------------|
| NestJS | 53101 | `@nestjs/*` 11, driver | `server/src/main.ts` |
| Express | 53102 | `express` 4, driver | `server/src/index.ts` |
| Next.js | 53103 | `next` 15, `react` 19, driver | `server/src/app/api/orders/route.ts` |
| Nuxt | 53104 | `nuxt` 3, driver | `server/api/orders.get.ts` |

Host ports **53101–53104** map to **8080** inside each server container so
they never compete with the builder API on **:3000**. Set `PARITY_BUILDER_API`
when generating if your builder listens elsewhere.

The driver depends on the targeted engine: `pg`, `mysql2`, `mongodb`, or
`@supabase/supabase-js`. The containers run against Postgres, since that is the
engine the seeded server apps are generated for.

All four run on `node:22-bookworm-slim` and install their own dependencies on
first boot, so the first `parity:servers:up` takes a few minutes.

Only the wrapper — `package.json`, `tsconfig.json`, and the entry files Next
and Nuxt refuse to boot without — is written by the harness. NestJS compiles
with `tsc` rather than an esbuild-based runner because its dependency injection
reads emitted decorator metadata, which esbuild drops.

```bash
npm run start:server        # the builder API does the generating
npm run parity:generate
npm run parity:servers:up
npm run parity:check:servers
```

A pass means the generated code compiled, booted, connected to Postgres, and
returned the seeded rows.

## The documented matrix

`npm run parity:check:promises` walks every server × database combination the
docs claim and reports what the exporters will really generate.

```
  server   postgresql  mysql       mongodb     supabase
  nest     works       works       works       works
  express  works       works       works       works
  next     works       works       works       works
  nuxt     works       works       works       works
```

### What was broken, and how it was fixed

All four server exporters used to hard-require a PostgreSQL data source and
reject everything else with, for example, "Nest infra export requires at least
one PostgreSQL data source". Twelve of the sixteen documented combinations were
untrue. A MySQL, MongoDB, or Supabase composite produced a database layer and
never a server.

The cause was that each exporter emitted a hard-coded `pg` pool and imported
`Pool` from `pg` in its route handlers. The fix introduces one seam:
`packages/core/src/lib/export/server-database-adapter.ts` generates the
database module for any engine behind a uniform contract.

```ts
export type DataClient = /* engine-specific client */;
export function createDataClient(): DataClient;
export function queryRows(client, source, limit?): Promise<Record<string, unknown>[]>;
export function closeDataClient(client): Promise<void>;
```

Server exporters now import `DataClient` from the generated module instead of
from a driver package, so the server shape is independent of the engine. Nest
keeps its idiom by wrapping the module in an injectable `DatabaseService`;
Express, Next, and Nuxt call it directly.

`npm run parity:check:typecheck` compiles the emitted module for each engine
against the real driver typings, in both plain and scoped form, so a template
that merely looks right cannot pass. All four engines compile, including
Supabase (`@supabase/supabase-js` is a root dependency).

`ExportService.buildBundleExport` was fixed at the same time. A database target
used to short-circuit the server, so a bundle with a MySQL target emitted no
server at all. Bundles now carry UI, server, and database layers, de-duplicated
by path.

### Export drivers (implemented)

Server and database exporters emit **`pg`**, **`mysql2`**, **`mongodb`**, and
**`@supabase/supabase-js`** modules via
`packages/core/src/lib/export/server-database-adapter.ts`. Use the local parity
stack (`docs/44-backend-parity-stack.md`) to exercise each engine.

Prisma and Mongoose are **not** generated today. If we add them later, they
need their own exporters and parity checks — until then they do not appear in
the technology stack docs as shipped options.

## Live probes

The builder's data-wiring probe (`POST /api/preview/probe-source`) now covers
all four promised databases. MySQL and MongoDB were previously stubs that
returned "not implemented yet"; `mysql2` and `mongodb` are now root
dependencies alongside `pg`.

Point the probe at the parity containers using the connection strings in
`docker/seed/connection.env`.

## Layout

| Path | What it is |
|------|-----------|
| `docker/compose.backends.yml` | All parity services; included by the root `docker-compose.yml` |
| `docker/supabase-gateway.conf` | nginx config exposing PostgREST under `/rest/v1` |
| `docker/seed/**` | Generated, committed seed scripts |
| `tools/backend-parity/seed-model.mjs` | Canonical seed model, base users, ports, connection strings |
| `tools/backend-parity/generate-seeds.mjs` | Renders the model per engine |
| `tools/backend-parity/parity-composites.mjs` | Canonical composites, built with the real component registry |
| `tools/backend-parity/generate-server-apps.mjs` | Exporter output → runnable apps |
| `tools/backend-parity/check-databases.mjs` | Seeded rows, base users, scope columns |
| `tools/backend-parity/check-servers.mjs` | Generated servers serve seeded rows |
| `tools/backend-parity/check-promises.mjs` | Documented matrix vs. reality |
| `tools/backend-parity/check-generated-typecheck.mjs` | Emitted database modules compile against real driver typings |
| `packages/core/src/lib/export/server-database-adapter.ts` | The one seam that makes servers engine-agnostic |
| `.parity/servers/**` | Generated apps (git-ignored) |

## Security note

Every credential in this stack is a local dev fixture: database passwords, the
base-user password, the PostgREST signing secret, and the Supabase anon key.
They are committed on purpose so the stack is reproducible. None of them are
valid anywhere but these containers, and none should ever be reused.
