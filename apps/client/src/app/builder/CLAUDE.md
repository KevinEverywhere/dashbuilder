# Builder UI — CLAUDE.md

Scope: `apps/client/src/app/builder/**` — the Angular standalone builder shell (canvas,
palette, inspector, preview, export wizard). Read the root `CLAUDE.md` first for the Jira/
branch gate and repo-wide rules; this file is the operational layer for this subtree only.

## State lives in `BuilderStateService`

`builder-state.service.ts` is the single owner of canvas state — components don't hold their
own copies. Everything reads/writes through it via Angular signals:

- `nodes: Signal<ComponentNode[]>` — the placed components
- `selectedNodeIds`, `selectedNodeId` (computed), `selectedNodeIdsSet` (computed)
- Mutators follow one shape: `updateNodeProperty(nodeId, key, value)`,
  `updateNodeLayout(nodeId, patch, opts)` — read one of these before adding a new mutator so
  the new one matches the pattern instead of inventing another.

### The history/dirty pattern — every mutator follows this

```ts
if (!this.historySuspended) {
  this.recordHistory();     // snapshot BEFORE the change, for undo
}
this.nodes.update((nodes) => /* immutable replace */);
this.markDirty();           // flags unsaved changes
```

- `recordHistory()` / `historySuspended` — undo/redo (`history/` subfolder) works by snapshot,
  not by inverse-operation replay. Any state mutation a user should be able to undo needs this
  guard; anything that's a side-effect of another already-recorded change (e.g.
  `syncPresentationLayout` reacting to a property change) passes `{ skipHistory: true }` so it
  doesn't create a second undo step for one user action.
- `markDirty()` — call after every user-visible state change, full stop. It's what drives the
  unsaved-changes indicator and autosave.
- No-op guard: mutators check whether the new value actually differs before touching state/
  history (see `updateNodeProperty`'s `current?.properties[key] === value` early return) —
  match this so accepting an unchanged inline edit doesn't spam the undo stack.

## Module map

| Dir | Role |
|-----|------|
| `canvas/` | Design surface — node placement, selection, drag/resize, grouping guides |
| `palette/` | Searchable/accordion component catalog (2–7 items per group — DAS-44) |
| `inspector/` | Schema-driven property forms + domain context + version history panels |
| `preview/` | Builder-side WYSIWYG approximation of exported output |
| `export/` | Export wizard — target pickers, env var review |
| `creation-wizard/` | Guided/self-exploration onboarding overlays |
| `history/` | Undo/redo snapshot engine consumed by `BuilderStateService` |

`ComponentNode.label` (the instance name, not the catalog `ComponentDefinition.label`) is
rendered in **two places today** — keep them in sync when either changes:

- `canvas.component.html` — `<span class="canvas__node-name">{{ node.label }}</span>` inside
  the `canvas__node-namebar` header (`data-testid="canvas-node-header"`), alongside the remove
  button whose `aria-label` also interpolates `node.label`.
- `inspector.component.html` — the Overview section's `<h3 class="inspector__title">` currently
  shows `def.label` (the static catalog name), **not** the per-instance label. If you're wiring
  instance-label editing into the inspector, that's the section to extend, not `def.label`
  itself — the catalog label and the instance label are different fields with different
  purposes; don't collapse them.

## Testing conventions

- `data-testid` on interactive/structural elements (`canvas-node-header`,
  `canvas-node-remove-<id>`, etc.) — Playwright E2E and component tests key off these, not CSS
  classes or text content. Add one for any new interactive affordance.
- Component/service specs sit next to their source (`*.component.spec.ts`,
  `*.service.spec.ts`, `canvas-viewport.spec.ts` for standalone logic modules).
- `npm run e2e` runs the Playwright suite (`apps/client-e2e`) — required (`verify:all`) for
  changes that touch canvas/inspector/palette interaction, not just unit-testable logic.

## Related docs

- `docs/03-component-model.md`, `docs/15-component-and-page-design.md` — component/page design
  patterns this UI implements.
- `docs/21-builder-creation-assistance.md` — the guided/self-exploration onboarding system in
  `creation-wizard/`.
- `packages/core/CLAUDE.md` — where `ComponentNode`, `ComponentDefinition`, and the registry
  this UI reads from actually live.
