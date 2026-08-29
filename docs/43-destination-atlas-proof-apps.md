# Destination Atlas — consumer proof apps (DAS-120)

**Epic:** [DAS-120](https://planetkevin.atlassian.net/browse/DAS-120)  
**Research:** [DAS-126](https://planetkevin.atlassian.net/browse/DAS-126)  
**Gap WC components:** [DAS-127](https://planetkevin.atlassian.net/browse/DAS-127) app-language-select · [DAS-128](https://planetkevin.atlassian.net/browse/DAS-128) geo-map · [DAS-129](https://planetkevin.atlassian.net/browse/DAS-129) youtube-embed

Five **identical** Nx apps under `apps/` prove `@rosettadash/*@0.1.3` npm installs outside Storybook. Each app is **Destination Atlas** — current and historic information about world locations. Shared library: **30 cities** (five per inhabited continent) with **10-year** visitor guesstimates (`2015–2024`). Media is YouTube-only; Authoring is upload-your-own (no shipped VR).

## Product intent

Users explore destinations worldwide: statistics and trends, searchable records, maps and globes, embedded video and 360° tours, regional news, and trip planning. The app is a **functional demo**, not a taxonomy kitchen sink.

### Multilingual apps (not multilingual RosettaDash)

RosettaDash component chrome and builder UI stay English-only. Developers build multilingual apps using:

- **`domain.i18n.app-language-select`** — sets the app base locale (BCP-47), emits `locale-change`
- Developer-owned i18n (vue-i18n, ngx-translate, react-intl, etc.) wired to that event

Distinct from **`visual.news.language-select`**, which filters news API language — not app UI locale.

### Provider choice at component level

Geo and media components expose **developer-selectable providers** via props/inspector. RosettaDash documents tradeoffs (cost, API keys, branding):

| Component | Provider prop values | Notes |
|-----------|---------------------|-------|
| `visual.display.geo-map` | `maplibre` · `leaflet` · `google-maps` | See [geo-map providers](#geo-map-providers) |
| `visual.media.youtube-embed` | YouTube embed only | Subject to Google ToS / ads |
| `visual.display.3d-geo-globe` | Three.js host | Texture URL + marker rowset |

## Apps

| Ticket | Path | Runtime |
|--------|------|---------|
| DAS-121 | `apps/proof-web-components` | `@rosettadash/web-components` |
| DAS-122 | `apps/proof-react` | `@rosettadash/react` |
| DAS-123 | `apps/proof-angular` | `@rosettadash/angular` |
| DAS-124 | `apps/proof-vue` | `@rosettadash/vue` |
| DAS-125 | `apps/proof-svelte` | `@rosettadash/svelte` |

Shared mock data and screen definitions: **`libs/destination-atlas/`**.

### WC vs framework parity

The WC npm package now ships **41 generated atoms** plus existing CE hosts (geo-map, media, wasm, i18n) and catalog meta elements. `proof-web-components` uses `<rd-*>` custom elements across Destination Atlas screens except Stack (infra out of scope) and Authoring (React subtree via `createRoot`, DAS-159). Regenerate atoms: `npm run generate:web-components-runtime`.

## Screens

| Screen | Purpose | Key components |
|--------|---------|----------------|
| **About** | Proof onboarding — why Destination Atlas exists, how to run proof + Storybook per runtime | ScrollRegion (designated app scroller) |
| **Overview** | Current stats + trends | KpiCard, LineChart, BarChart, MetricChip, StatusBadge, GridLayout |
| **Destinations** | Browse + filter | DataTable, DetailPanel, TextInput, SelectInput, DateRangeFilter, TimePreset |
| **Map** | 2D exploration | GeoMap (provider prop), LinkList, TabsLayout |
| **Globe** | 3D markers | ThreeGeoGlobe |
| **Media** | Flat YouTube + 360° routing | YoutubeEmbed, VideoMetadataPanel — 360° destinations open Authoring |
| **Authoring** | Upload + WASM extract | FlatVideoViewport or EquirectSphereViewport, AuthoringPlaybackBar, WasmMedia ([DAS-131](https://planetkevin.atlassian.net/browse/DAS-131), [DAS-141](https://planetkevin.atlassian.net/browse/DAS-141)) |
| **Plan** | Trip + access | RoleGate, PersonInvite, RoleAssign, Timer, form inputs |
| **Stack** | Infra demo | infra/* read-only panel; live BYOK key status — [DAS-135](https://planetkevin.atlassian.net/browse/DAS-135) |
| **Settings** | App locale + integrations | AppLanguageSelect; consumer BYOK vault — [DAS-135](https://planetkevin.atlassian.net/browse/DAS-135) |

**Nav (DAS-164):** two screens stay in code and are not in the tab bar (those paths redirect to About). They can return later — one when there is current news content, the other when it is redesigned. AI provider keys live under Settings only.

### About page & scroll policy

The **About** tab is the first screen and the **only** page-level scroller in each proof app. Long-form copy (runtime guides, npm commands, Storybook ports) lives inside **`layout.scroll-region`**. The shell locks `body` overflow; other tabs fit within the viewport without page scroll. When content fits, the scroll region shows no visible scrollbar; overflow uses a thin overlay scrollbar.

Each proof app’s About page lists all five runtimes in a **three-column matrix** — **Package | Proof app | Storybook** — with the **current runtime row highlighted** (“You are here”) so you can see npm install targets, dev-server commands, and Storybook ports at a glance. Shared copy and column labels: `libs/destination-atlas/src/data/about-guides.ts` (`DESTINATION_ATLAS_RUNTIME_GUIDES`, `DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS`, `DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE`).

Implemented in React proof: [DAS-130](https://planetkevin.atlassian.net/browse/DAS-130). Runtime matrix redesign: [DAS-143](https://planetkevin.atlassian.net/browse/DAS-143).

### Authoring tab (upload-first, flat + 360°)

**Authoring** is separate from **Media**. Media is for watching flat YouTube embeds; selecting a 360° destination navigates to Authoring where users **upload** their own source:

- **Source pane** — auto-detects flat vs ~2:1 equirect:
  - **Flat (2D):** `FlatVideoViewport` — draggable crop rectangle, live output mirror
  - **360° equirect:** `EquirectSphereViewport` — interior Three.js sphere, orbit + Shift+drag framing, little-planet blend at wide FOV
- **Playback bar** — play/pause/stop/record; orange segment marks recorded trim range used for extract
- **Output pane** — program preview + ffmpeg.wasm extract (trimmed to record range when set) + download
- **Export controls** — preset sizes, custom W×H, reverse-playback toggle

Default camera framing for Cusco and other destinations comes from `libs/destination-atlas/src/data/authoring-examples.ts` (presets only — **no autoload**).

**Dev setup (proof-react / proof-angular):** from repo root run `npm install` (includes `@ffmpeg/ffmpeg`, `@ffmpeg/util`, and `@ffmpeg/core` as devDependencies). Proof and Storybook Vite configs serve `@ffmpeg/core` from same-origin `/ffmpeg-core/*` (see `tools/vite/ffmpeg-core-vite-plugin.mjs`) and set COOP + `Cross-Origin-Embedder-Policy: credentialless` so ffmpeg.wasm can use SharedArrayBuffer while YouTube embeds still load. `<rd-wasm-media>` accepts `inputFile`, `cropRegion`, `recordRange`, and `reverse` — loads core via `@rosettadash/core` helpers (no unpkg CDN fetch).

Implemented in React + Angular + Vue proof apps: [DAS-131](https://planetkevin.atlassian.net/browse/DAS-131) (tab shell); [DAS-132](https://planetkevin.atlassian.net/browse/DAS-132) (sphere + WASM); [DAS-140](https://planetkevin.atlassian.net/browse/DAS-140) / [DAS-141](https://planetkevin.atlassian.net/browse/DAS-141) (playback bar, flat crop, record trim). Editor/Admin roles only.

**proof-vue (DAS-124 / DAS-157):** Not a Vue → React showcase. Globe uses `@rosettadash/vue` wrapping `<rd-three-geo-globe>`.

### Cross-framework composition showcases

Proof apps are native to their runtime by default. These screens **deliberately embed another runtime** when reusing an ahead-of-parity feature is more practical than rewriting it — a pattern teams use during migration or when mixing npm packages.

| Host | Embedded | Screen | Feature | Bridge | Ticket |
|------|----------|--------|---------|--------|--------|
| Svelte | React | Authoring | Viewports + WasmMedia extract | `ReactMount.svelte` → `createRoot(AuthoringScreen.tsx)` | DAS-158 |
| Svelte | Vue | Globe | Three.js geo globe + markers | `VueMount.svelte` → `@rosettadash/vue` ThreeGeoGlobe | DAS-158 |
| Svelte | Angular | Media | YouTube destination embed | `AngularMount.svelte` → `YoutubeEmbed` on `rd-youtube-embed` | DAS-158 |
| Svelte | Custom element | Map | Geo map + destination selection | `svelte:element` → `<rd-geo-map>` | DAS-158 |
| Web Components | React | Authoring | Viewports + WasmMedia extract | `createRoot` → `authoring/AuthoringScreen.tsx` | DAS-159 |

Shared copy: `libs/destination-atlas/src/data/about-guides.ts` (`DESTINATION_ATLAS_CROSS_FRAMEWORK_SHOWCASES`). Vue proof is Vue-only (DAS-157). **proof-svelte (DAS-158)** shows one React, one Vue, one Angular, and one WC custom element. **proof-web-components (DAS-159)** is the custom-element host: Map/Globe stay native `rd-*`; Authoring mounts React.

**proof-svelte (DAS-125 / DAS-158):** Native Svelte 5 for most screens. Authoring keeps React; Globe hosts Vue; Media hosts Angular; Map hosts `<rd-geo-map>`.

**proof-web-components (DAS-121 / DAS-159):** Native custom elements for most screens, including geo-explorer Map/Globe with destination-list lockstep. Authoring hosts the React subtree.

### Consumer BYOK (integrations)

Builder BYOK shipped in [DAS-70](https://planetkevin.atlassian.net/browse/DAS-70) (`/environment`, `@rosettadash/core/lib/byok`). Destination Atlas proof apps initially used build-time env vars only (`VITE_GOOGLE_MAPS_API_KEY`). [DAS-135](https://planetkevin.atlassian.net/browse/DAS-135) wires a **consumer-facing** key vault into Settings, connects Map/Stack, and feeds API/docs improvements back into shared components.

Branch: `feature/DAS-135-byok-destination-atlas`.

**Implemented (proof-react):**

- `@rosettadash/core/lib/byok` — `CONSUMER_INTEGRATION_FIELDS`, `ConsumerSecretsStore`, `resolveConsumerSecret()`
- Settings → **Integration keys (BYOK)** (Admin): Google Maps, MapTiler, News API; encrypted browser vault
- Map reads BYOK keys (+ `VITE_*` fallback); MapLibre uses MapTiler style URL when configured
- News API key is stored in Settings (live fetch is not on a nav screen today)
- Stack `EnvConfig` shows per-key configured / missing status (`keyStatus` prop on `@rosettadash/react/infra/env`)

**Env templates ([DAS-136](https://planetkevin.atlassian.net/browse/DAS-136)):** repo root `.env.example` (builder, AI BYOK, database, server); `apps/proof-react/.env.example` for `VITE_*` map/news fallbacks. Copy to `.env.local` — or use Settings BYOK vault at runtime.

## Geo-map providers

| Provider | Engine | Typical cost | API key | Tradeoffs |
|----------|--------|--------------|---------|-----------|
| **maplibre** (default) | MapLibre GL JS | OSS free; vector tiles often via MapTiler/similar | Often required for tiles | Modern vector UX; recommended default |
| **leaflet** | Leaflet | OSS free; tile provider varies | Optional (OSM free tier limits apply) | Lightweight; huge plugin ecosystem; raster-first |
| **google-maps** | Google Maps JavaScript API | Paid after free tier | Required | Strong geocoding; Google branding and ToS |

Component props: `provider`, `tile-url`, `api-key`, `center`, `zoom`, `markers`, `selected-id`. Event: `marker-select`.

## Mock data

`libs/destination-atlas/src/data/destinations.ts` — **30 cities** (five per inhabited continent) with:

- `id`, `name`, `region` (continent id), `lat`, `lng`
- `youtubeId` (flat video only — no shipped 360° / VR sources)
- `visitorsCurrent`, `visitorsHistoric[]` (year + guesstimated count, 2015–2024)
- `labels` — optional per-locale display names for developer i18n demos

## Install (consumer)

```bash
npm install @rosettadash/core@0.1.3 @rosettadash/web-components@0.1.3 @rosettadash/react@0.1.3
# … angular, vue, svelte as needed
```

Local dev without registry: `npm run pack:consumer` then `file:` tarballs. See [39-npm-consumer-install.md](./39-npm-consumer-install.md).

## Delivery order

1. **DAS-126** — matrix + WC specs (in progress)
2. **DAS-127–129** — gap WC base components → manifest regen → **0.1.2** publish
3. **DAS-121** — `proof-web-components` shell — **done**
4. **DAS-122** — `proof-react` (full taxonomy UX) — **in progress**
5. **DAS-123–125** — remaining framework apps (identical UX to React)

## References

- [Planned tickets](./11-planned-tickets.md)
- [Public component API](./34-public-component-api.md)
- [npm consumer install](./39-npm-consumer-install.md)
- `tools/runtime-taxonomy/manifest.mjs`
