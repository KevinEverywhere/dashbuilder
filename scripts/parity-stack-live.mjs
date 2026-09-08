#!/usr/bin/env node
/**
 * Boot the backend parity stack, then run a proof app or Storybook catalog.
 *
 *   npm run parity:stack:proof:react
 *   node scripts/parity-stack-live.mjs storybook-angular --target storybook
 *
 * Expects `npm run parity:db:up` to have been run first (the package.json
 * scripts chain that for you).
 */

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ensureBuilderApi,
  npmRun,
  nxEnv,
  stopBuilderServer,
} from '../tools/backend-parity/builder-process.mjs';
import { workspaceRoot } from '../tools/backend-parity/seed-model.mjs';
import {
  companionUsage,
  parseCompanionArgs,
} from './orchestration-args.mjs';

function usage() {
  console.error(companionUsage('parity-stack-live.mjs'));
  process.exit(1);
}

function spawnCompanion(project, target) {
  if (target === 'storybook') {
    return spawn('npx', ['nx', 'storybook', project], {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env: nxEnv,
    });
  }
  return spawn('npx', ['nx', 'serve', project], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: nxEnv,
  });
}

const parsed = parseCompanionArgs(process.argv);
if (parsed.error) {
  usage();
}
const { project, target } = parsed;

let builderProc = null;
let startedBuilder = false;
let companionProc = null;

function stopBuilderIfNeeded() {
  if (startedBuilder) {
    stopBuilderServer(builderProc, 'parity:stack');
    builderProc = null;
    startedBuilder = false;
  }
}

function shutdown(code = 0) {
  if (companionProc && !companionProc.killed && companionProc.exitCode === null) {
    companionProc.kill('SIGTERM');
  }
  stopBuilderIfNeeded();
  process.exit(code);
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

try {
  const builder = await ensureBuilderApi();
  builderProc = builder.child;
  startedBuilder = builder.started;

  npmRun('parity:generate');
  npmRun('parity:servers:up');
  stopBuilderIfNeeded();

  console.log(`\nParity stack is ready. Starting ${project} (${target})…\n`);
  companionProc = spawnCompanion(project, target);

  companionProc.on('exit', (code, signal) => {
    if (code && code !== 0) {
      console.error(
        `\n${project} exited (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`,
      );
      shutdown(code);
      return;
    }
    shutdown(0);
  });
} catch (error) {
  console.error(error.message ?? error);
  shutdown(1);
}
