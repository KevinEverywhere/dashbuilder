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
  cacheDir: resolve(__dirname, '../../node_modules/.vite/angular-stock-tracker'),
  build: {
    outDir: '../../dist/demos/angular-stock-tracker',
    emptyOutDir: true,
  },
  server: {
    port: 4323,
    host: '0.0.0.0',
    proxy: {
      '/finance': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/finance/, ''),
      },
    },
  },
  preview: {
    port: 4323,
  },
});
