/**
 * Checks the documented server x database matrix against what the exporters
 * will actually generate, by POSTing every combination to the builder's real
 * export endpoints.
 *
 *   npm run parity:check:promises
 *
 * The docs claim every promised server pairs with every promised database
 * (docs/29-stack-server-database-validation.md, docs/01-vision-and-product-overview.md).
 * This script exits non-zero and names each combination where that is untrue,
 * so the gap has to be either fixed in code or corrected in the docs.
 *
 * Requires the builder API to be running: npm run start:server
 */

import {
  DATABASE_PROMISES,
  SERVER_PROMISES,
  buildParityComposite,
  promiseMatrix,
} from './parity-composites.mjs';
import { BUILDER_API_BASE } from './seed-model.mjs';
import { assertBuilderApi } from './assert-builder-api.mjs';

const apiArgIndex = process.argv.indexOf('--api');
const apiBase = apiArgIndex >= 0 ? process.argv[apiArgIndex + 1] : BUILDER_API_BASE;

async function tryGenerate(server, database) {
  const composite = buildParityComposite({ database, server });
  const url = `${apiBase}/export/${SERVER_PROMISES[server].endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(composite),
    });
  } catch (error) {
    return { ok: false, reason: `builder API unreachable at ${url} — ${error.message}` };
  }

  if (!response.ok) {
    const body = await response.text();
    let reason = body.slice(0, 300);
    try {
      const parsed = JSON.parse(body);
      reason = parsed.message ?? reason;
    } catch {
      // keep the raw body
    }
    return { ok: false, reason: `HTTP ${response.status} — ${reason}` };
  }

  const { files } = await response.json();
  const serverFiles = files.filter((file) => file.path.startsWith('server/'));
  if (serverFiles.length === 0) {
    return { ok: false, reason: 'export succeeded but produced no server files' };
  }

  return { ok: true, reason: `${serverFiles.length} server file(s)` };
}

console.log('RosettaDash backend parity — documented server x database matrix\n');
console.log('  Claimed by docs/29-stack-server-database-validation.md and');
console.log('  docs/01-vision-and-product-overview.md: every server pairs with every database.\n');

await assertBuilderApi(apiBase);

const servers = Object.keys(SERVER_PROMISES);
const databases = Object.keys(DATABASE_PROMISES);
const outcomes = new Map();

for (const { server, database } of promiseMatrix()) {
  outcomes.set(`${server}:${database}`, await tryGenerate(server, database));
}

const header = ['server'.padEnd(9), ...databases.map((db) => db.padEnd(12))].join('');
console.log(`  ${header}`);
for (const server of servers) {
  const cells = databases.map((database) => {
    const outcome = outcomes.get(`${server}:${database}`);
    return (outcome.ok ? 'works' : 'BROKEN').padEnd(12);
  });
  console.log(`  ${server.padEnd(9)}${cells.join('')}`);
}

const gaps = [...outcomes.entries()].filter(([, outcome]) => !outcome.ok);

if (gaps.length === 0) {
  console.log(`\nAll ${outcomes.size} documented combination(s) generate a server. Matrix holds.`);
  process.exit(0);
}

console.error(`\n${gaps.length} of ${outcomes.size} documented combination(s) do not hold:\n`);
for (const [key, outcome] of gaps) {
  const [server, database] = key.split(':');
  console.error(
    `  - ${SERVER_PROMISES[server].label} + ${DATABASE_PROMISES[database].label}: ${outcome.reason}`,
  );
}
console.error(
  '\nEach gap is either a missing exporter capability or an overstated claim.\n' +
    'Fix the exporter, or correct the matrix in docs/ and the Storybook\n' +
    'Data Sources copy in tools/storybook-shared/palette-catalog/.',
);
process.exit(1);
