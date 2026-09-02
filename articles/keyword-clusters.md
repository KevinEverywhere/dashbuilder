# Article keyword clusters

Search-intent map for the RosettaDash article series. Each article
owns one **primary cluster** so posts do not compete with each other.
Use primary language in the title, first paragraph, and one H2.
Secondary terms can appear naturally in body copy, captions, and
closing lines.

**Rules**

- Prefer **problem + framework** phrases over product jargon (no IR,
  ExportIR, composite, foreign mount).
- Spell out abbreviations on first use (KPI, BYOK).
- **Cursor** is not a cluster term unless Kevin writes an explicit
  integration piece.
- Branded terms (`RosettaDash`, `Destination Atlas`) support
  recognition; do not rely on them for discovery.

---

## Series hub — 00 introduction (Kevin)

**Primary cluster:** cross-framework dashboard components

| Role | Terms |
|------|--------|
| Primary | cross-framework dashboard components |
| Secondary | single source of truth, component factory, React Vue Angular Svelte, web components, export source code, local development, npm |
| Long-tail | build dashboard components for any framework; one component model multiple frameworks; alternative to framework lock-in |
| Placement | Title + opening paragraph name the problem (one framework at a time) and the four entry points (builder, Storybook, Destination Atlas, npm) |

---

## 01 — Components that Travel

**Primary cluster:** cross-framework components

| Role | Terms |
|------|--------|
| Primary | cross-framework components |
| Secondary | components that travel, React, Angular, Vue, Svelte, W3C custom elements, web components, standalone export, npm packages, page-embed widgets, dashboard |
| Long-tail | export same component to React and Vue; import dashboard component into existing app; multi-framework component library |
| Placement | H1 already strong. Lede: AI + framework lock-in. H2 “What travel means”: five export targets + server/database partners. Close: builder → Storybook → Atlas path |

**Caption hooks:** one contract five frameworks; demo widget on host page

---

## 02 — The Builder

**Primary cluster:** dashboard component builder

| Role | Terms |
|------|--------|
| Primary | dashboard component builder |
| Secondary | visual builder, canvas, palette, inspector, preview, export wizard, composite component, AI assist, NestJS, Angular builder, local API, no cloud required |
| Long-tail | drag and drop dashboard builder export code; export React dashboard from builder; save component to library |
| Placement | Title/subtitle: “dashboard component factory.” Getting Started: Web Components React Angular Vue Svelte picker. Export section: full composite vs single node vs selection neighborhood |

**Caption hooks:** stack picker; canvas binding; export wizard

---

## 03 — Storybook

**Primary cluster:** Storybook component catalog

| Role | Terms |
|------|--------|
| Primary | Storybook component catalog |
| Secondary | Storybook React, Storybook Vue, Storybook Angular, Storybook Svelte, web components catalog, component stories, meta components, recipes, styling modes, design tokens, `--rd-*` tokens |
| Long-tail | Storybook five frameworks one sidebar; isolated component preview React Vue; dashboard components in Storybook |
| Placement | Open with five catalogs / ports 6006–6010. Styling section: minimal tokens themed + Tailwind CSS Modules MUI |

**Caption hooks:** same sidebar every runtime; KPI isolated; meta recipe dashboard

---

## 04 — Destination Atlas

**Primary cluster:** dashboard demo app

| Role | Terms |
|------|--------|
| Primary | dashboard demo app |
| Secondary | Destination Atlas, proof app, functional demo, workbench, component source panel, KPI dashboard, data table, filter to detail, runtime matrix, Storybook port, thirty cities |
| Long-tail | full dashboard example React Angular Vue; component library demo application; see component source code in demo app |
| Placement | Contrast with Storybook (isolation vs product). Workbench H2: preview + component source. Three screens: About, Overview KPIs, Destinations table |

**Caption hooks:** runtime matrix you are here; filter table detail

---

## 05 — Maps, Globes, Media, and WASM

**Primary cluster:** dashboard maps and media components

| Role | Terms |
|------|--------|
| Primary | dashboard maps and media components |
| Secondary | Leaflet, MapLibre, Google Maps, geo map component, Three.js globe, 360 video, ffmpeg.wasm, browser video extract, YouTube embed, Vue proof, provider choice |
| Long-tail | react leaflet vs maplibre dashboard; three.js globe markers; ffmpeg wasm browser trim video; 360 equirectangular crop |
| Placement | Part A: 2D provider tradeoffs + lockstep destination list. Part B: watch vs extract split. ffmpeg same-origin COOP COEP in one sentence |

**Caption hooks:** 2D map markers; globe pin selected; authoring crop sphere

**Differentiator cluster** (unique vs generic dashboard posts): ffmpeg.wasm + 360° Authoring

---

## 06 — Settings, BYOK, Roles, i18n, Stack

**Primary cluster:** dashboard BYOK and roles

| Role | Terms |
|------|--------|
| Primary | dashboard BYOK and roles |
| Secondary | bring your own key, API keys browser vault, Google Maps API key, MapTiler, i18n locale, multilingual dashboard, role gate viewer editor admin, invisible infrastructure, Stack tab, Nest Express Next Nuxt |
| Long-tail | store API keys encrypted in browser dashboard; BYOK Google Maps React app; dashboard role based access editor admin |
| Placement | Title already lists BYOK Roles i18n Stack. Settings: keys stay in browser. Plan: role gate. Stack: what export emits |

**Caption hooks:** BYOK collapsibles; trip editor vs hidden gate; infra grid

---

## 07 — One Canvas, Five Runtimes

**Primary cluster:** export to multiple frameworks

| Role | Terms |
|------|--------|
| Primary | export to multiple frameworks |
| Secondary | one canvas five runtimes, React Angular Vue Svelte web components, five proof apps, one foundation five implementations, standalone zip, npm install rosettadash, purposeful mixing, migration embed React in Svelte |
| Long-tail | same dashboard export React or Vue; web components proof native custom elements; embed React component in Svelte app |
| Placement | H2 “One foundation, five implementations” (not IR). Proof table with ports. Mixing section: Svelte-only, Vue-only, CE-only |

**Caption hooks:** export target picker; runtime matrix; Svelte shell embedded React

---

## Cross-article matrix (quick reference)

| Article | Primary cluster | Main frameworks to name |
|---------|-----------------|---------------------------|
| 00 | cross-framework dashboard components | all five + npm |
| 01 | cross-framework components | all five + custom elements |
| 02 | dashboard component builder | picker lists all five |
| 03 | Storybook component catalog | all five catalogs |
| 04 | dashboard demo app | Angular proof (+ matrix all five) |
| 05 | dashboard maps and media | Vue proof (+ map providers) |
| 06 | dashboard BYOK and roles | Svelte proof |
| 07 | export to multiple frameworks | all five proofs |

---

## Shared vocabulary (use anywhere, don’t overuse)

**High-value discovery:** cross-framework, export source code,
standalone zip, web components, custom elements, Storybook, KPI,
dashboard demo, npm, local / no cloud

**Enterprise:** BYOK, API keys, role gate, i18n, locale

**Geo/media:** Leaflet, MapLibre, Google Maps, Three.js globe,
ffmpeg.wasm, 360°, watch vs extract

**AI (secondary only):** AI assist, AI helps author code — pair with
builder or BYOK, never lead with “AI” alone

**Low discovery value:** RosettaDash (until branded), Destination
Atlas (demo name), purposeful mixing, composite, IR, atoms, chrome

---

## Optional title tweaks (SEO-friendly, still human)

Only if Kevin wants tighter search alignment without sounding like SEO
spam:

| Article | Current | Optional SEO-aligned H1 |
|---------|---------|-------------------------|
| 01 | RosettaDash: Components that Travel | Cross-Framework Dashboard Components That Travel |
| 02 | The Builder: The Dashboard Component Factory | Dashboard Component Builder: Canvas, Preview, Export |
| 03 | Storybook: Making Sense of the Pieces | Storybook Component Catalog for Five Runtimes |
| 04 | Destination Atlas: Components in a Product | Destination Atlas: A Full Dashboard Demo App |
| 05 | Maps, Globes, Media, and WASM | Dashboard Maps, Globes, and Browser Video Extract |
| 06 | Settings including BYOK… | Dashboard BYOK, Roles, Locale, and Stack |
| 07 | One Canvas: Five Runtimes… | Export to React, Vue, Angular, Svelte, or Web Components |

Keep subtitles or first sentences human if the H1 gets longer.
