#!/usr/bin/env node
/**
 * Smoke test: Cursor rule globs match expected package paths.
 * Run: node scripts/verify-cursor-rule-globs.mjs
 */
import { minimatch } from 'minimatch';

const cases = [
  {
    path: 'packages/react/src/visual/chart/bar/BarChart.tsx',
    expect: ['11-component-public-contract', 'react-authoring'],
  },
  {
    path: 'packages/web-components/src/visual/chart/bar/rd-bar-chart.ts',
    expect: ['11-component-public-contract', 'web-components-authoring'],
  },
  {
    path: 'apps/client/src/app/builder/builder-state.service.ts',
    expect: ['builder-app'],
    reject: ['11-component-public-contract', 'react-authoring'],
  },
];

const rules = [
  {
    name: '11-component-public-contract',
    glob: 'packages/{web-components,react,angular,vue,svelte}/**/*',
  },
  { name: 'react-authoring', glob: 'packages/react/**/*' },
  {
    name: 'web-components-authoring',
    glob: 'packages/web-components/**/*',
  },
  { name: 'builder-app', glob: 'apps/client/**/*' },
];

function matchesRule(filePath, glob) {
  return minimatch(filePath, glob, { dot: true });
}

let failed = 0;

for (const { path, expect, reject = [] } of cases) {
  for (const ruleName of expect) {
    const rule = rules.find((r) => r.name === ruleName);
    if (!rule || !matchesRule(path, rule.glob)) {
      console.error(`FAIL: expected ${ruleName} to match ${path}`);
      failed++;
    }
  }
  for (const ruleName of reject) {
    const rule = rules.find((r) => r.name === ruleName);
    if (rule && matchesRule(path, rule.glob)) {
      console.error(`FAIL: expected ${ruleName} NOT to match ${path}`);
      failed++;
    }
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('OK: cursor rule globs match expected paths (%d cases)', cases.length);
