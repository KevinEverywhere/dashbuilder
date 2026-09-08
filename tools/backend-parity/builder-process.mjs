/**
 * Start or reuse the RosettaDash builder API for one-shot scripts.
 *
 * Uses the compiled server (dist/apps/server/main.js) so Nx TUI does not
 * fight orchestration scripts. Dev servers that need a live API in the
 * same terminal should use scripts/run-with-server.mjs instead.
 */

import { execSync, spawn } from 'node:child_process';
import { join } from 'node:path';

import { assertBuilderApi } from './assert-builder-api.mjs';
import { BUILDER_API_BASE, workspaceRoot } from './seed-model.mjs';

export const BUILDER_WAIT_MS = 180_000;
export const BUILDER_POLL_MS = 1_500;
export const SERVER_ENTRY = join(workspaceRoot, 'dist/apps/server/main.js');

export const nxEnv = {
  ...process.env,
  NX_TUI: 'false',
};

export function npmRun(script) {
  execSync(`npm run ${script}`, { cwd: workspaceRoot, stdio: 'inherit', env: nxEnv });
}

function buildBuilderServer() {
  console.log('Building builder API…');
  execSync('npx nx run server:build:development', {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: nxEnv,
  });
}

export async function builderIsUp() {
  try {
    await assertBuilderApi(BUILDER_API_BASE);
    return true;
  } catch {
    return false;
  }
}

async function waitForBuilder(child) {
  const deadline = Date.now() + BUILDER_WAIT_MS;

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    child.on('exit', (code, signal) => {
      if (settled || code === 0) {
        return;
      }
      finish(
        new Error(
          `Builder API exited before becoming ready (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`,
        ),
      );
    });

    child.on('error', (error) => {
      finish(new Error(`Failed to start builder API: ${error.message}`));
    });

    const poll = async () => {
      while (!settled && Date.now() < deadline) {
        if (await builderIsUp()) {
          finish();
          return;
        }
        await new Promise((resolveDelay) => setTimeout(resolveDelay, BUILDER_POLL_MS));
      }
      if (!settled) {
        finish(
          new Error(
            `Timed out after ${BUILDER_WAIT_MS / 1000}s waiting for the builder API at ${BUILDER_API_BASE}.\n` +
              'Check builder output above.',
          ),
        );
      }
    };

    void poll();
  });
}

export function startBuilderServer() {
  buildBuilderServer();
  console.log('Starting builder API (node dist/apps/server/main.js)…\n');

  const child = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: workspaceRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  child.stdout?.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr?.on('data', (chunk) => process.stderr.write(chunk));

  return child;
}

export function stopBuilderServer(child, reason = 'script') {
  if (!child || child.killed || child.exitCode !== null) {
    return;
  }
  console.log(`\nStopping builder API started by ${reason}…`);
  child.kill('SIGTERM');
}

/**
 * Ensure builder API is up; returns a handle to stop it when this call started it.
 *
 * Optional deps for unit tests: checkUp, start, wait, quiet.
 */
export async function ensureBuilderApi(deps = {}) {
  const checkUp = deps.checkUp ?? builderIsUp;
  const start = deps.start ?? startBuilderServer;
  const wait = deps.wait ?? waitForBuilder;
  const quiet = deps.quiet ?? false;

  if (await checkUp()) {
    if (!quiet) {
      console.log('Builder API already running — reusing it.\n');
    }
    return { child: null, started: false };
  }

  const child = start();
  await wait(child);
  if (!quiet) {
    console.log('Builder API is ready.\n');
  }
  return { child, started: true };
}
