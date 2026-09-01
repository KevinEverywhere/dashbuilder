# One Canvas: Five Runtimes and Purposeful Mixing

Articles 4 through 6 each picked a runtime as the camera angle:
Angular, Vue, and Svelte. The product spans all five.

The builder is Angular. The canvas is one graph. The pieces leave as
React, Angular, Vue, Svelte, or a W3C custom element. Change the
export target; the canvas stays the same. Article 1 said that. This
piece is the mechanism, the five proofs, and the places a host
embeds another stack on purpose.

Overview, Destinations, Maps, and Authoring already have their
articles.

## One IR, five generators

Compose, validate, then **ExportIR**. That document is the only input
the code generators see. Adding a framework reuses the same builder
UI.

The default zip is standalone source. Drop it in, set env, run — no
`@rosettadash/*` install required to ship what you just made. npm is
the second door — import a typed `KpiCard` into an app you already
have:

```bash
npm install @rosettadash/core @rosettadash/vue
# or: @rosettadash/react | 
#     @rosettadash/angular | 
#     @rosettadash/svelte | 
#     @rosettadash/web-components
```

The factory is local. The files are yours.

![One IR, five generators — or the export target picker.](graphics/01-ir.png)

## Five proofs, one library

Destination Atlas exists five times. Same thirty cities. Same screen
names. `libs/destination-atlas`.

| Runtime | Command | Port |
| --------- | --------- | ------ |
| Web Components | `npm run proof:web-components` | 4310 |
| React (UX reference) | `npm run proof:react` | 4311 |
| Angular | `npm run proof:angular` | 4312 |
| Vue | `npm run proof:vue` | 4313 |
| Svelte | `npm run proof:svelte` | 4314 |

Open About. The matrix is Package, Proof app, Storybook. The current
row says “You are here.” Article 4 introduced the matrix; sameness
across runtimes is the story here.

![About runtime matrix — Package, Proof app, Storybook. You are here.](graphics/02-matrix.png)

**Vue is Vue-only.** Native SFCs, same tabs, no foreign mount. The
next section is the exception.

## Mixing on purpose

Teams already do this during a migration: keep an element on the stack that already has it.

The Svelte proof is a shell that hosts four guests. Authoring stays
React: viewports and ffmpeg.wasm were already there
(`ReactMount.svelte` → `createRoot`). The globe stays the Vue
Three.js wrapper. Media’s YouTube embed is Angular. The 2D map is
the custom element, `<rd-geo-map>`, via `svelte:element`.

The Web Components proof does the same for Authoring: Map and Globe
stay `rd-*`; extract mounts the React subtree.

The Svelte proof reuses ahead-of-parity work rather than rewriting
it. Storybook isolated one piece. This is those pieces in one
chrome, including foreign ones. If you screenshot it, keep the
subject on the host and the bridge.

![Purposeful mix — Svelte chrome with a guest mount. Subject is the host and the bridge.](graphics/03-mix.png)

The demos mix on purpose too, at card scale: a React host, a Vue
host, a custom-element tour. Same bet. Smaller frame.

![A demo on a host page — the npm door at card scale.](graphics/04-demo.png)

## Close

Clone the repo. Run the proof you live in, or `npm start` and export
a single KPI into a project you already have. Storybook is still
there if you want a component alone again.

The pieces travel. You keep the source.
