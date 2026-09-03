import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
  ],
  resolve: {
    alias: {
      '@rosettadash/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@rosettadash/web-components/styles.css': resolve(
        __dirname,
        '../../packages/web-components/src/styles/styles.css',
      ),
    },
  },
  root: __dirname,
  publicDir: resolve(__dirname, 'public'),
  cacheDir: resolve(__dirname, '../../node_modules/.vite/ce-360-tour-player'),
  build: {
    outDir: '../../dist/demos/ce-360-tour-player',
    emptyOutDir: true,
  },
  server: {
    port: 4330,
    host: '0.0.0.0',
  },
  preview: {
    port: 4330,
  },
  optimizeDeps: {
    include: ['leaflet', 'three'],
  },
});
