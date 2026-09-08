#!/usr/bin/env node
/**
 * Run the builder API and another Nx dev target in one terminal.
 *
 *   npm run proof:react:live
 *   node scripts/run-with-server.mjs storybook-react --target storybook
 */

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  companionUsage,
  parseCompanionArgs,
} from './orchestration-args.mjs';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const nxEnv = {
  ...process.env,
  NX_TUI: 'false',
};

function usage() {
  console.error(companionUsage('run-with-server.mjs'));
  process.exit(1);
}

function spawnNx(project, target) {
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

console.log(`Starting builder API and ${project} (${target})…\n`);

const server = spawnNx('server', 'serve');
const companion = spawnNx(project, target);

let exiting = false;

function shutdown(code = 0) {
  if (exiting) {
    return;
  }
  exiting = true;
  server.kill('SIGTERM');
  companion.kill('SIGTERM');
  process.exit(code);
}

server.on('exit', (code, signal) => {
  if (exiting) {
    return;
  }
  console.error(
    `\nBuilder API exited (code=${code ?? 'null'}, signal=${signal ?? 'null'}). Stopping ${project}.`,
  );
  shutdown(code && code !== 0 ? code : 1);
});

companion.on('exit', (code, signal) => {
  if (exiting) {
    return;
  }
  console.error(
    `\n${project} exited (code=${code ?? 'null'}, signal=${signal ?? 'null'}). Stopping builder API.`,
  );
  shutdown(code && code !== 0 ? code : 0);
});

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));
