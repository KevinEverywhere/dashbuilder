# Storybook: Making Sense of the Pieces

RosettaDash ships five catalogs. They share one sidebar. The ports are 6006 (Web Components), 6007 (React), 6008 (Vue), 6009 (Angular), 6010 (Svelte). The header says `RosettaDash · {runtime} catalog`.

Example:

```bash
npm run storybook:react
```

Open <http://localhost:6007>. You land on **Getting Started → Start here**.

## The sidebar

**Getting Started** has three pages: the map of the catalog, a component count, and styling modes.

![One sidebar — Getting Started, Components, Meta. Same map on every runtime.](graphics/01-sidebar.png)

**Catalog / Components** is one story per builder group, plus an all-components scroll, plus the npm `rd-*` layout atoms. The previews use the same visual language as the builder’s preview panel.

![One Components page — a table, or a KPI, isolated.](graphics/02-components.png)

**Catalog / Meta components** are made up of multiple components. These ten recipes provide a preview of the Dashboard Atlas, which is created using all of the components.

![One Meta recipe — diagram, preview, XML. A dashboard without Atlas.](graphics/03-meta.png)

## Styling, briefly

Getting Started includes **Styling modes**: minimal, tokens, themed. That is how a consumer decides whether they are taking `--rd-*` tokens, the `.rd-*` classes, or fitting the pieces next to Tailwind, CSS Modules, or MUI. The stack styling guides in the repo go further.

## Next

With Storybook, components have been presented in isolation. Next, Destination Atlas ties the pieces together in a functioning working application in all our target frameworks.
