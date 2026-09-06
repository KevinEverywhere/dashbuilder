/**
 * Canonical composites for the backend parity checks.
 *
 * Built with the real `defaultComponentRegistry` out of the compiled core
 * package, so these are the same node shapes the builder produces. They are
 * fed to the builder's own export endpoints, which means a passing parity
 * check exercises the production path: controller → ExportService → exporter.
 *
 * Requires `nx build core` (dist/packages/core) to be present.
 */

import { createRequire } from 'node:module';
import { join } from 'node:path';

import { PARITY_PORTS, SEED_SCOPE, workspaceRoot } from './seed-model.mjs';

const require = createRequire(import.meta.url);

const corePath = join(workspaceRoot, 'dist', 'packages', 'core', 'src', 'index.js');

let core;
try {
  core = require(corePath);
} catch (error) {
  throw new Error(
    `Could not load the compiled core package from ${corePath}.\n` +
      `Run: npx nx build core\n\nUnderlying error: ${error.message}`,
  );
}

export const { defaultComponentRegistry, buildExportIR, validateComposite } = core;

/** The table every parity composite reads. Seeded from preview-content.json. */
export const PARITY_TABLE = 'orders';

/**
 * The database promises, and how each one is declared as an infra node.
 * `envKeys` lists what the generated `.env.example` must ask for.
 */
export const DATABASE_PROMISES = {
  postgresql: {
    label: 'PostgreSQL',
    nodeType: 'infra.postgresql',
    exportTarget: 'postgresql',
    properties: { connectionEnvKey: 'DATABASE_URL', table: PARITY_TABLE },
    envKeys: ['DATABASE_URL'],
  },
  mysql: {
    label: 'MySQL',
    nodeType: 'infra.mysql',
    exportTarget: 'mysql',
    properties: { connectionEnvKey: 'MYSQL_URL', table: PARITY_TABLE },
    envKeys: ['MYSQL_URL'],
  },
  mongodb: {
    label: 'MongoDB',
    nodeType: 'infra.mongodb',
    exportTarget: 'mongodb',
    properties: { connectionEnvKey: 'MONGODB_URI', collection: PARITY_TABLE },
    envKeys: ['MONGODB_URI'],
  },
  supabase: {
    label: 'Supabase',
    nodeType: 'infra.supabase',
    exportTarget: 'supabase',
    properties: {
      urlEnvKey: 'SUPABASE_URL',
      anonKeyEnvKey: 'SUPABASE_ANON_KEY',
      table: PARITY_TABLE,
    },
    envKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  },
};

/** The server promises and the export endpoint that generates each one. */
export const SERVER_PROMISES = {
  nest: {
    label: 'NestJS',
    nodeType: 'infra.server.nest',
    endpoint: 'nest',
    port: PARITY_PORTS.serverNest,
  },
  express: {
    label: 'Express',
    nodeType: 'infra.server.express',
    endpoint: 'express',
    port: PARITY_PORTS.serverExpress,
  },
  next: {
    label: 'Next.js',
    nodeType: 'infra.server.next',
    endpoint: 'next',
    port: PARITY_PORTS.serverNext,
  },
  nuxt: {
    label: 'Nuxt',
    nodeType: 'infra.server.nuxt',
    endpoint: 'nuxt',
    port: PARITY_PORTS.serverNuxt,
  },
};

/**
 * UI runtime pairings from the matrix in docs/29-stack-server-database-validation.md.
 * Next only pairs with React and Nuxt only with Vue, so the parity composite
 * uses the idiomatic UI for each server rather than an arbitrary one.
 */
export const SERVER_UI_PAIRING = {
  nest: 'angular',
  express: 'react',
  next: 'react',
  nuxt: 'vue',
};

/**
 * Builds a composite wiring one database promise into one server promise.
 * Pass `server: null` for a database-only composite.
 */
export function buildParityComposite({ database, server = null, ui = null, scoped = false }) {
  const db = DATABASE_PROMISES[database];
  if (!db) {
    throw new Error(`Unknown database promise "${database}"`);
  }

  const registry = defaultComponentRegistry;
  const suffix = server ? `${database}-${server}` : database;

  const table = registry.createNode('visual.table', {
    id: `parity-table-${suffix}`,
    label: 'Orders',
    layout: { x: 24, y: 24, width: 360, height: 180 },
    properties: { pageSize: 25, sortable: true, filterable: true },
  });

  const dataSource = registry.createNode(db.nodeType, {
    id: `parity-db-${suffix}`,
    properties: { ...db.properties },
  });

  const nodes = [table, dataSource];

  if (server) {
    const serverPromise = SERVER_PROMISES[server];
    if (!serverPromise) {
      throw new Error(`Unknown server promise "${server}"`);
    }
    nodes.push(
      registry.createNode(serverPromise.nodeType, {
        id: `parity-server-${suffix}`,
        properties: { globalPrefix: 'api' },
      }),
    );
  }

  return {
    id: `parity-${suffix}`,
    name: `Parity ${db.label}${server ? ` + ${SERVER_PROMISES[server].label}` : ''}`,
    description: `Backend parity fixture reading the seeded "${PARITY_TABLE}" data.`,
    version: 1,
    // A domain context makes the exporters emit their scoped query variants,
    // which filter on the client_id/project_id/created_at columns the seeds
    // carry. Exercised separately because it is a different code path.
    ...(scoped
      ? {
          domainContext: {
            client: { id: SEED_SCOPE.clientId, name: 'Northwind' },
            project: { id: SEED_SCOPE.projectId, name: 'Revenue' },
            defaultTimeRange: 'last-30-days',
          },
        }
      : {}),
    nodes,
    bindings: [
      {
        id: `parity-binding-${suffix}`,
        sourceNodeId: dataSource.id,
        sourcePortId: dataSource.ports.outputs[0]?.id ?? 'rowset',
        targetNodeId: table.id,
        targetPortId: 'data',
      },
    ],
    exportTargets: {
      ui: ui ?? (server ? SERVER_UI_PAIRING[server] : 'react'),
      ...(server ? { server } : {}),
      database: db.exportTarget,
    },
  };
}

/** Every server × database combination the docs promise. */
export function promiseMatrix() {
  const combinations = [];
  for (const server of Object.keys(SERVER_PROMISES)) {
    for (const database of Object.keys(DATABASE_PROMISES)) {
      combinations.push({ server, database });
    }
  }
  return combinations;
}
