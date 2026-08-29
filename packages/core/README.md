# `@rosettadash/core`

Shared types, defaults, and media helpers for RosettaDash runtimes.

**Author:** Kevin Ready \<kevin@planetkevin.com\>

## Install

```bash
npm install @rosettadash/core
```

On npm at **0.1.3**. Sibling apps can also use local pack / `file:` — see [docs/39-npm-consumer-install.md](../../docs/39-npm-consumer-install.md).

## Media filters (ffmp3 / FFmpeg)

```ts
import {
  buildEquirectExtractFilter,
  buildEquirectFlatCropFilter,
  buildEquirectRectilinearFilter,
} from '@rosettadash/core';

const vf = buildEquirectExtractFilter('rectilinear', {
  yaw: 30,
  pitch: -10,
  horizontalFov: 90,
  outputWidth: 1280,
  outputHeight: 720,
});
```

## Building

```bash
nx build core
npm pack ./dist/packages/core --dry-run
```

## Tests

```bash
nx test core
```

## Storybook

Component demos live in the [RosettaDash repo](https://github.com/KevinEverywhere/rosettadash#component-examples-storybook) — five Storybook apps (6006–6010), not in this package.
