import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { ffmpegCoreVitePlugin, wasmIsolationHeaders } from '../../tools/vite/ffmpeg-core-vite-plugin.mjs';
import { parityApiProxy } from '../../tools/vite/parity-api-proxy.ts';

export default defineConfig({
  plugins: [
    react(),
    ffmpegCoreVitePlugin(),
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
  ],
  resolve: {
    alias: {
      '@destination-atlas': resolve(__dirname, '../../libs/destination-atlas/src/index.ts'),
      '@rosettadash/web-components/styles.css': resolve(
        __dirname,
        '../../packages/web-components/src/styles/styles.css',
      ),
    },
  },
  root: __dirname,
  publicDir: 'public',
  cacheDir: resolve(__dirname, '../../node_modules/.vite/proof-react'),
  build: {
    outDir: '../../dist/apps/proof-react',
    emptyOutDir: true,
  },
  server: {
    port: 4311,
    host: '0.0.0.0',
    headers: wasmIsolationHeaders(),
    proxy: parityApiProxy(53103),
    fs: {
      allow: [resolve(__dirname, '../..')],
    },
    watch: {
      ignored: ['**/node_modules/**', '!**/libs/destination-atlas/**'],
    },
  },
  preview: {
    port: 4311,
    headers: wasmIsolationHeaders(),
  },
  optimizeDeps: {
    include: ['leaflet', '@googlemaps/js-api-loader', 'three'],
    exclude: [
      'maplibre-gl',
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util',
      // Source alias — keep authoring-360-sources.json out of the prebundle cache.
      resolve(__dirname, '../../libs/destination-atlas/src/index.ts'),
    ],
  },
  worker: {
    format: 'es',
  },
});
