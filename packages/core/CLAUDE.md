# @rosettadash/core — CLAUDE.md

Scope: `packages/core/**`. This is the **single source of truth** the whole monorepo depends
on — the Angular builder client, the NestJS server, and every `exporters-*` package all import
types and logic from here rather than redefining them. Read the root `CLAUDE.md` first for the
Jira/branch gate; changes here are rarely "just this package" — check who imports what you're
touching before assuming a change is local.

## The two graphs — don't conflate them

1. **Canvas graph** (`model/types.ts`) — what the builder edits live: `ComponentNode`,
   `Binding`, `NodeLayout`. Mutable, builder-only, never seen by exporters directly.
2. **Export IR** (`ir/types.ts`) — what exporters consume: `IRComponent`, `IRLayout`,
   `IRDataSource`, `ExportIR`. Built once per export by `ir/build-export-ir.ts` from a
   validated canvas graph. **Exporters never parse canvas JSON** — if you're adding exporter
   logic and reaching for `ComponentNode`, stop; you want the `IR*` equivalent instead.

Pipeline: `Canvas Graph → validate (validation/) → IR (ir/build-export-ir.ts) → exporter
packages → GeneratedFile[]`. Full detail: `docs/03-component-model.md`,
`docs/04-export-pipeline.md`.

### `label` is dumb on purpose

Both `ComponentNode.label` and `IRComponent.label` are plain `string`, and
`build-export-ir.ts` copies the canvas node's `label` straight into the IR component at every
node-type branch. If a task is "let the user rename an instance and have it show up in
exports," the IR/exporter side is **already done** — the work is entirely in the builder UI
(see `apps/client/src/app/builder/CLAUDE.md`). Don't add new IR fields or exporter plumbing for
label changes unless you've confirmed the existing field genuinely doesn't cover it.

Don't confuse this with `ComponentDefinition.label` (`model/types.ts`) — that's the static
catalog name ("Bar Chart"), never per-instance, and it's a different field entirely.

## Registry (`registry/`)

`ComponentRegistry` (`registry/component-registry.ts`) holds every registered
`ComponentDefinition`, keyed by `type`, seeded from `P0_COMPONENT_DEFINITIONS` plus
domain-grouped plugin arrays (`*-component-plugins.ts` — extension, news, media, svg, vr,
wasm). `register()`/`registerPlugin()` both throw on a duplicate `type` — registering the same
type twice is a bug, not something to catch-and-ignore.

Adding a new palette component = adding a `ComponentDefinition` (or `ComponentPlugin` if it
needs a client preview adapter) here, then a palette group assignment (2–7 items per group —
see `docs/15-component-and-page-design.md`). See `docs/17-component-plugin-sdk.md` for the
full plugin checklist.

## Exporter plugin contract (`export/exporter-plugin.ts`)

Every exporter package implements `ExporterPlugin`: `generate(ir, options) => GeneratedFile[]`,
declared `targetKind` (`'ui' | 'server' | 'database'`), `supportedTargets`. This is the
contract `apps/server/src/app/export/export.service.ts` dispatches against — new export
targets register here, not by special-casing the server. See
`docs/16-exporter-plugin-sdk.md` for the full "adding a framework" checklist (also summarized
in `docs/02-architecture.md`'s Extensibility section).

## Standalone-first export (product DNA — not a style preference)

Every exporter's default output must be **complete standalone source** — no required
`@rosettadash/*` import in generated app code. Package-mode (`exportMode: 'package'`,
importing `@rosettadash/web-components` etc.) is opt-in, built after the standalone path
works, never the default. If you're implementing or touching a `generate*Files` function,
the standalone path is the one that must work with default options — test that first, and
don't flip a default to package mode without an explicit product decision from Kevin.
Full rule: `docs/32-standalone-first-export.md` (mirrors `.cursor/rules/02-standalone-first-export.mdc`).

## Validation (`validation/`)

`validate-node.ts` and friends run **before** IR is built — a composite that fails validation
never reaches an exporter. If you add a required relationship (e.g. "a chart needs a bound
data source"), it belongs here, not as a runtime check inside an exporter.

## Subfolder map

| Dir | Owns |
|-----|------|
| `model/` | `ComponentNode`, `ComponentDefinition`, ports, layout, stack/export target types |
| `ir/` | `ExportIR` + `build-export-ir.ts` |
| `registry/` | `ComponentRegistry`, plugin registration, display hints |
| `export/` | `ExporterPlugin` contract, stack profile resolution |
| `validation/` | Pre-export graph validation |
| `versioning/` | Composite version history/diff (DAS-52) |
| `defaults/` | Smart-default suggestion engine (DAS-32) |
| `domain/` | Domain context, role visibility, onboarding templates |
| `byok/` | BYOK provider manifests, env/integration catalogs |
| `presentation/` | Presentation-ready layout sizing (DAS-145/146) |
| `grouping/` | Companion-component placement suggestions (DAS-43) |
| `templates/` | Dashboard starter templates |
| `creation-wizard/`, `navigation/`, `content-library/`, `vault/`, `media/`, `ai/`, `viewport/` | Feature-specific support modules — check for an existing pattern before adding a sibling |

## Related docs

- `docs/03-component-model.md` — full model reference
- `docs/04-export-pipeline.md` — IR build + exporter dispatch detail
- `docs/05-domain-model.md` — domain/role/context concepts used across `domain/`, `byok/`
- `docs/16-exporter-plugin-sdk.md`, `docs/17-component-plugin-sdk.md` — extension checklists
