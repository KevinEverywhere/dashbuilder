import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: resolve(__dirname, 'tsconfig.json'),
    }),
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
  cacheDir: resolve(__dirname, '../../node_modules/.vite/angular-poll-tracker'),
  build: {
    outDir: '../../dist/demos/angular-poll-tracker',
    emptyOutDir: true,
  },
  server: {
    port: 4325,
    host: '0.0.0.0',
  },
  preview: {
    port: 4325,
  },
});
