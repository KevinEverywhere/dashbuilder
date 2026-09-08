#!/usr/bin/env node
/**
 * One-shot backend parity verification.
 *
 *   npm run parity:verify
 *
 * Starts the builder API when it is not already up, boots Docker DBs and
 * generated servers, then runs parity:check. Reuses an existing
 * npm run start:server when :3000 already serves RosettaDash.
 */

import {
  ensureBuilderApi,
  npmRun,
  stopBuilderServer,
} from './builder-process.mjs';
import { assertLiveScripts } from './check-live-scripts.mjs';

async function main() {
  assertLiveScripts();

  let serverProc = null;
  let startedServer = false;

  const cleanup = () => {
    if (startedServer) {
      stopBuilderServer(serverProc, 'parity:verify');
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
    const builder = await ensureBuilderApi();
    serverProc = builder.child;
    startedServer = builder.started;

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
