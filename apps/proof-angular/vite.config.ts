import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { ffmpegCoreVitePlugin, wasmIsolationHeaders } from '../../tools/vite/ffmpeg-core-vite-plugin.mjs';
import { parityApiProxy } from '../../tools/vite/parity-api-proxy.ts';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: resolve(__dirname, 'tsconfig.json'),
    }),
    ffmpegCoreVitePlugin(),
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
  ],
  resolve: {
    alias: {
      '@destination-atlas': resolve(__dirname, '../../libs/destination-atlas/src/index.ts'),
      '@rosettadash/angular/visual/media/equirect-sphere-viewport': resolve(
        __dirname,
        '../../packages/angular/src/visual/media/equirect-sphere-viewport/index.ts',
      ),
      '@rosettadash/angular/visual/media/flat-video-viewport': resolve(
        __dirname,
        '../../packages/angular/src/visual/media/flat-video-viewport/index.ts',
      ),
      '@rosettadash/web-components/styles.css': resolve(
        __dirname,
        '../../packages/web-components/src/styles/styles.css',
      ),
    },
  },
  root: __dirname,
  publicDir: 'public',
  cacheDir: resolve(__dirname, '../../node_modules/.vite/proof-angular'),
  build: {
    outDir: '../../dist/apps/proof-angular',
    emptyOutDir: true,
  },
  server: {
    port: 4312,
    strictPort: true,
    host: '0.0.0.0',
    headers: wasmIsolationHeaders(),
    proxy: parityApiProxy(53101),
  },
  preview: {
    port: 4312,
    headers: wasmIsolationHeaders(),
  },
  optimizeDeps: {
    include: ['leaflet', '@googlemaps/js-api-loader', 'three'],
    exclude: ['maplibre-gl', '@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  worker: {
    format: 'es',
  },
});
