# Stack server & database validation (DAS-78)

**Ticket:** [DAS-78](https://planetkevin.atlassian.net/browse/DAS-78)  
**Branch:** `feature/DAS-78-stack-server-database-validation`  
**Follows:** DAS-57 stack profile, DAS-64 styling compatibility, DAS-77 `app-collapsible` + Welcome None chips

---

## Problem

Welcome shows the **same** server and database options for every UI framework. Users can persist incompatible pairs (e.g. React + Nuxt, Vue + Next.js). We normalize missing values to partner defaults but do **not**:

- Filter options by UI framework
- Strip invalid persisted choices
- Offer explicit **None** semantics consistently (None exists; filtering does not)

Styling already solved this pattern (`getStyling*StackOptions`, `normalizeStackStyling`, empty defaults on UI change).

---

## Product rules (proposed)

### Server by UI

| UI | Compatible servers (excl. `none`) | Notes |
| ---- | ----------------------------------- | ------- |
| React | Next.js, NestJS, Express | Next = idiomatic full-stack |
| Vue | Nuxt, NestJS, Express | Nuxt = idiomatic full-stack |
| Angular | NestJS, Express | No Next/Nuxt |
| Svelte | NestJS, Express | No Next/Nuxt |
| Web Components | Next.js, Nuxt, NestJS, Express | All database options; no UI-specific filtering |

### Database by UI

All concrete UI frameworks get the same database set today (PostgreSQL, MongoDB, Supabase, MySQL, None). Export matrix supports UI × DB layer independently.

Optional follow-up: hide MongoDB/MySQL/Supabase when server is `none` and user is UI-only (soft hint only).

### Normalization

When UI changes or profile is loaded:

1. If `server` is incompatible with `ui` → reset to partner default (or `none` if user had `none`)
2. If `database` is incompatible → same
3. `normalizeStackProfile` filters invalid values (mirror styling)

---

## Core API (`packages/core/src/lib/export/stack-profile.ts`)

```typescript
export function getCompatibleServerStackOptions(ui: UiFrameworkChoice)
export function getCompatibleDatabaseStackOptions(ui: UiFrameworkChoice)
export function isServerCompatibleWithUi(ui, server): boolean
export function isDatabaseCompatibleWithUi(ui, database): boolean
```

Constants:

```typescript
const SERVER_BY_UI: Record<UiFrameworkChoice, StackServerChoice[]>
const DATABASE_BY_UI: Record<UiFrameworkChoice, StackDatabaseChoice[]>
```

---

## Welcome page

- Replace static `SERVER_STACK_OPTIONS` / `DATABASE_STACK_OPTIONS` with computed `getCompatible*StackOptions(ui)`
- On `selectUi`: reset server/database if incompatible (same as styling reset)
- Tests: React shows Next, not Nuxt; Vue shows Nuxt, not Next

---

## Export note

The export target matrix currently tests **all** UI × server file combinations (16 pairs). Validation is a **product/idiom** constraint for stack setup, not an export capability limit. Next remains React-oriented; Nuxt remains Vue-oriented.

---

## Out of scope (DAS-78)

- Live database connectivity / credential ping
- AI readiness gate on Welcome continue
- Server exporters for non-Node stacks (Python, Java, Azure Functions)

**Note (DAS-188):** Welcome still does not ping live databases. The
**backend parity stack** (`docs/44-backend-parity-stack.md`) and Destination
Atlas Stack tab (React/Angular) **do** prove live connectivity when Docker is
up — that is validation infrastructure, not Welcome UX.

---

## Test plan

- [ ] `stack-profile.spec.ts` — compatibility helpers + normalization strips invalid server/db
- [ ] `welcome-page.component.spec.ts` — filtered chips per UI, reset on UI change
- [ ] `npm run verify:all`
