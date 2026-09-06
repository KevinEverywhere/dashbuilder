/**
 * Typechecks the generated database modules for every promised engine.
 *
 *   npm run parity:check:typecheck
 *
 * The server exporters emit an engine-specific data-access module behind a
 * uniform contract (core's server-database-adapter). Generating without an
 * error only proves the exporter ran; this compiles the emitted TypeScript
 * against the real driver typings so a broken template cannot pass unnoticed.
 *
 * Only engines whose driver is installed at the repo root are checked.
 *
 * Requires the builder API to be running: npm run start:server
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { BUILDER_API_BASE, workspaceRoot } from './seed-model.mjs';
import { assertBuilderApi } from './assert-builder-api.mjs';
import { DATABASE_PROMISES, buildParityComposite } from './parity-composites.mjs';

const apiArgIndex = process.argv.indexOf('--api');
const apiBase = apiArgIndex >= 0 ? process.argv[apiArgIndex + 1] : BUILDER_API_BASE;

const outputRoot = join(workspaceRoot, '.parity', 'typecheck');

/** Engines whose driver typings exist at the repo root. */
const CHECKABLE = new Set(['postgresql', 'mysql', 'mongodb', 'supabase']);

function requireDriver(engine) {
  return CHECKABLE.has(engine);
}

async function fetchFiles(database, scoped) {
  const composite = buildParityComposite({ database, server: 'express', scoped });
  const url = `${apiBase}/export/express`;

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
    throw new Error(`${url} responded ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  return (await response.json()).files;
}

await assertBuilderApi(apiBase);

rmSync(outputRoot, { recursive: true, force: true });

const results = [];

for (const database of Object.keys(DATABASE_PROMISES)) {
  for (const scoped of [false, true]) {
    const label = `${DATABASE_PROMISES[database].label}${scoped ? ' (scoped)' : ''}`;

    if (!requireDriver(database)) {
      results.push({ label, status: 'skipped', detail: 'driver not installed at repo root' });
      continue;
    }

    const files = await fetchFiles(database, scoped);
    // The data-access module and the scope module it imports are the only
    // files that do not need a framework package installed to compile.
    const subject = files.filter(
      (file) => file.path.includes('/database/') || file.path.includes('/domain/'),
    );

    if (subject.length === 0) {
      results.push({ label, status: 'FAIL', detail: 'exporter emitted no database module' });
      continue;
    }

    if (scoped && !subject.some((file) => file.path.includes('/domain/'))) {
      results.push({
        label,
        status: 'FAIL',
        detail: 'a scoped composite emitted no domain scope module',
      });
      continue;
    }

    const targetRoot = join(outputRoot, `${database}${scoped ? '-scoped' : ''}`);
    for (const file of subject) {
      const destination = join(targetRoot, file.path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, file.content, 'utf-8');
    }

    writeFileSync(
      join(targetRoot, 'tsconfig.json'),
      `${JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'nodenext',
            moduleResolution: 'nodenext',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            noEmit: true,
            types: ['node'],
            // The output lives under .parity/, so normal node resolution walks
            // up to the workspace root install to find the drivers.
          },
          include: ['**/*.ts'],
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );

    try {
      execFileSync(
        join(workspaceRoot, 'node_modules', '.bin', 'tsc'),
        ['-p', join(targetRoot, 'tsconfig.json')],
        { stdio: 'pipe', cwd: workspaceRoot },
      );
      results.push({
        label,
        status: 'PASS',
        detail: `${subject.length} generated file(s) compiled`,
      });
    } catch (error) {
      const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
      results.push({ label, status: 'FAIL', detail: output.slice(0, 900) });
    }
  }
}

console.log('RosettaDash backend parity — generated code compiles\n');

for (const result of results) {
  console.log(`  [${result.status.padEnd(7)}] ${result.label.padEnd(11)} ${result.detail.split('\n')[0]}`);
  if (result.status === 'FAIL') {
    for (const line of result.detail.split('\n').slice(1)) {
      console.log(`              ${line}`);
    }
  }
}

const failures = results.filter((result) => result.status === 'FAIL');
if (failures.length > 0) {
  console.error(
    `\n${failures.length} engine(s) emitted code that does not compile. ` +
      'Fix packages/core/src/lib/export/server-database-adapter.ts.',
  );
  process.exit(1);
}

console.log(
  `\n${results.filter((r) => r.status === 'PASS').length} engine(s) compiled, ` +
    `${results.filter((r) => r.status === 'skipped').length} skipped.`,
);
