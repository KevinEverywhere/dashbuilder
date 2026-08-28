# RosettaDash — CLAUDE.md

RosettaDash is a visual dashboard **builder** (Angular client + NestJS server) that exports
**standalone, framework-native source code** — not a runtime dependency on RosettaDash itself.
A user drags components onto a canvas, wires bindings, and exports a real React/Angular/Vue/
Svelte/Web-Components app with an optional server (Next/Nuxt/Nest/Express) and database
(Mongo/Postgres/Supabase/MySQL). `packages/core` is the single source of truth for the
component model and the Export IR that every exporter consumes.

Nested `CLAUDE.md` files exist for areas with their own conventions — read them when working
in that area:

- `apps/client/src/app/builder/CLAUDE.md` — canvas/inspector/palette, state service patterns
- `packages/core/CLAUDE.md` — component model, registry, Export IR, exporter plugin contract

Full detail lives in `docs/01`–`docs/43` (numbered, topic-per-file). This file is the fast-start
operational layer — when it and a numbered doc disagree, the doc is more likely current; flag the
conflict rather than silently picking one.

`AGENTS.md` is a symlink to this file — Cursor and Claude Code share one entry point.

## Agent rules (`.cursor/rules/` and nested)

Cursor loads `.mdc` rules automatically. **Claude Code:** read the files below when working in
the matching area (same content as Cursor rules).

### Process (always apply)

| Rule | Purpose |
|------|---------|
| `.cursor/rules/00-agent-no-commits.mdc` | Agents never commit or push |
| `.cursor/rules/01-jira-ticket-and-branch.mdc` | DAS ticket + feature branch gate |
| `.cursor/rules/02-standalone-first-export.mdc` | Standalone export is default |
| `.cursor/rules/10-component-library-charter.mdc` | Multi-runtime parity constitution |

### Component library (glob-scoped at repo root)

| Rule | When to read |
|------|--------------|
| `11-component-public-contract.mdc` | Any `packages/{web-components,react,angular,vue,svelte}/**` work |
| `12-styling-tokens-and-css.mdc` | Styling, BEM, `--rd-*` tokens |
| `13-accessibility.mdc` | WCAG 2.2 AA, keyboard, ARIA |
| `14-parity-and-codegen.mdc` | `manifest.mjs`, `generate-*-runtime.mjs` |
| `15-testing-and-verification.mdc` | Jest specs, verify, E2E |
| `16-ssr-and-runtime-environment.mdc` | SSR guards, client-only components |
| `17-performance-and-packaging.mdc` | exports map, tree-shaking, peers |
| `18-docs-and-catalog-upkeep.mdc` | docs, Storybook, README tables |
| `26-exporter-authoring.mdc` | `packages/exporters-*/**` |
| `30-media-and-video.mdc` | Video, equirect, wasm media |
| `31-vr-and-3d.mdc` | Three.js, WebXR roadmap |
| `32-storage-and-persistence.mdc` | localStorage / sessionStorage |
| `33-dashboard-and-data-components.mdc` | Charts, tables, KPIs, filters |

### Per-language (nested under package)

| Rule | Path |
|------|------|
| Web Components authoring | `packages/web-components/.cursor/rules/web-components-authoring.mdc` |
| Vanilla HTML/JS/CSS target | `packages/web-components/.cursor/rules/vanilla-target.mdc` |
| React | `packages/react/.cursor/rules/react-authoring.mdc` |
| Angular | `packages/angular/.cursor/rules/angular-authoring.mdc` |
| Vue | `packages/vue/.cursor/rules/vue-authoring.mdc` |
| Svelte | `packages/svelte/.cursor/rules/svelte-authoring.mdc` |
| Core taxonomy + IR | `packages/core/.cursor/rules/core-taxonomy-and-ir.mdc` |
| Builder app | `apps/client/.cursor/rules/builder-app.mdc` |

## Mandatory gate — Jira ticket + branch before ANY work

**This is not optional and does not bend for "it's small."** Docs-only, config, a one-line fix —
all of it needs a ticket first. See `docs/07-workflow-and-branching.md` and
`docs/11-planned-tickets.md` for full policy; the load-bearing rules:

1. **Create a DAS Jira ticket** before writing/editing anything (see "Jira access" below).
   Confirm the real key (e.g. `DAS-149`) — never assume or reuse a number from memory.
2. **Create a matching feature branch** from `development`:
   `feature/DAS-<n>-<kebab-case-summary>` — the number must match the Jira key exactly.
3. **Work only on that branch.** Never commit to `main` or `development` directly.
4. If git history references a `DAS-n` that Jira doesn't have, stop and create the ticket
   first — don't paper over the gap.

### Jira access (credentials in `.env`)

Use the REST API directly with credentials from `.env` (`JIRA_BASE_URL`, `JIRA_EMAIL`,
`JIRA_API_KEY`, `JIRA_PROJECT_KEY=DAS`). Do not wait on Jira MCP auth. Lessons already
paid for, so you don't re-pay them:

- The old `GET /rest/api/3/search` is **removed**. Use `POST /rest/api/3/search/jql` with a
  JSON body (`{"jql": "...", "maxResults": N, "fields": [...]}`) to find the latest ticket
  number before creating a new one — never guess the next `DAS-n`.
- **Never use `curl -s` alone** for these calls — silent mode swallows network/auth errors
  too, so a failed call and a successful-but-empty one look identical. Always use
  `curl -sS --max-time 15 -w "\nHTTP_STATUS:%{http_code}\n"` so failures are visible.
- Write the issue JSON payload to a scratch file first (description is Atlassian Document
  Format — a `doc`/`paragraph`/`bulletList` tree, not markdown) and POST with `--data @file`
  rather than inlining a large heredoc in one command.
- `POST /rest/api/3/issue` with `fields.project.key: "DAS"`, `fields.issuetype.name` (one of
  `Story`, `Task`, `Bug`, `Feature`, `Epic`), `fields.summary`, `fields.description` (ADF).
- **Run the create exactly once.** If a network call seems to have produced no output, verify
  in Jira (or retry with the `-sS -w` form above) before re-running the POST — don't have both
  you and the user fire the same create as a "just in case." Duplicate tickets from this exact
  mistake have happened; if it happens again, delete the duplicate (`DELETE
  /rest/api/3/issue/<key>`) rather than leaving both live.
- `scripts/jira-close-done.mjs` shows the same auth pattern for transitioning tickets to Done.

### Branch / commit / push discipline

- **Agents never commit.** Not `git commit`, not `git commit --amend`, not staging files for
  a commit Kevin didn't ask you to stage. Never ask "want me to commit?" — implement, verify,
  summarize, stop. If asked, draft a commit message in chat only.
- **Agents never push.** No exceptions, ever, for any branch.
- Kevin is the sole committer and sole pusher. Feature branches stay local unless he says
  otherwise.
- Commit message format (for drafting only): `<type>(DAS-<n>): <summary>` — types: `feat`,
  `fix`, `docs`, `chore`, `refactor`, `test`.
- PR title: `[DAS-n] Summary matching the Jira ticket`.

## Before calling anything done

```bash
npm run verify        # lint + typecheck + test — required before every commit
npm run verify:all     # verify + Playwright e2e — required when the change touches builder UI
```

Don't propose a change as ready if `verify` hasn't been run and is passing.

## Monorepo map

Nx monorepo, npm workspaces.

```
apps/
  client/          Angular standalone builder UI — canvas, palette, inspector, preview, export wizard
  server/          NestJS API — projects/composites CRUD, export orchestration, preview data
  client-e2e/      Playwright E2E for the builder
  proof-*/         Five parallel "Destination Atlas" demo apps (react/angular/vue/svelte/web-components) —
                    prove runtime parity across frameworks, not kitchen-sink examples
  storybook-*/     Per-framework Storybook catalogs for the published runtime packages
packages/
  core/            Component model, registry, Export IR, validation — see packages/core/CLAUDE.md
  ui-primitives/   Preview mock data helpers
  exporters-*/     Code generators, one per UI framework / server / database target — consume IR only
  web-components/  Published @rosettadash/web-components runtime (W3C Custom Elements)
docs/              Numbered topic docs — architecture, component model, export pipeline, workflow, etc.
scripts/           Codegen (per-framework runtime generation), Jira housekeeping, e2e port checks
```

Two runtime contexts, don't conflate them: the **builder runtime** (this Angular+NestJS app,
what you're editing) vs. the **exported runtime** (the user's generated app — standalone
framework code, never a dependency on the builder or on `@rosettadash/*` unless the user
explicitly opts into package mode).

## Product DNA: standalone-first export

Every exporter must emit **complete, standalone source** in the export zip by default — no
required `@rosettadash/*` runtime import in generated app code. `@rosettadash/web-components`
and other importable packages are opt-in (`exportMode: 'package'`), for users who want it, not
the default path. Omitting export options must produce standalone output; tests must assert
this. See `docs/32-standalone-first-export.md`.

## Component model, in one paragraph

A placed instance is a `ComponentNode` (`packages/core/src/lib/model/types.ts`): `id`, `type`,
`label`, `properties`, typed `ports.inputs`/`ports.outputs`, optional `layout` and `meta`.
`label` is the human-facing instance name (distinct from `ComponentDefinition.label`, which is
the static catalog name like "Bar Chart") — it's already threaded through
`build-export-ir.ts` into every exporter's IR node, so renaming it is UI-only work, no new
plumbing. See `packages/core/CLAUDE.md` for the full model and IR pipeline.

## Environment / secrets

- `.env` holds real credentials (Jira, etc.) — never print its raw contents into a commit,
  doc, or anywhere outward-facing. Reading specific values to do the task (e.g. `JIRA_API_KEY`
  for a ticket create) is fine; dumping the whole file is not.
- Exports must never embed real secrets — only env var placeholders + `.env.example`. This is
  a hard export-validation rule, not a style preference.

## When you're not sure

- Which doc is authoritative for a topic → check `docs/09-glossary.md` and the "Related
  documents" footer of the nearest numbered doc.
- Whether a ticket already covers this → search Jira (`search/jql`) before assuming; also
  check `docs/11-planned-tickets.md`, but treat it as possibly stale against real Jira.
- Branch/commit policy specifics → `docs/07-workflow-and-branching.md` is the long-form
  version of the gate above.
