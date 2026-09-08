import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { ffmpegCoreVitePlugin, wasmIsolationHeaders } from '../../tools/vite/ffmpeg-core-vite-plugin.mjs';
import { rosettadashAliasEntries } from '../../tools/storybook-shared/vite-final';
import { builderApiProxy } from '../../tools/vite/builder-api-proxy.ts';
import { parityApiProxy } from '../../tools/vite/parity-api-proxy.ts';

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
    ffmpegCoreVitePlugin(),
  ],
  root: __dirname,
  publicDir: 'public',
  appType: 'spa',
  cacheDir: resolve(__dirname, '../../node_modules/.vite/proof-web-components'),
  build: {
    outDir: '../../dist/apps/proof-web-components',
    emptyOutDir: true,
  },
  server: {
    port: 4310,
    strictPort: true,
    host: '0.0.0.0',
    headers: wasmIsolationHeaders(),
    proxy: {
      ...parityApiProxy(53102),
      ...builderApiProxy(),
    },
  },
  preview: {
    port: 4310,
    headers: wasmIsolationHeaders(),
  },
  resolve: {
    alias: [
      {
        find: '@destination-atlas',
        replacement: resolve(__dirname, '../../libs/destination-atlas/src/index.ts'),
      },
      {
        find: '@rosettadash/web-components/styles.css',
        replacement: resolve(__dirname, '../../packages/web-components/src/styles/styles.css'),
      },
      ...(rosettadashAliasEntries() as Array<{ find: string | RegExp; replacement: string }>),
    ],
  },
  optimizeDeps: {
    include: ['leaflet', '@googlemaps/js-api-loader', 'three'],
    exclude: ['maplibre-gl', '@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  worker: {
    format: 'es',
  },
});
