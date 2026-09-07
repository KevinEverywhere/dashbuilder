#!/usr/bin/env node
/**
 * One-shot backend parity verification.
 *
 *   npm run parity:verify
 *
 * Starts the builder API when it is not already up, boots Docker DBs and
 * generated servers, then runs parity:check. Reuses an existing
 * npm run start:server when :3000 already serves RosettaDash.
 *
 * Runs the compiled server directly (dist/apps/server/main.js) instead of
 * `nx serve` so Nx TUI does not fight the parent terminal.
 */

import { execSync, spawn } from 'node:child_process';
import { join } from 'node:path';

import { assertBuilderApi } from './assert-builder-api.mjs';
import { BUILDER_API_BASE, workspaceRoot } from './seed-model.mjs';

const BUILDER_WAIT_MS = 180_000;
const BUILDER_POLL_MS = 1_500;
const SERVER_ENTRY = join(workspaceRoot, 'dist/apps/server/main.js');

const nxEnv = {
  ...process.env,
  NX_TUI: 'false',
};

function npmRun(script) {
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

async function builderIsUp() {
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

function startBuilderServer() {
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

function stopBuilderServer(child) {
  if (!child || child.killed || child.exitCode !== null) {
    return;
  }
  console.log('\nStopping builder API started by parity:verify…');
  child.kill('SIGTERM');
}

async function main() {
  let serverProc = null;
  let startedServer = false;

  const cleanup = () => {
    if (startedServer) {
      stopBuilderServer(serverProc);
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  try {
    if (await builderIsUp()) {
      console.log('Builder API already running — reusing it.\n');
    } else {
      serverProc = startBuilderServer();
      startedServer = true;
      await waitForBuilder(serverProc);
      console.log('Builder API is ready.\n');
    }

    npmRun('parity:db:up');
    npmRun('parity:generate');
    npmRun('parity:servers:up');
    npmRun('parity:check');
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
