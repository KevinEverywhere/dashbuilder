import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { ffmpegCoreVitePlugin, wasmIsolationHeaders } from '../../tools/vite/ffmpeg-core-vite-plugin.mjs';
import { rosettadashAliasEntries } from '../../tools/storybook-shared/vite-final';
import { parityApiProxy } from '../../tools/vite/parity-api-proxy.ts';
import { builderApiProxy } from '../../tools/vite/builder-api-proxy.ts';

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
    vue(),
    react({ include: /\/src\/globe\/.*\.tsx$/ }),
    ffmpegCoreVitePlugin(),
  ],
  resolve: {
    alias: [
      {
        find: '@destination-atlas',
        replacement: resolve(__dirname, '../../libs/destination-atlas/src/index.ts'),
      },
      {
        find: '@rosettadash/react/visual/media/equirect-sphere-viewport',
        replacement: resolve(
          __dirname,
          '../../packages/react/src/visual/media/equirect-sphere-viewport/index.ts',
        ),
      },
      {
        find: '@rosettadash/react/visual/media/flat-video-viewport',
        replacement: resolve(
          __dirname,
          '../../packages/react/src/visual/media/flat-video-viewport/index.ts',
        ),
      },
      {
        find: '@rosettadash/vue/visual/media/equirect-sphere-viewport',
        replacement: resolve(
          __dirname,
          '../../packages/vue/src/visual/media/equirect-sphere-viewport/index.ts',
        ),
      },
      {
        find: '@rosettadash/vue/visual/media/flat-video-viewport',
        replacement: resolve(
          __dirname,
          '../../packages/vue/src/visual/media/flat-video-viewport/index.ts',
        ),
      },
      {
        find: '@rosettadash/web-components/styles.css',
        replacement: resolve(__dirname, '../../packages/web-components/src/styles/styles.css'),
      },
      ...(rosettadashAliasEntries() as Array<{ find: string | RegExp; replacement: string }>),
    ],
  },
  root: __dirname,
  publicDir: 'public',
  cacheDir: resolve(__dirname, '../../node_modules/.vite/proof-vue'),
  build: {
    outDir: '../../dist/apps/proof-vue',
    emptyOutDir: true,
  },
  server: {
    port: 4313,
    strictPort: true,
    host: '0.0.0.0',
    headers: wasmIsolationHeaders(),
    proxy: {
      ...parityApiProxy(53104),
      ...builderApiProxy(),
    },
  },
  preview: {
    port: 4313,
    headers: wasmIsolationHeaders(),
  },
  optimizeDeps: {
    include: ['leaflet', '@googlemaps/js-api-loader', 'three', 'react', 'react-dom'],
    exclude: ['maplibre-gl', '@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  worker: {
    format: 'es',
  },
});
