import angular from '@analogjs/vite-plugin-angular';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve, sep } from 'node:path';
import { ffmpegCoreVitePlugin, wasmIsolationHeaders } from '../../tools/vite/ffmpeg-core-vite-plugin.mjs';
import { rosettadashAliasEntries } from '../../tools/storybook-shared/vite-final';

const sveltePackageRoot = resolve(__dirname, '../../packages/svelte');
const sveltePackage = JSON.parse(
  readFileSync(resolve(sveltePackageRoot, 'package.json'), 'utf8'),
) as {
  exports?: Record<string, string | Record<string, string>>;
};

function svelteRuntimeAliases(): Array<{ find: string; replacement: string }> {
  const entries: Array<{ find: string; replacement: string }> = [];
  for (const [subpath, target] of Object.entries(sveltePackage.exports ?? {})) {
    if (subpath === './package.json' || typeof target === 'string') {
      continue;
    }
    const svelteFile = target.svelte ?? target.import ?? target.default;
    if (!svelteFile || !svelteFile.endsWith('.svelte')) {
      continue;
    }
    entries.push({
      find: `@rosettadash/svelte/${subpath.replace(/^\.\//, '')}`,
      replacement: resolve(sveltePackageRoot, svelteFile),
    });
  }
  entries.sort((a, b) => b.find.length - a.find.length);
  return entries;
}

const nonSvelteRosettaAliases = (rosettadashAliasEntries() as Array<{ find: string | RegExp; replacement: string }>).filter(
  (entry) => !String(entry.find).includes('@rosettadash/svelte'),
);

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
    angular({
      tsconfig: resolve(__dirname, 'tsconfig.angular.json'),
      jit: true,
      disableTypeChecking: true,
      transformFilter: (_code, id) =>
        id.includes(`${sep}packages${sep}angular${sep}`) &&
        (id.includes('youtube-embed') || id.includes(`${sep}lib${sep}custom-element-host`)),
    }),
    svelte(),
    react({ include: /\/src\/(authoring|globe|charts)\/.*\.tsx$/ }),
    ffmpegCoreVitePlugin(),
  ],
  resolve: {
    conditions: ['svelte', 'browser', 'import', 'module', 'default'],
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
        find: '@rosettadash/web-components/styles.css',
        replacement: resolve(__dirname, '../../packages/web-components/src/styles/styles.css'),
      },
      {
        find: '@rosettadash/angular/visual/media/youtube-embed',
        replacement: resolve(
          __dirname,
          '../../packages/angular/src/visual/media/youtube-embed/index.ts',
        ),
      },
      {
        find: '@rosettadash/vue/visual/display/3d-geo-globe',
        replacement: resolve(
          __dirname,
          '../../packages/vue/src/visual/display/3d-geo-globe/index.ts',
        ),
      },
      ...svelteRuntimeAliases(),
      ...nonSvelteRosettaAliases,
    ],
  },
  root: __dirname,
  publicDir: 'public',
  cacheDir: resolve(__dirname, '../../node_modules/.vite/proof-svelte'),
  build: {
    outDir: '../../dist/apps/proof-svelte',
    emptyOutDir: true,
  },
  server: {
    port: 4314,
    strictPort: true,
    host: '0.0.0.0',
    headers: wasmIsolationHeaders(),
  },
  preview: {
    port: 4314,
    headers: wasmIsolationHeaders(),
  },
  optimizeDeps: {
    include: [
      'leaflet',
      '@googlemaps/js-api-loader',
      'three',
      'react',
      'react-dom',
      'vue',
      '@angular/core',
      '@angular/platform-browser',
      '@angular/compiler',
    ],
    exclude: ['maplibre-gl', '@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  worker: {
    format: 'es',
  },
});
