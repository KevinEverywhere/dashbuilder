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
  cacheDir: resolve(__dirname, '../../node_modules/.vite/react-sensor-dashboard'),
  build: {
    outDir: '../../dist/demos/react-sensor-dashboard',
    emptyOutDir: true,
  },
  server: {
    port: 4322,
    host: '0.0.0.0',
  },
  preview: {
    port: 4322,
  },
  optimizeDeps: {
    include: ['leaflet'],
  },
});
