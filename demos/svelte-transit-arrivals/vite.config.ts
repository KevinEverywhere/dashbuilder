import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
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

export default defineConfig({
  plugins: [
    svelte(),
    tsconfigPaths({
      projects: [resolve(__dirname, '../../tsconfig.base.json')],
    }),
  ],
  resolve: {
    conditions: ['svelte', 'browser', 'import', 'module', 'default'],
    alias: [
      {
        find: '@rosettadash/web-components/styles.css',
        replacement: resolve(__dirname, '../../packages/web-components/src/styles/styles.css'),
      },
      ...svelteRuntimeAliases(),
      ...(rosettadashAliasEntries() as Array<{ find: string | RegExp; replacement: string }>).filter(
        (entry) => !String(entry.find).includes('@rosettadash/svelte'),
      ),
    ],
  },
  root: __dirname,
  cacheDir: resolve(__dirname, '../../node_modules/.vite/svelte-transit-arrivals'),
  build: {
    outDir: '../../dist/demos/svelte-transit-arrivals',
    emptyOutDir: true,
  },
  server: {
    port: 4329,
    host: '0.0.0.0',
  },
  preview: {
    port: 4329,
  },
  optimizeDeps: {
    include: ['leaflet'],
  },
});
