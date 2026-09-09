One Canvas: Five Runtimes and Purposeful Mixing

The builder in RosettaDash is written in Angular with NestJS handling the API. When you export, the same layout can leave as React, Angular, Vue, Svelte, or W3C custom elements. You choose the target at export time; the canvas does not change. This article shows how that works in the repo: five Destination Atlas proofs, and the Svelte proof that deliberately embeds other frameworks on some screens.

[Insert image: choose a framework and take a spin]

ONE FOUNDATION, FIVE IMPLEMENTATIONS

Compose on the canvas, fix validation errors, then export. Before any framework-specific files are written, the builder turns your graph into one validated description: which components you placed, how they connect, which env vars and server choices apply, and which UI target you picked. Every exporter reads that same description. Adding another framework does not mean rebuilding the builder — it means adding another exporter that understands the same input.

The default download is standalone source. Drop the zip into a project, set environment variables, and run. You do not need to install @rosettadash packages to ship what you just exported. If you prefer npm, install the package for the framework you already use — for example npm install @rosettadash/vue — and import a typed component. Core is installed automatically as a dependency.

Everything runs on your machine. The generated files live in your tree.

[Insert image: export target picker — same canvas, choice of framework]

FIVE PROOFS, ONE LIBRARY

Destination Atlas ships five times — same thirty cities, same screen names, one shared library:

Web Components — npm run proof:web-components — localhost:4310
React (reference UX) — npm run proof:react — localhost:4311
Angular — npm run proof:angular — localhost:4312
Vue — npm run proof:vue — localhost:4313
Svelte — npm run proof:svelte — localhost:4314

Open About in any proof. The matrix lists Package, Proof app, and Storybook; the current row is marked “You are here.”

[Insert image: About runtime matrix]

MIXING ON PURPOSE

The Svelte proof purposefully hosts three framework guests:

Globe — the Vue Three.js wrapper around the geo globe
Media — the Angular YouTube embed component
Map — the rd-geo-map custom element via svelte:element

Authoring is native Svelte — interior sphere viewport, flat video viewport, and WASM media from @rosettadash/svelte.

That is a realistic pattern: reuse what already works, wire it in one app frame, and document the bridge. Storybook showed each piece alone; Destination Atlas shows them together.

[Insert image: Svelte shell with embedded Vue Globe]

The smaller card demos do the same at widget scale — React host page, Vue host page, custom-element 360° tour — each launched with an npm run demo:* script from the repo root.

[Insert image: demo widget on a host page]

CLOSE

Clone the repo. Run the proof for the framework you use day to day, or run npm start and export a single KPI into a project you already have. Storybook is still there when you want one component in isolation.

THE FULL LIST — NPM COMMANDS AND URLS

Run these from the cloned repo root. Each command starts a dev server; open the URL in your browser.

BUILDER AND API

npm start
  Builder UI — http://localhost:4200
  NestJS API — http://localhost:3000/api
  Health check — http://localhost:3000/api/health

npm run start:client
  Builder UI only — http://localhost:4200

npm run start:server
  NestJS API only — http://localhost:3000/api

npm start runs client and server together. Use the split commands when you only need one side.

BACKEND PARITY STACK (OPTIONAL)

Proves exported server code against seeded databases in Docker. Requires Docker.

npm run parity:verify
  Full check — builder, Docker DBs, generate, servers, matrix

npm run parity:stack:proof:react
  Live Stack demo — React proof on http://localhost:4311, generated Next server on http://localhost:53103

npm run parity:stack:proof:angular
  Live Stack demo — Angular proof on http://localhost:4312, generated Nest server on http://localhost:53101

npm run parity:stack:storybook:react
  Storybook full-stack orders — http://localhost:6007, generated Next on http://localhost:53103

npm run parity:stack:storybook:angular
  Storybook full-stack orders — http://localhost:6009, generated Nest on http://localhost:53101

npm run parity:generate:live
  Regenerate parity server apps only (builder API on http://localhost:3000/api)

npm run parity:down
  Stop parity containers (no URL)

Generated parity servers also listen on http://localhost:53102 (Express) and http://localhost:53104 (Nuxt). Same orders seed data in every database.

DESTINATION ATLAS PROOFS

Same product, five runtimes:

npm run proof:web-components — http://localhost:4310
npm run proof:react — http://localhost:4311
npm run proof:angular — http://localhost:4312
npm run proof:vue — http://localhost:4313
npm run proof:svelte — http://localhost:4314

STORYBOOK CATALOGS

One catalog per runtime. All share the same sidebar; Getting Started → Start here is the landing story.

npm run storybook:web-components — http://localhost:6006
npm run storybook:react — http://localhost:6007
npm run storybook:vue — http://localhost:6008
npm run storybook:angular — http://localhost:6009
npm run storybook:svelte — http://localhost:6010
npm run storybook:all — all five URLs above at once (parallel)

CARD DEMOS

Standalone widget demos — eleven card-scale hosts:

npm run demo:weather — React — http://localhost:4320
npm run demo:news — React — http://localhost:4321
npm run demo:sensor — React — http://localhost:4322
npm run demo:stock — Angular — http://localhost:4323
npm run demo:sports — Angular — http://localhost:4324
npm run demo:crypto — Vue — http://localhost:4326
npm run demo:flight — Vue — http://localhost:4327
npm run demo:media — Svelte — http://localhost:4328
npm run demo:transit — Svelte — http://localhost:4329
npm run demo:tour — Web Components — http://localhost:4330
npm run demo:listing — Web Components — http://localhost:4331
