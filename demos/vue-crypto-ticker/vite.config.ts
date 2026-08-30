import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    vue(),
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
  ],
  resolve: {
    alias: {
      '@rosettadash/web-components/styles.css': resolve(
        __dirname,
        '../../packages/web-components/src/styles/styles.css',
      ),
    },
  },
  root: __dirname,
  cacheDir: resolve(__dirname, '../../node_modules/.vite/vue-crypto-ticker'),
  build: {
    outDir: '../../dist/demos/vue-crypto-ticker',
    emptyOutDir: true,
  },
  server: {
    port: 4326,
    host: '0.0.0.0',
  },
  preview: {
    port: 4326,
  },
});
