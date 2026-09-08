#!/usr/bin/env node
/**
 * Master verification — runs the full automated gate in order:
 *
 *   npm run verify:master
 *
 * 1. verify:all   — lint, typecheck, unit tests, Playwright e2e
 * 2. parity:verify — Docker DBs, generate, servers, parity matrix
 * 3. smoke:live-scripts — live-script wiring + manual smoke checklist
 *
 * Prerequisites: Docker (parity), Playwright Chromium (`npm run setup:e2e`).
 * E2E uses :4201 / :3001 so dev servers on :4200 / :3000 can stay up.
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const STEPS = [
  {
    script: 'verify:all',
    label: 'Lint, typecheck, unit tests, and Playwright e2e',
  },
  {
    script: 'parity:verify',
    label: 'Backend parity stack (Docker DBs, generate, servers, matrix)',
  },
  {
    script: 'smoke:live-scripts',
    label: 'Live dev-script wiring + manual smoke checklist',
  },
];

function runStep(index, { script, label }) {
  const banner = `[${index + 1}/${STEPS.length}] npm run ${script}`;
  console.log(`\n${'='.repeat(72)}\n${banner}\n${label}\n${'='.repeat(72)}\n`);
  execSync(`npm run ${script}`, { cwd: workspaceRoot, stdio: 'inherit' });
}

console.log(
  'RosettaDash master verify — verify:all → parity:verify → smoke:live-scripts\n' +
    'Ensure Docker is running and e2e Chromium is installed (npm run setup:e2e).\n',
);

for (const [index, step] of STEPS.entries()) {
  runStep(index, step);
}

console.log(`\n${'='.repeat(72)}`);
console.log('verify:master complete — all automated gates passed.');
console.log(
  'If smoke:live-scripts printed manual commands, run those once locally',
);
console.log('(Ctrl+C each) before merge when you changed :live orchestration.');
console.log(`${'='.repeat(72)}\n`);
