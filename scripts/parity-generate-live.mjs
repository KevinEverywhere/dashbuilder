#!/usr/bin/env node
/**
 * Run parity:generate with the builder API up (one terminal).
 *
 *   npm run parity:generate:live
 */

import {
  ensureBuilderApi,
  npmRun,
  stopBuilderServer,
} from '../tools/backend-parity/builder-process.mjs';

const builder = await ensureBuilderApi();

try {
  npmRun('parity:generate');
} finally {
  if (builder.started) {
    stopBuilderServer(builder.child, 'parity:generate:live');
  }
}
