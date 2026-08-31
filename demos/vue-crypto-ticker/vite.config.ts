import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { rosettadashAliasEntries } from '../../tools/storybook-shared/vite-final';

export default defineConfig({
  plugins: [
    vue(),
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
  ],
  resolve: {
    alias: [
      {
        find: '@rosettadash/web-components/styles.css',
        replacement: resolve(
          __dirname,
          '../../packages/web-components/src/styles/styles.css',
        ),
      },
      ...(rosettadashAliasEntries() as Array<{ find: string | RegExp; replacement: string }>),
    ],
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
