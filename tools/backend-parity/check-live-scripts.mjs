#!/usr/bin/env node
/**
 * Assert live dev orchestration scripts in package.json are wired correctly.
 *
 *   npm run parity:check:live-scripts
 *
 * Runs in `npm run verify` (no Docker). Also invoked at the start of
 * `npm run parity:verify`.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

const RUN_WITH_SERVER = 'scripts/run-with-server.mjs';
const PARITY_STACK_LIVE = 'scripts/parity-stack-live.mjs';
const PARITY_GENERATE_LIVE = 'scripts/parity-generate-live.mjs';
const BUILDER_PROCESS = 'tools/backend-parity/builder-process.mjs';

const EXPECTED_LIVE_PROOF = [
  'proof-web-components',
  'proof-react',
  'proof-angular',
  'proof-vue',
  'proof-svelte',
];

const EXPECTED_LIVE_STORYBOOK = [
  'storybook-web-components',
  'storybook-react',
  'storybook-vue',
  'storybook-angular',
  'storybook-svelte',
];

const EXPECTED_PARITY_STACK = [
  { script: 'parity:stack:proof:react', project: 'proof-react', target: 'serve' },
  { script: 'parity:stack:proof:angular', project: 'proof-angular', target: 'serve' },
  {
    script: 'parity:stack:storybook:react',
    project: 'storybook-react',
    target: 'storybook',
  },
  {
    script: 'parity:stack:storybook:angular',
    project: 'storybook-angular',
    target: 'storybook',
  },
];

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(workspaceRoot, relativePath), 'utf8'));
}

function collectNxProjects(dir, projects = new Set()) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') {
        continue;
      }
      collectNxProjects(fullPath, projects);
      continue;
    }
    if (entry === 'project.json') {
      const project = JSON.parse(readFileSync(fullPath, 'utf8'));
      if (project.name) {
        projects.add(project.name);
      }
    }
  }
  return projects;
}

function assertFile(relativePath, failures) {
  const fullPath = join(workspaceRoot, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`missing file: ${relativePath}`);
  }
}

function assertScriptContains(scriptName, command, fragment, failures) {
  if (!command.includes(fragment)) {
    failures.push(`${scriptName} must reference ${fragment} (got: ${command})`);
  }
}

function assertRunWithServerScript(scriptName, command, project, target, failures) {
  assertScriptContains(scriptName, command, RUN_WITH_SERVER, failures);
  assertScriptContains(scriptName, command, project, failures);
  if (target === 'storybook') {
    assertScriptContains(scriptName, command, '--target storybook', failures);
  } else if (command.includes('--target')) {
    failures.push(`${scriptName} should not pass --target for proof apps`);
  }
}

function assertParityStackScript(scriptName, command, project, target, failures) {
  assertScriptContains(scriptName, command, 'parity:db:up', failures);
  assertScriptContains(scriptName, command, PARITY_STACK_LIVE, failures);
  assertScriptContains(scriptName, command, project, failures);
  if (target === 'storybook') {
    assertScriptContains(scriptName, command, '--target storybook', failures);
  }
}

/** @returns {string[]} */
export function collectLiveScriptFailures() {
  const failures = [];
  const packageJson = readJson('package.json');
  const scripts = packageJson.scripts ?? {};
  const nxProjects = collectNxProjects(workspaceRoot);

  for (const relativePath of [
    RUN_WITH_SERVER,
    PARITY_STACK_LIVE,
    PARITY_GENERATE_LIVE,
    BUILDER_PROCESS,
    'scripts/orchestration-args.mjs',
  ]) {
    assertFile(relativePath, failures);
  }

  for (const project of EXPECTED_LIVE_PROOF) {
    const scriptName = `proof:${project.replace('proof-', '')}:live`;
    const command = scripts[scriptName];
    if (!command) {
      failures.push(`missing package.json script: ${scriptName}`);
      continue;
    }
    assertRunWithServerScript(scriptName, command, project, 'serve', failures);
    if (!nxProjects.has(project)) {
      failures.push(`unknown Nx project for ${scriptName}: ${project}`);
    }
  }

  for (const project of EXPECTED_LIVE_STORYBOOK) {
    const runtime = project.replace('storybook-', '');
    const scriptName = `storybook:${runtime}:live`;
    const command = scripts[scriptName];
    if (!command) {
      failures.push(`missing package.json script: ${scriptName}`);
      continue;
    }
    assertRunWithServerScript(scriptName, command, project, 'storybook', failures);
    if (!nxProjects.has(project)) {
      failures.push(`unknown Nx project for ${scriptName}: ${project}`);
    }
  }

  const generateLive = scripts['parity:generate:live'];
  if (!generateLive) {
    failures.push('missing package.json script: parity:generate:live');
  } else {
    assertScriptContains(
      'parity:generate:live',
      generateLive,
      PARITY_GENERATE_LIVE,
      failures,
    );
  }

  for (const entry of EXPECTED_PARITY_STACK) {
    const command = scripts[entry.script];
    if (!command) {
      failures.push(`missing package.json script: ${entry.script}`);
      continue;
    }
    assertParityStackScript(
      entry.script,
      command,
      entry.project,
      entry.target,
      failures,
    );
    if (!nxProjects.has(entry.project)) {
      failures.push(`unknown Nx project for ${entry.script}: ${entry.project}`);
    }
  }

  if (!nxProjects.has('server')) {
    failures.push('missing Nx project: server (builder API)');
  }

  return failures;
}

export function assertLiveScripts() {
  const failures = collectLiveScriptFailures();
  if (failures.length === 0) {
    return;
  }

  const message =
    `${failures.length} live-script wiring problem(s):\n` +
    failures.map((failure) => `  - ${failure}`).join('\n');
  throw new Error(message);
}

function main() {
  const failures = collectLiveScriptFailures();
  if (failures.length > 0) {
    console.error(`${failures.length} live-script wiring problem(s):\n`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    'Live dev scripts OK — :live, :stack:*, and parity:generate:live are wired.',
  );
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main();
}
