/**
 * Turns real exporter output into runnable apps under .parity/servers/<target>.
 *
 *   node tools/backend-parity/generate-server-apps.mjs
 *   node tools/backend-parity/generate-server-apps.mjs --api http://127.0.0.1:3000/api
 *
 * The files are fetched from the builder's own export endpoints, so this
 * exercises the production path (controller → ExportService → exporter) rather
 * than calling the generators directly. Only the wrapper — package.json,
 * tsconfig, and the framework's required entry files — is written here; every
 * server and database file comes from the exporter untouched.
 *
 * Requires the builder API to be running: npm run start:server
 */

import { mkdirSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { BUILDER_API_BASE, PARITY_SERVER_CONTAINER_PORT, workspaceRoot } from './seed-model.mjs';
import { assertBuilderApi } from './assert-builder-api.mjs';
import { SERVER_PROMISES, buildParityComposite } from './parity-composites.mjs';

const apiArgIndex = process.argv.indexOf('--api');
const apiBase = apiArgIndex >= 0 ? process.argv[apiArgIndex + 1] : BUILDER_API_BASE;

const outputRoot = join(workspaceRoot, '.parity', 'servers');

/** Left alone — Docker installs deps here; often root-owned on the bind mount. */
const SKIP_ENTRY_NAMES = new Set(['node_modules', '.next', '.output', '.nuxt']);

/**
 * Clear exporter output before rewriting. Keeps container-owned install/cache
 * dirs so parity:generate still works after parity:servers:up.
 */
function resetDirectory(dir) {
  mkdirSync(dir, { recursive: true });
  emptyGeneratedEntries(dir);
}

function emptyGeneratedEntries(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  const rmOptions = { recursive: true, force: true, maxRetries: 5, retryDelay: 200 };

  for (const entry of entries) {
    if (SKIP_ENTRY_NAMES.has(entry.name)) {
      continue;
    }

    const path = join(dir, entry.name);
    try {
      if (entry.isDirectory()) {
        emptyGeneratedEntries(path);
        rmSync(path, rmOptions);
      } else {
        unlinkSync(path);
      }
    } catch (error) {
      if (error?.code === 'EACCES' || error?.code === 'EPERM' || error?.code === 'EBUSY') {
        console.warn(
          `  warn: could not remove ${relative(workspaceRoot, path)} (${error.code}) — skipping`,
        );
        continue;
      }
      throw error;
    }
  }
}

/**
 * Wrapper scaffolding per target. `start` is what the container runs.
 *
 * Each app is generated against the `postgresql` promise because that is the
 * engine the seeded server containers point at. check-promises.mjs covers the
 * full server x database matrix.
 */
const TARGET_SCAFFOLDS = {
  nest: {
    packageJson: {
      name: 'rosettadash-parity-nest',
      private: true,
      scripts: { start: 'tsc -p tsconfig.json && node dist/main.js' },
      dependencies: {
        '@nestjs/common': '^11.0.0',
        '@nestjs/core': '^11.0.0',
        '@nestjs/platform-express': '^11.0.0',
        pg: '^8.16.3',
        'reflect-metadata': '^0.2.0',
        rxjs: '^7.8.0',
      },
      devDependencies: { '@types/node': '^22.0.0', typescript: '~5.9.0' },
    },
    extraFiles: {
      // Nest's dependency injection reads emitted decorator metadata, which
      // esbuild-based runners drop, so the container compiles with tsc.
      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            module: 'commonjs',
            target: 'ES2022',
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            esModuleInterop: true,
            skipLibCheck: true,
            rootDir: 'server/src',
            outDir: 'dist',
          },
          include: ['server/src/**/*.ts'],
        },
        null,
        2,
      ),
    },
  },

  express: {
    packageJson: {
      name: 'rosettadash-parity-express',
      private: true,
      scripts: { start: 'tsc -p tsconfig.json && node dist/index.js' },
      dependencies: { cors: '^2.8.5', express: '^4.21.2', pg: '^8.16.3' },
      devDependencies: {
        '@types/cors': '^2.8.17',
        '@types/express': '^4.17.21',
        '@types/node': '^22.0.0',
        typescript: '~5.9.0',
      },
    },
    extraFiles: {
      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            module: 'commonjs',
            target: 'ES2022',
            esModuleInterop: true,
            skipLibCheck: true,
            rootDir: 'server/src',
            outDir: 'dist',
          },
          include: ['server/src/**/*.ts'],
        },
        null,
        2,
      ),
    },
  },

  next: {
    // The exporter writes to server/src/app/api/..., which is exactly Next's
    // src/app layout when `server` is treated as the project directory.
    // Production build + start (not `next dev`) — dev file-watching breaks on
    // Docker bind mounts, especially on external volumes.
    packageJson: {
      name: 'rosettadash-parity-next',
      private: true,
      scripts: {
        start: `next build server && next start server -H 0.0.0.0 -p ${PARITY_SERVER_CONTAINER_PORT}`,
      },
      dependencies: {
        next: '^15.5.4',
        pg: '^8.16.3',
        react: '^19.2.0',
        'react-dom': '^19.2.0',
      },
      devDependencies: {
        '@types/node': '^22.0.0',
        '@types/react': '^19.2.0',
        typescript: '~5.9.0',
      },
    },
    extraFiles: {
      'server/next.config.js': 'module.exports = {};\n',
      'server/tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            lib: ['dom', 'ES2022'],
            jsx: 'preserve',
            module: 'esnext',
            moduleResolution: 'bundler',
            esModuleInterop: true,
            skipLibCheck: true,
            strict: false,
            noEmit: true,
            plugins: [{ name: 'next' }],
          },
          include: ['src/**/*.ts', 'src/**/*.tsx', 'next-env.d.ts'],
        },
        null,
        2,
      ),
      // Next refuses to boot an app directory without a root layout.
      'server/src/app/layout.tsx':
        'export default function RootLayout({ children }: { children: React.ReactNode }) {\n' +
        '  return (\n' +
        '    <html lang="en">\n' +
        '      <body>{children}</body>\n' +
        '    </html>\n' +
        '  );\n' +
        '}\n',
      'server/src/app/page.tsx':
        'export default function Page() {\n' +
        '  return <main>RosettaDash parity — Next.js server export</main>;\n' +
        '}\n',
    },
  },

  nuxt: {
    // The exporter writes to server/api/*.get.ts and server/utils/*, which is
    // already Nitro's expected layout at the project root.
    // Production build + preview (not `nuxt dev`) — same bind-mount stability
    // reasons as Next above.
    packageJson: {
      name: 'rosettadash-parity-nuxt',
      private: true,
      scripts: {
        start: 'nuxt build && node .output/server/index.mjs',
      },
      dependencies: { nuxt: '^3.14.0', pg: '^8.16.3' },
      devDependencies: { '@types/node': '^22.0.0' },
    },
    extraFiles: {
      '.npmrc': 'legacy-peer-deps=true\n',
      'app.vue': '<template>\n  <main>RosettaDash parity — Nuxt server export</main>\n</template>\n',
      'nuxt.config.ts': 'export default defineNuxtConfig({ devtools: { enabled: false } });\n',
    },
  },
};

async function fetchExport(endpoint, composite) {
  const url = `${apiBase}/export/${endpoint}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(composite),
    });
  } catch (error) {
    throw new Error(
      `Could not reach the builder API at ${url}.\n` +
        `Start it with: npm run start:server\n\nUnderlying error: ${error.message}`,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    if (/^\s*<!DOCTYPE|<html/i.test(body)) {
      throw new Error(
        `${url} responded ${response.status} with HTML — that is not the builder export API.\n` +
          `Run npm run start:server on ${portFromApiBase(apiBase)} (see assert-builder-api preflight).`,
      );
    }
    throw new Error(`${url} responded ${response.status}: ${body.slice(0, 400)}`);
  }

  return response.json();
}

async function generateTarget(target) {
  const scaffold = TARGET_SCAFFOLDS[target];
  const composite = buildParityComposite({ database: 'postgresql', server: target });
  const { files } = await fetchExport(SERVER_PROMISES[target].endpoint, composite);

  const targetRoot = join(outputRoot, target);
  resetDirectory(targetRoot);

  for (const file of files) {
    const destination = join(targetRoot, file.path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, file.content, 'utf-8');
  }

  for (const [path, content] of Object.entries(scaffold.extraFiles ?? {})) {
    const destination = join(targetRoot, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content, 'utf-8');
  }

  writeFileSync(
    join(targetRoot, 'package.json'),
    `${JSON.stringify(scaffold.packageJson, null, 2)}\n`,
    'utf-8',
  );

  return { target, fileCount: files.length, paths: files.map((file) => file.path) };
}

const targets = Object.keys(TARGET_SCAFFOLDS);
const results = [];

function portFromApiBase(base) {
  try {
    return new URL(base).port || '3000';
  } catch {
    return '3000';
  }
}

await assertBuilderApi(apiBase);
console.log(`Builder API OK at ${apiBase}\n`);

for (const target of targets) {
  const result = await generateTarget(target);
  results.push(result);
  console.log(
    `${target.padEnd(8)} ${String(result.fileCount).padStart(2)} exporter file(s) → ` +
      `${relative(workspaceRoot, join(outputRoot, target))}`,
  );
  for (const path of result.paths) {
    console.log(`           ${path}`);
  }
}

console.log(
  `\nGenerated ${results.length} server app(s). Bring them up with:\n` +
    '  npm run parity:servers:up',
);
