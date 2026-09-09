Storybook: Making Sense of the Pieces

[Insert image: Storybook should simplify everything]

Storybook simplifies. It lets people know how to work with shared assets. RosettaDash ships with five Storybook catalogs, one for each framework:

Web Components — port 6006
React — port 6007
Vue — port 6008
Angular — port 6009
Svelte — port 6010

The header says RosettaDash · {runtime} catalog.

To open React Storybook: npm run storybook:react, then localhost:6007. You land on Getting Started → Start here.

THE SIDEBAR

Getting Started has three pages: the map of the catalog, a component count, and styling modes.

[Insert image: sidebar — Getting Started, Components, Meta]

Catalog / Components — one story per builder group, plus an all-components scroll, plus the npm layout atoms. The previews use the same visual language as the builder’s preview panel.

[Insert image: one Components page — a data display, isolated]

Catalog / Meta components — dashboard recipes built from multiple components. A preview of what Destination Atlas assembles from all the pieces.

The Meta sidebar has nine dashboard recipes (operations KPI, analytics, admin settings, news, media authoring, WASM lab, VR/3D gallery, data platform, navigation shell), a Component coverage audit, and Full-stack orders (live API) — UI to generated server to seeded PostgreSQL orders.

FULL-STACK ORDERS (LIVE API)

Open Catalog → Meta components → Full-stack orders (live API) in React Storybook (port 6007) or Angular Storybook (port 6009).

One command boots Docker DBs, generates server apps, starts parity containers, and opens Storybook. Have Docker running if you are testing parity code.

npm run parity:stack:storybook:react
or npm run parity:stack:storybook:angular

React Storybook proxies to the Next.js container on port 53103; Angular Storybook to Nest on port 53101.

FULL-STACK NEWS (LIVE API)

The Meta sidebar also has Full-stack news (live API) — news discovery UI to RosettaDash builder GET /api/news to Google News RSS ingest with about a 24-hour cache. Destination-scoped lookup uses the active destination id (default demo: Tokyo).

Open Catalog → Meta components → Full-stack news (live API) in any runtime Storybook.

One command starts the builder API and Storybook:

npm run storybook:react:live
(builder on port 3000/api, Storybook on port 6007 — swap runtime as needed)

A green status line and a headline table mean live RSS is flowing. If the builder is down, Destination Atlas and this story fall back to cached travel headlines with real publisher URLs — not placeholder links.

The static News discovery flow recipe still uses mock rows for layout and Controls. Full-stack news is the end-to-end proof.

[Insert image: one Meta recipe — diagram, preview, XML]

STYLING, BRIEFLY

Getting Started includes Styling modes: minimal, tokens, themed. That is how a consumer decides whether they are taking rd-* CSS tokens, rd-* classes, or fitting the pieces next to Tailwind, CSS Modules, or MUI.

Next: Destination Atlas ties the pieces together in a functioning application for each target framework.
