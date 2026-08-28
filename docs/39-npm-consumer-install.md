# npm consumer install (ffmp3Console & siblings)

**Ticket:** [DAS-99](https://planetkevin.atlassian.net/browse/DAS-99) · consumer wiring [FFMP3CON-3](https://planetkevin.atlassian.net/browse/FFMP3CON-3)  
**Author:** Kevin Ready \<kevin@planetkevin.com\>  
**Agents never commit.**

## Import shape (future registry publish)

Yes — after scoped packages are published, consumers import with **one or more taxonomy group segments**, then the component name:

```ts
import { Accordion } from '@rosettadash/web-components/layout/accordion';
import { VideoSource } from '@rosettadash/web-components/visual/media/video-source';
import { registerRosettaDashMediaElements } from '@rosettadash/web-components/media'; // legacy barrel
```

Same subpaths on every runtime: `@rosettadash/react/layout/accordion`, `@rosettadash/vue/visual/media/video-source`, etc. See [docs/34-public-component-api.md](./34-public-component-api.md).

Until scoped packages are on the registry, use **local pack** (`npm run pack:consumer`) or `file:` / tarball install. Current checkout: `@rosettadash/*@0.1.3` (core, web-components, react, angular, vue, svelte).

## Critical distinction

| Package | What it is | Install for UI? |
|---------|------------|-----------------|
| [`rosettadash`](https://www.npmjs.com/package/rosettadash) (unscoped) | Product / monorepo (same as `git clone`) | **No** — not a component barrel |
| `@rosettadash/web-components` | Default CE runtime | **Yes** |
| `@rosettadash/core` | Shared helpers (`buildEquirectExtractFilter`, …) | **Yes** (dependency of WC; also direct for CLI/filter math) |

Unscoped `rosettadash@0.1.0` on the public registry is the **product workspace**, not `<rd-*>` elements. Consumers must use **scoped** packages.

## Components ffmp3Console needs

| Element | Import | Event |
|---------|--------|-------|
| `<rd-video-source>` | `@rosettadash/web-components/visual/media/video-source` or `/media` | `video-file` |
| `<rd-equirect-viewport>` | `@rosettadash/web-components/visual/media/equirect-viewport` or `/media` | `crop-region` |
| `<rd-wasm-media>` (optional) | `@rosettadash/web-components/wasm` | `extract-complete` |

Register everything:

```ts
import { registerRosettaDashElements } from '@rosettadash/web-components';
registerRosettaDashElements();
```

Or media-only:

```ts
import { registerRosettaDashMediaElements } from '@rosettadash/web-components/media';
registerRosettaDashMediaElements();
```

Filter strings (do not reimplement in ffmp3):

```ts
import { buildEquirectExtractFilter } from '@rosettadash/core';
```

Keep Three.js live sphere (`EquirectSphereViewport`) in ffmp3; bridge pose ↔ `crop-region`. See [31-ffmp3-web-components-integration.md](./31-ffmp3-web-components-integration.md).

## Install paths

### A) Registry (recommended)

```bash
npm install @rosettadash/web-components@0.1.3 @rosettadash/core@0.1.3
```

### B) Local tarballs (dogfood before registry)

From RosettaDash:

```bash
cd /Volumes/Three/apps/dashbuilder/rosettadash
npm run pack:consumer
# writes rosettadash-core-0.1.0.tgz and rosettadash-web-components-0.1.0.tgz in repo root
```

From ffmp3Console:

```bash
cd /Volumes/Three/apps/ffmp3Console
npm install \
  ../dashbuilder/rosettadash/rosettadash-core-0.1.0.tgz \
  ../dashbuilder/rosettadash/rosettadash-web-components-0.1.0.tgz
```

### C) `file:` deps (local monorepo path)

```json
{
  "dependencies": {
    "@rosettadash/core": "file:../dashbuilder/rosettadash/dist/packages/core",
    "@rosettadash/web-components": "file:../dashbuilder/rosettadash/dist/packages/web-components"
  }
}
```

Build first: `nx run-many -t build -p core,web-components`.

### D) `npm link` (hot reload while editing RosettaDash)

```bash
# RosettaDash
cd packages/core && npm link
cd ../web-components && npm link

# ffmp3Console
npm link @rosettadash/core @rosettadash/web-components
```

## Browser / no-bundler apps (ffmp3Console)

ffmp3 serves ES modules from `/public` with an import map. Prefer the **browser media bundle**:

```ts
import { registerRosettaDashMediaElements } from '@rosettadash/web-components/browser/media';
// or the mapped alias:
import { registerRosettaDashMediaElements } from '@rosettadash/web-components/media';
```

Built by `node scripts/bundle-browser-media.mjs` (also run from `npm run pack:consumer`). This inlines `@rosettadash/core` filter helpers so the browser does not need to load CJS core.

Express should static-serve `node_modules/@rosettadash/web-components` under `/vendor/rosettadash-web-components` (avoid `@` in URL paths — some stacks serve SPA fallback instead).

## Pack / dry-run (maintainers)

```bash
npm run pack:core            # dry-run
npm run pack:web-components  # dry-run
npm run pack:runtimes        # dry-run react, angular, vue, svelte
npm run pack:consumer        # real .tgz — core + web-components + all four runtimes @ 0.1.3
npm run publish:npm          # pack then publish all six scoped packages (maintainers)
```

Always pack from **`dist/packages/…`**, not `packages/…` source trees.

## Author metadata

Published packages should list:

```json
"author": "Kevin Ready <kevin@planetkevin.com>"
```

## Related

- [npm package prep](./33-npm-package-prep.md)  
- [npm library build](./37-npm-library-build.md)  
- [FFMP3 integration](./31-ffmp3-web-components-integration.md)  
- DAS-83, DAS-90–94, DAS-93 (full taxonomy **0.1.1** gate), DAS-120 (consumer proof apps)
