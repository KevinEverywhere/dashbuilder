The Builder: The Dashboard Component Factory

[Insert image: every task begins with a single brick]

RosettaDash’s builder is an Angular client using a NestJS API, both local. From the repo root: npm install, then npm start.

Open localhost:4200 for the builder UI; the NestJS API runs on localhost:3000. You need both processes, which launch together. Save, preview, and export talk to the API. This is probably the geekiest article in the series.

GETTING STARTED

You select a front-end framework, which determines future choices of servers, database, and styling suggestions. Certain libraries and applications favor or are only available to specific frameworks, such as Nuxt or MUI. The secondary selections change when you change the base framework.

After you have selected Web Components, React, Angular, Vue, or Svelte, choose the mix of server and database (if any) along with how you will style the components, then press Continue to builder.

If you have a small screen, you will see an alert that you need at least 1024 pixels width. The builder is really suited for large desktop screens — 1280 or more.

THE INTERFACE

Components palette (left) — grouped by category: KPI, table, date range, grid, chart, and many others.

Canvas (center) — place, snap, resize, and multi-select. This is where you position and size elements for export.

Inspector (right) — properties, suggestions, and data sources when something is selected on the canvas.

[Insert image: components palette]
[Insert image: canvas with a binding — date range to table to chart]
[Insert image: inspector]

Preview — mock data comes from the builder API on port 3000, the same preview-content rows the canvas describes. That is not the same as proving your Welcome stack in Docker (see below).

[Insert image: preview — mock data, filter clicked, table moving]

Export — full composite, a single node, or a selection neighborhood. Download source. For a UI-only stack you get templates, styles, and scripts.

[Insert image: export wizard]

NODES THAT NEVER RENDER

This section applies to backend-for-frontend development — connecting data to the front end. You choose database and server targets the same way you chose a framework. The builder generates config, stubs, and env templates when you export. Connection strings stay in env vars, not hard-coded in the zip.

PROVING YOUR WELCOME STACK

The repo ships a parity stack that compiles with real drivers and serves seeded rows from Docker. It pairs with the database and server you chose on Welcome.

Once per machine — generate export output with the builder API up: npm run parity:generate:live

Match your Welcome picks:

React → Next.js, port 53103, compose profile server-next
Angular → NestJS, port 53101, compose profile server-nest
Vue → Nuxt, port 53104, compose profile server-nuxt
Svelte → Express, port 53102, compose profile server-express
Web Components → Express, port 53102, compose profile server-express

Databases: PostgreSQL, MySQL, MongoDB, or Supabase — each has a matching compose profile and check flag.

Example for React + PostgreSQL + Next.js: run parity check for postgres and next, then curl localhost:53103/api/orders for seeded rows.

Storybook and Destination Atlas Stack tabs can fetch that live API when parity is up (articles 3 and 6).

COMPOSITE COMPONENTS

A composite component is a group of components that work as a unit. You can save it, version it, export it as a page or a module. The weather widget demo is that idea at card scale. Destination Atlas is the same idea at app scale.

Next: Storybook — same pieces, isolated, before they are part of a product.
