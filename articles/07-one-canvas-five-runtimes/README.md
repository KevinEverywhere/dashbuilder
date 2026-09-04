# One Canvas: Five Runtimes and Purposeful Mixing

The builder in RosettaDash is written in Angular with NestJS handling the API work. When you export, the same layout can leave as React, Angular, Vue, Svelte, or W3C custom elements. You choose the target at export time; the canvas
does not change. Article 1 introduced that idea. This article shows how it works in the repo: the five Destination Atlas proofs, and the one proof that deliberately embeds another framework in some of its screens.

## One foundation, five implementations

Compose on the canvas, fix validation errors, then export. Before
any framework-specific files are written, the builder turns your
graph into one validated description: which components you placed,
how they connect, which env vars and server choices apply, and
which UI target you picked. Every exporter reads that same
description. Adding another framework does not mean rebuilding the
builder — it means adding another exporter that understands the
same input.

The default download is standalone source. Drop the zip into a
project, set environment variables, and run. You do not need to
install `@rosettadash/*` to ship what you just exported. If you
prefer npm instead, install the packages for the framework you
already use and import a typed component — for example a key
performance indicator (KPI) card:

```bash
npm install @rosettadash/core @rosettadash/vue
# or: @rosettadash/react |
#     @rosettadash/angular |
#     @rosettadash/svelte |
#     @rosettadash/web-components
```

Everything runs on your machine. The generated files live in your
tree.

![Export target picker — same canvas, choice of framework at export time.](graphics/01-ir.png)

## Five proofs, one library

Destination Atlas ships five times — same thirty cities, same screen names, one shared library at `libs/destination-atlas`.

| Runtime | Command | Port |
| --------- | --------- | ------ |
| Web Components | `npm run proof:web-components` | 4310 |
| React (reference UX) | `npm run proof:react` | 4311 |
| Angular | `npm run proof:angular` | 4312 |
| Vue | `npm run proof:vue` | 4313 |
| Svelte | `npm run proof:svelte` | 4314 |

Open **About** in any proof. The matrix lists Package, Proof app, and Storybook; the current row is marked “You are here.” Article 4 introduced the matrix. Here the point is sameness: switch runtimes and the product should feel like the same app.

![About runtime matrix — Package, Proof app, Storybook. You are here.](graphics/02-matrix.png)

**Vue** is Vue throughout — native single-file components, same tabs,
no embedded React or Angular on its screens.

**Web Components** stays on custom elements throughout — Map, Globe,
Media, and Authoring use `rd-*` tags, not a nested React or Vue
tree.

## Mixing on purpose

As a simple POC, the **Svelte** proof purposefully hosts three framework guests:

- **Globe** — the Vue Three.js wrapper around the geo globe.
- **Media** — the Angular YouTube embed component.
- **Map** — the `<rd-geo-map>` custom element via `svelte:element`.

Authoring is native Svelte — EquirectSphereViewport, FlatVideoViewport, and WasmMedia from `@rosettadash/svelte` (DAS-179).

That is a realistic pattern: reuse what already works, wire it in one app frame, and document the bridge. Storybook showed each piece alone; Destination Atlas shows them together.

![Purposeful mix — Svelte shell with an embedded Vue Globe screen.](graphics/03-mix.png)

The smaller demos under `demos/` do the same at card scale: a React host page, a Vue host page, a custom-element 360° tour.

![A demo widget on a host page — npm import at card scale.](graphics/04-demo.png)

## Close

Clone the repo. Run the proof for the framework you use day to day, or run `npm start` and export a single KPI into a project you already have. Storybook is still there when you want one component in isolation.

## The Full List of npm commands for launching apps

Run these from the repo root (`rosettadash/`). Each command starts a dev
server; open the URL in your browser.

### Builder and API

| Command | URL |
| --------- | ------ |
| `npm start` | Builder UI — <http://localhost:4200> |
| | NestJS API — <http://localhost:3000/api> |
| | Health check — <http://localhost:3000/api/health> |
| `npm run start:client` | Builder UI only — <http://localhost:4200> |
| `npm run start:server` | NestJS API only — <http://localhost:3000/api> |

`npm start` runs client and server together. Use the split commands when
you only need one side.

### Destination Atlas proofs

Same product, five runtimes (ports 4310–4314):

| Command | URL |
| --------- | ------ |
| `npm run proof:web-components` | <http://localhost:4310> |
| `npm run proof:react` | <http://localhost:4311> |
| `npm run proof:angular` | <http://localhost:4312> |
| `npm run proof:vue` | <http://localhost:4313> |
| `npm run proof:svelte` | <http://localhost:4314> |

### Storybook catalogs

One catalog per runtime (ports 6006–6010). All share the same sidebar;
**Getting Started → Start here** is the landing story.

| Command | URL |
| --------- | ------ |
| `npm run storybook:web-components` | <http://localhost:6006> |
| `npm run storybook:react` | <http://localhost:6007> |
| `npm run storybook:vue` | <http://localhost:6008> |
| `npm run storybook:angular` | <http://localhost:6009> |
| `npm run storybook:svelte` | <http://localhost:6010> |
| `npm run storybook:all` | All five URLs above (parallel) |

### Card demos

Standalone widget hosts under `demos/` (ports 4320–4331):

| Command | Runtime | URL |
| --------- | --------- | ------ |
| `npm run demo:weather` | React | <http://localhost:4320> |
| `npm run demo:news` | React | <http://localhost:4321> |
| `npm run demo:sensor` | React | <http://localhost:4322> |
| `npm run demo:stock` | Angular | <http://localhost:4323> |
| `npm run demo:sports` | Angular | <http://localhost:4324> |
| `npm run demo:crypto` | Vue | <http://localhost:4326> |
| `npm run demo:flight` | Vue | <http://localhost:4327> |
| `npm run demo:media` | Svelte | <http://localhost:4328> |
| `npm run demo:transit` | Svelte | <http://localhost:4329> |
| `npm run demo:tour` | Web Components | <http://localhost:4330> |
| `npm run demo:listing` | Web Components | <http://localhost:4331> |
