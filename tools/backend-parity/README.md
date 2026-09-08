# Backend parity harness (DAS-185)

Proves the backend claims RosettaDash makes in its docs and Storybook: four
databases, four server frameworks, seeded mock data, and base users.

Full guide: **[docs/44-backend-parity-stack.md](../../docs/44-backend-parity-stack.md)**.
Run everything from the repository root.

```bash
npm run parity:verify      # one command — full check

npm run parity:generate:live   # builder API + generate (one terminal)
npm run parity:stack:proof:react
npm run parity:stack:storybook:react

npm run parity:db:up        # seeded PostgreSQL, MySQL, MongoDB, Supabase
npm run parity:check:db     # assert seeded rows, base users, scope columns

npm run parity:generate     # exporter output → .parity/servers/<target> (API must be up)
npm run parity:servers:up   # boot the four generated servers
npm run parity:check        # everything, including the documented matrix
```

## Files

| File | Role |
|------|------|
| `seed-model.mjs` | Canonical seed model — tables, base users, roles, ports, connection strings, Supabase anon key. The single source of truth. |
| `generate-seeds.mjs` | Renders the model into `docker/seed/<engine>/`. `--check` fails on drift. |
| `parity-composites.mjs` | Canonical composites, built with the real `defaultComponentRegistry` from `dist/packages/core`. |
| `generate-server-apps.mjs` | POSTs composites to the builder's export endpoints and writes runnable apps to `.parity/servers/`. |
| `check-databases.mjs` | Connects to each container with the driver its exporter generates and asserts the seeds. |
| `check-servers.mjs` | Asserts each generated server serves the seeded rows. |
| `check-promises.mjs` | Compares the documented server × database matrix against reality. |
| `check-generated-typecheck.mjs` | Compiles the emitted database modules against the real driver typings, plain and scoped. |
| `run-full-check.mjs` | Orchestrates builder API + Docker + `parity:check` (`npm run parity:verify`). |
| `check-live-scripts.mjs` | Asserts `:live`, `:stack:*`, and `parity:generate:live` wiring (`npm run parity:check:live-scripts`; part of `verify`). |
| `builder-process.mjs` | Start/reuse builder API for one-shot scripts (`ensureBuilderApi`). |

## Tests and smoke

**Full gate (before merge):**

```bash
npm run verify:master
```

Runs, in order: `verify:all` (lint, typecheck, unit tests, e2e),
`parity:verify` (Docker), `smoke:live-scripts` (wiring + manual
checklist printout). Requires Docker and `npm run setup:e2e`.

**Automated (in `npm run verify`, no Docker):**

```bash
npm run test:orchestration      # node:test — argv parsing, builder lifecycle
npm run parity:check:live-scripts   # package.json + Nx project wiring
```

**Full parity integration (Docker):**

```bash
npm run parity:verify   # also runs check-live-scripts first
```

**Manual smoke (before merge):**

```bash
npm run smoke:live-scripts
```

Prints five commands to run once locally (`proof:react:live`,
`storybook:react:live`, both `parity:stack:*` demos, `parity:generate:live`).
Ctrl+C each when satisfied.


**Row data is never written twice.** `orders` and `news_articles` rows come
from `packages/ui-primitives/preview-content.json`, the same file the builder
serves as preview content. Edit that file, run `npm run parity:seed`, and every
engine reseeds together.

**Server code is never hand-written.** Everything under `.parity/servers/` that
matters comes from the exporters via the builder's own HTTP endpoints. Only the
wrapper — `package.json`, `tsconfig.json`, and the entry files Next and Nuxt
refuse to boot without — is authored here.

**Checks fail loudly.** `check-promises.mjs` names every documented
server × database combination the exporters refuse. It found twelve of sixteen
broken, which is what drove the exporter fix; it now passes. A future failure
means the gap has to be closed in code or corrected in the docs, not quietly
tolerated.

## Ports

| Service | Host port | Notes |
|---------|-----------|-------|
| Builder API | **3000** | Unchanged — `npm run start:server` |
| Parity databases | 55432, 53306, 57017, 54321 | See `PARITY_PORTS` in `seed-model.mjs` |
| Parity servers | 53101–53104 | Map to **8080** inside each container |
| PostgREST (Supabase stack) | — | **3000** inside Docker; gateway on **54321** |

Set `PARITY_BUILDER_API` if your builder is not on `:3000`.

## Prerequisites

- Docker with Compose v2
- `npx nx build core` — `parity-composites.mjs` loads the compiled core package
- The builder API running (`npm run start:server`) for `parity:generate` and
  `parity:check:promises`, or use `npm run parity:generate:live` /
  `npm run parity:verify`

## Credentials

All local dev fixtures, committed on purpose so the stack is reproducible:
database passwords, the base-user password (`rosettadash-dev`), the PostgREST
signing secret, and the Supabase anon key. None are valid outside these
containers. Never reuse them.
