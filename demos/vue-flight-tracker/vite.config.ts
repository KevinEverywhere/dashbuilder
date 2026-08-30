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
  cacheDir: resolve(__dirname, '../../node_modules/.vite/vue-flight-tracker'),
  build: {
    outDir: '../../dist/demos/vue-flight-tracker',
    emptyOutDir: true,
  },
  server: {
    port: 4327,
    host: '0.0.0.0',
    proxy: {
      '/opensky': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/opensky/, ''),
      },
    },
  },
  preview: {
    port: 4327,
  },
  optimizeDeps: {
    include: ['leaflet'],
  },
});
