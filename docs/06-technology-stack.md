# Technology Stack

> **Status note:** This doc mixes original decisions with current shipped state. For day-to-day versions (Node, test runners), prefer [Local Development](./13-local-development-and-components.md). For component counts, prefer [Component Taxonomy — shipped snapshot](./08-component-taxonomy.md#shipped-registry-snapshot).

## Builder application

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Client** | Angular 22 (latest stable with broad ecosystem support) | Strong structure for complex builder UI; team direction; CDK for drag-drop |
| **Server** | NestJS | TypeScript parity with client; modular architecture; aligns with export target |
| **Monorepo** | Nx 23 (free tier, no Nx Cloud) | Shared `packages/core` between client and server |
| **Language** | TypeScript (strict) | End-to-end type safety; shared models |

### Angular client libraries (in use)

| Concern | Library direction |
|---------|-------------------|
| Drag and drop | `@angular/cdk/drag-drop` |
| Forms / inspector | Reactive forms + schema-driven renderer |
| Charts (preview) | Lightweight preview renderers + `@rosettadash/ui-primitives` mock data |
| HTTP | `HttpClient` to NestJS API |
| Styling | SCSS + CSS variables; builder chrome uses `app-*` BEM ([doc 28](./28-app-component-css-convention.md)) |

### NestJS server libraries (in use)

| Concern | Library direction |
|---------|-------------------|
| Validation | `class-validator` + DTOs |
| Persistence | File-backed projects/composites (MVP); export orchestration |
| Export orchestration | Custom job runner; zip via `archiver` |
| Config | `@nestjs/config` |

## Export targets — UI frameworks

| Framework | Generator output | Notes |
|-----------|------------------|-------|
| **React** | TSX + stack styling profile | Hooks-based patterns |
| **Angular** | Standalone components | Signals-friendly patterns |
| **Vue** | Composition API components | Native + CE-host for media |
| **Svelte** | Svelte 5 components (`.svelte` source) | Shipped runtime package + exporter |
| **Web Components** | Custom elements (`rd-*`) | Canonical DOM; also standalone export target |

Solid and other frameworks remain future via exporter plugin interface.

## Published runtime packages (npm)

Consumers install `@rosettadash/<runtime>` — see [Public component API](./34-public-component-api.md).

| Package | Role |
|---------|------|
| `@rosettadash/web-components` | Canonical CE implementation + vanilla HTML target |
| `@rosettadash/react` | React wrappers / native ports |
| `@rosettadash/angular` | Angular standalone ports |
| `@rosettadash/vue` | Vue 3 ports |
| `@rosettadash/svelte` | Svelte 5 ports |

Five matching Storybook apps (ports 6006–6010) — [Storybook catalog](./38-storybook-component-catalog.md).

## Export targets — server partners

| Partner | Generated patterns |
|---------|-------------------|
| **Next.js** | App Router API routes or Route Handlers |
| **Nuxt** | Server routes / `server/api/` |
| **NestJS** | Modules, controllers, providers |
| **Express** | Router modules, middleware chain |

## Export targets — databases

| Database | Client/driver direction |
|----------|------------------------|
| **MongoDB** | Official driver or Mongoose |
| **PostgreSQL** | Prisma (preferred when no added cost) or `pg` |
| **Supabase** | `@supabase/supabase-js` |
| **MySQL** | Prisma or `mysql2` |

## Shared packages

| Package | Contents |
|---------|----------|
| `packages/core` | Types, IR, validation, component registry, shared media/BYOK logic |
| `packages/exporters-*` | Per-target code generators (UI, server, database) |
| `packages/ui-primitives` | Preview mock data helpers (builder + Storybook) |
| `packages/web-components` | Published `@rosettadash/web-components` |
| `packages/react`, `angular`, `vue`, `svelte` | Published framework runtime ports |
| `tools/runtime-taxonomy/` | Manifest + codegen templates (source of truth for npm subpaths) |

## Development tooling

| Tool | Purpose |
|------|---------|
| ESLint + Prettier | Lint/format |
| Jest | Unit tests (runtime packages, core, client, server, exporters) |
| Playwright | E2E builder flows (`apps/client-e2e`) — shipped |
| Storybook 10 + Vite | Per-runtime component catalogs |

## Runtime requirements

| Context | Node version |
|---------|--------------|
| Monorepo dev + CI | **Node 22.x** (see [Local Development](./13-local-development-and-components.md)) |
| Builder server | Node 22.x recommended |
| Exported projects | Document per target; generally Node 18+ |

## Explicit non-choices (for now)

| Alternative | Why not initially |
|-------------|-------------------|
| Builder in React | Team chose Angular for builder |
| Builder server in Express | NestJS better matches export targets and structure |
| Proprietary runtime for exports | Violates portability goal |
| GraphQL for builder API | REST sufficient for MVP |

## Decision log

| Date | Decision | Ticket |
|------|----------|--------|
| 2026-08-08 | Angular + NestJS for builder runtime | DAS-1 |
| 2026-08-08 | React, Angular, Vue as initial export UI targets | DAS-1 |
| 2026-08-08 | Next, Nuxt, Nest, Express as initial server targets | DAS-1 |
| 2026-08-08 | MongoDB, PostgreSQL, Supabase, MySQL as initial DB targets | DAS-1 |
| 2026-08-08 | Nx free tier for monorepo; repo is source of truth | DAS-2 |
| 2026-08-08 | Single-user MVP; no auth initially | DAS-2 |
| 2026-08-08 | Angular 22; standalone components for export default | DAS-2 |
| 2026-08-08 | Prisma preferred for PG/MySQL export when no added cost | DAS-2 |
| 2026-08-08 | Neutral design tokens (no brand preset) | DAS-2 |
| 2026-08-08 | `development` branch is integration target for PRs | DAS-2 |
| 2026-08-28 | Svelte + Web Components shipped as export targets and npm runtimes | — |
| 2026-08-28 | Node 22.x for monorepo dev/CI; Playwright e2e shipped | — |

Subsequent decisions append here with Jira references.

## Related documents

- [Architecture](./02-architecture.md)
- [Export Pipeline](./04-export-pipeline.md)
- [Roadmap](./10-roadmap.md)
