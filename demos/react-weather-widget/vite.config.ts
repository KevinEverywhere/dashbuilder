import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    react(),
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
  cacheDir: resolve(__dirname, '../../node_modules/.vite/react-weather-widget'),
  build: {
    outDir: '../../dist/demos/react-weather-widget',
    emptyOutDir: true,
  },
  server: {
    port: 4320,
    host: '0.0.0.0',
  },
  preview: {
    port: 4320,
  },
  optimizeDeps: {
    include: ['leaflet'],
  },
});
