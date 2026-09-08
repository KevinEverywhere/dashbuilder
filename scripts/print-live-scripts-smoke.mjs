#!/usr/bin/env node
/**
 * Manual smoke checklist for live dev orchestration scripts.
 *
 *   npm run smoke:live-scripts
 *
 * Automated wiring checks run first; then this prints commands for Kevin to
 * run locally (Ctrl+C each when satisfied).
 */

import { assertLiveScripts } from '../tools/backend-parity/check-live-scripts.mjs';

assertLiveScripts();

const checks = [
  {
    command: 'npm run proof:react:live',
    expect: 'Builder :3000/api + React proof :4311 — News tab shows live RSS',
  },
  {
    command: 'npm run storybook:react:live',
    expect:
      'Builder :3000/api + Storybook :6007 — Meta → Full-stack news (live API)',
  },
  {
    command: 'npm run parity:stack:proof:react',
    expect:
      'Docker DBs + generated servers + React proof — Stack tab live orders',
  },
  {
    command: 'npm run parity:stack:storybook:react',
    expect:
      'Docker DBs + generated servers + Storybook — Meta → Full-stack orders',
  },
  {
    command: 'npm run parity:generate:live',
    expect: 'Builder starts, parity:generate runs, builder stops when done',
  },
];

console.log('\nManual smoke — run each command once, then Ctrl+C:\n');
for (const [index, check] of checks.entries()) {
  console.log(`${index + 1}. ${check.command}`);
  console.log(`   Expect: ${check.expect}\n`);
}

console.log(
  'Automated coverage: npm run test:orchestration && npm run parity:check:live-scripts',
);
console.log('Full parity integration (Docker): npm run parity:verify');
console.log('Master gate (all of the above + e2e): npm run verify:master\n');
