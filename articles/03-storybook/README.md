# Storybook: Making Sense of the Pieces

![Storybook should simplify everything.](graphics/storybook-intro.png)

Storybook simplifies. It lets people know how to work with shared assets. RosettaDash ships with five Storybook catalogs, one for each framework. The ports are 6006 (Web Components), 6007 (React), 6008 (Vue), 6009 (Angular), 6010 (Svelte). The header says `RosettaDash · {runtime} catalog`.

Example:

```bash
npm run storybook:react
```

Open <http://localhost:6007>. You land on **Getting Started → Start here**.

## The sidebar

**Getting Started** has three pages: the map of the catalog, a component count, and styling modes.

![One sidebar — Getting Started, Components, Meta. Same map on every runtime.](graphics/01-sidebar.png)

**Catalog / Components** is one story per builder group, plus an all-components scroll, plus the npm `rd-*` layout atoms. The previews use the same visual language as the builder’s preview panel.

![One Components page — a data display, isolated.](graphics/02-components.png)

**Catalog / Meta components** are made up of multiple components. These dashboard recipes provide a preview of the Dashboard Atlas, which is created using all of the components.

The Meta sidebar has **nine dashboard recipes** (operations KPI, analytics,
admin settings, news, media authoring, WASM lab, VR/3D gallery, data platform,
navigation shell), a **Component coverage audit**, and **Full-stack orders
(live API)** — UI → generated server → seeded PostgreSQL `orders`.

Open **Catalog → Meta components → Full-stack orders (live API)** in React
Storybook (`npm run storybook:react`, port 6007) or Angular Storybook
(port 6009). Requires the parity stack (`parity:db:up`, `start:server`,
`parity:generate`, `parity:servers:up`). React Storybook proxies to the
Next.js container (:53103); Angular Storybook to Nest (:53101).

<!-- DAS -188 SUGGESTED: Meta catalog count + live API story
The Meta sidebar has **nine dashboard recipes** (operations KPI, analytics,
admin settings, news, media authoring, WASM lab, VR/3D gallery, data platform,
navigation shell), a **Component coverage audit**, and **Full-stack orders
(live API)** — UI → generated server → seeded PostgreSQL `orders`.

Open **Catalog → Meta components → Full-stack orders (live API)** in React
Storybook (`npm run storybook:react`, port 6007) or Angular Storybook
(port 6009). Requires the parity stack (`parity:db:up`, `start:server`,
`parity:generate`, `parity:servers:up`). React Storybook proxies to the
Next.js container (:53103); Angular Storybook to Nest (:53101).

Suggested revision for the sentence above: replace "These ten recipes" with
"These dashboard recipes" and add a sentence pointing at the live API story.
-->

![One Meta recipe — diagram, preview, XML.](graphics/03-meta.png)

## Styling, briefly

Getting Started includes **Styling modes**: minimal, tokens, themed. That is how a consumer decides whether they are taking `--rd-*` tokens, the `.rd-*` classes, or fitting the pieces next to Tailwind, CSS Modules, or MUI. The stack styling guides in the repo go further.

## Next

Destination Atlas ties the pieces together in a functioning working application for each target frameworks.
