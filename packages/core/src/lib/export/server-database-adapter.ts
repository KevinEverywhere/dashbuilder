/**
 * Engine-aware database module generation for the server exporters (DAS-185).
 *
 * The four server exporters used to emit a hard-coded `pg` pool, which is why
 * every one of them rejected MySQL, MongoDB, and Supabase composites even
 * though the docs promised those pairings.
 *
 * This module emits, for any promised database engine, a single file that
 * satisfies one uniform contract:
 *
 *   export type DataClient = <engine-specific client type>;
 *   export function createDataClient(): DataClient;
 *   export function queryRows(client, source, limit?): Promise<Record<string, unknown>[]>;
 *   export function closeDataClient(client): Promise<void>;
 *
 * Server exporters import `DataClient` from the generated module rather than
 * from a driver package, so the server shape stays independent of the engine
 * and every server x database combination becomes generateable.
 */

import type { QueryScope } from '../domain/query-scope';
import {
  hasQueryScope,
  scopedMongoListDocumentsLines,
  scopedMysqlListRowsLines,
  scopedPostgresListRowsLines,
  scopedSupabaseListRowsLines,
} from '../domain/query-scope';
import type { IRDataSource } from '../ir/types';
import type { ExportIR } from '../ir/types';

/** The database engines the product promises as export targets. */
export type ExportDatabaseEngine = 'postgresql' | 'mysql' | 'mongodb' | 'supabase';

const INFRA_TYPE_BY_ENGINE: Record<ExportDatabaseEngine, string> = {
  postgresql: 'infra.postgresql',
  mysql: 'infra.mysql',
  mongodb: 'infra.mongodb',
  supabase: 'infra.supabase',
};

const ENGINE_BY_INFRA_TYPE: Record<string, ExportDatabaseEngine> = Object.fromEntries(
  Object.entries(INFRA_TYPE_BY_ENGINE).map(([engine, type]) => [type, engine]),
) as Record<string, ExportDatabaseEngine>;

/** npm packages a generated server needs for each engine. */
export const ENGINE_DEPENDENCIES: Record<ExportDatabaseEngine, string[]> = {
  postgresql: ['pg'],
  mysql: ['mysql2'],
  mongodb: ['mongodb'],
  supabase: ['@supabase/supabase-js'],
};

/** Human label used in generated comments and README fragments. */
export const ENGINE_LABELS: Record<ExportDatabaseEngine, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  supabase: 'Supabase',
};

export interface ServerDatabaseSource {
  engine: ExportDatabaseEngine;
  label: string;
  /** Table name, or collection name for MongoDB. */
  source?: string;
  connectionEnvKey: string;
  anonKeyEnvKey?: string;
  dependencies: string[];
}

const DEFAULT_CONNECTION_ENV_KEYS: Record<ExportDatabaseEngine, string> = {
  postgresql: 'DATABASE_URL',
  mysql: 'MYSQL_URL',
  mongodb: 'MONGODB_URI',
  supabase: 'SUPABASE_URL',
};

function toServerDatabaseSource(dataSource: IRDataSource): ServerDatabaseSource | undefined {
  const engine = ENGINE_BY_INFRA_TYPE[dataSource.type];
  if (!engine) {
    return undefined;
  }

  return {
    engine,
    label: ENGINE_LABELS[engine],
    source: dataSource.table ?? dataSource.collection,
    connectionEnvKey: dataSource.connectionEnvKey ?? DEFAULT_CONNECTION_ENV_KEYS[engine],
    ...(engine === 'supabase'
      ? { anonKeyEnvKey: dataSource.anonKeyEnvKey ?? 'SUPABASE_ANON_KEY' }
      : {}),
    dependencies: ENGINE_DEPENDENCIES[engine],
  };
}

/** Every database source in the IR that a server can be generated against. */
export function resolveServerDatabaseSources(ir: ExportIR): ServerDatabaseSource[] {
  return ir.dataSources
    .map(toServerDatabaseSource)
    .filter((source): source is ServerDatabaseSource => source !== undefined);
}

/**
 * Picks the database source a server export should read from. The composite's
 * declared `targets.database` wins so that an explicit choice is honoured;
 * otherwise the first database node in the graph is used.
 */
export function resolveServerDatabaseSource(ir: ExportIR): ServerDatabaseSource | undefined {
  const sources = resolveServerDatabaseSources(ir);
  if (sources.length === 0) {
    return undefined;
  }

  const declared = ir.targets.database as ExportDatabaseEngine | undefined;
  if (declared) {
    const match = sources.find((source) => source.engine === declared);
    if (match) {
      return match;
    }
  }

  return sources[0];
}

const IDENTIFIER_GUARD = (engineLabel: string, kind: 'table' | 'collection'): string[] => [
  `  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(source)) {`,
  `    throw new Error(\`Unsafe ${engineLabel} ${kind} identifier: \${source}\`);`,
  `  }`,
];

export interface ServerDatabaseModuleOptions {
  database: ServerDatabaseSource;
  /** Relative import path to the generated scope module, when scoped. */
  scopeImportPath?: string;
  scope?: QueryScope;
}

/**
 * Renders the database module for one engine. The exported symbols are
 * identical across engines, which is what lets the server exporters stay
 * engine-agnostic.
 */
export function generateServerDatabaseModuleSource(
  options: ServerDatabaseModuleOptions,
): string {
  const { database, scope } = options;
  const scoped = hasQueryScope(scope);
  const scopeImport =
    scoped && options.scopeImportPath
      ? [`import { resolveRuntimeScope } from '${options.scopeImportPath}';`, ``]
      : [];

  const header = [
    `// ${database.label} data access generated by RosettaDash.`,
    `// Exposes the uniform DataClient contract the server routes depend on.`,
    ``,
  ];

  const lines: string[] = (() => {
    switch (database.engine) {
      case 'postgresql':
        return [
          `import { Pool } from 'pg';`,
          ...scopeImport,
          `export type DataClient = Pool;`,
          ``,
          `let client: DataClient | undefined;`,
          ``,
          `export function createDataClient(): DataClient {`,
          `  if (client) {`,
          `    return client;`,
          `  }`,
          `  const connectionString = process.env['${database.connectionEnvKey}'];`,
          `  if (!connectionString) {`,
          `    throw new Error('Missing required environment variable: ${database.connectionEnvKey}');`,
          `  }`,
          `  client = new Pool({ connectionString });`,
          `  return client;`,
          `}`,
          ``,
          `export async function queryRows(`,
          `  client: DataClient,`,
          `  source: string,`,
          `  limit = 100,`,
          `): Promise<Record<string, unknown>[]> {`,
          ...IDENTIFIER_GUARD('PostgreSQL', 'table'),
          `  const tableName = source;`,
          ...(scoped
            ? scopedPostgresListRowsLines({
                queryReceiver: 'client',
                quoteIdentifierRef: 'quoteIdentifier',
                indent: '  ',
              })
            : [
                `  const result = await client.query(`,
                `    \`SELECT * FROM \${quoteIdentifier(tableName)} ORDER BY 1 LIMIT $1\`,`,
                `    [limit],`,
                `  );`,
                `  return result.rows;`,
              ]),
          `}`,
          ``,
          `export async function closeDataClient(client: DataClient): Promise<void> {`,
          `  await client.end();`,
          `}`,
          ``,
          `function quoteIdentifier(value: string): string {`,
          `  return \`"\${value.replace(/"/g, '""')}"\`;`,
          `}`,
          ``,
        ];

      case 'mysql':
        return [
          `import { createPool, type Pool } from 'mysql2/promise';`,
          ...scopeImport,
          `export type DataClient = Pool;`,
          ``,
          `let client: DataClient | undefined;`,
          ``,
          `export function createDataClient(): DataClient {`,
          `  if (client) {`,
          `    return client;`,
          `  }`,
          `  const url = process.env['${database.connectionEnvKey}'];`,
          `  if (!url) {`,
          `    throw new Error('Missing required environment variable: ${database.connectionEnvKey}');`,
          `  }`,
          `  client = createPool(url);`,
          `  return client;`,
          `}`,
          ``,
          `export async function queryRows(`,
          `  pool: DataClient,`,
          `  source: string,`,
          `  limit = 100,`,
          `): Promise<Record<string, unknown>[]> {`,
          ...IDENTIFIER_GUARD('MySQL', 'table'),
          `  const tableName = source;`,
          ...(scoped
            ? scopedMysqlListRowsLines({ indent: '  ' })
            : [
                `  const [rows] = await pool.query(`,
                `    \`SELECT * FROM \\\`\${tableName}\\\` LIMIT ?\`,`,
                `    [limit],`,
                `  );`,
                `  return rows as Record<string, unknown>[];`,
              ]),
          `}`,
          ``,
          `export async function closeDataClient(client: DataClient): Promise<void> {`,
          `  await client.end();`,
          `}`,
          ``,
        ];

      case 'mongodb':
        return [
          `import { MongoClient } from 'mongodb';`,
          ...scopeImport,
          `export type DataClient = MongoClient;`,
          ``,
          `let client: DataClient | undefined;`,
          ``,
          `export function createDataClient(): DataClient {`,
          `  if (client) {`,
          `    return client;`,
          `  }`,
          `  const uri = process.env['${database.connectionEnvKey}'];`,
          `  if (!uri) {`,
          `    throw new Error('Missing required environment variable: ${database.connectionEnvKey}');`,
          `  }`,
          `  // The driver connects lazily on first operation, so this stays sync.`,
          `  client = new MongoClient(uri);`,
          `  return client;`,
          `}`,
          ``,
          `export async function queryRows(`,
          `  client: DataClient,`,
          `  source: string,`,
          `  limit = 100,`,
          `): Promise<Record<string, unknown>[]> {`,
          ...IDENTIFIER_GUARD('MongoDB', 'collection'),
          `  const collectionName = source;`,
          ...(scoped
            ? scopedMongoListDocumentsLines({ indent: '  ' })
            : [
                `  const cursor = client`,
                `    .db()`,
                `    .collection(collectionName)`,
                `    .find({})`,
                `    .limit(limit);`,
                `  return (await cursor.toArray()) as Record<string, unknown>[];`,
              ]),
          `}`,
          ``,
          `export async function closeDataClient(client: DataClient): Promise<void> {`,
          `  await client.close();`,
          `}`,
          ``,
        ];

      case 'supabase':
        return [
          `import { createClient, type SupabaseClient } from '@supabase/supabase-js';`,
          ...scopeImport,
          `export type DataClient = SupabaseClient;`,
          ``,
          `let client: DataClient | undefined;`,
          ``,
          `export function createDataClient(): DataClient {`,
          `  if (client) {`,
          `    return client;`,
          `  }`,
          `  const url = process.env['${database.connectionEnvKey}'];`,
          `  const anonKey = process.env['${database.anonKeyEnvKey ?? 'SUPABASE_ANON_KEY'}'];`,
          `  if (!url) {`,
          `    throw new Error('Missing required environment variable: ${database.connectionEnvKey}');`,
          `  }`,
          `  if (!anonKey) {`,
          `    throw new Error('Missing required environment variable: ${database.anonKeyEnvKey ?? 'SUPABASE_ANON_KEY'}');`,
          `  }`,
          `  client = createClient(url, anonKey);`,
          `  return client;`,
          `}`,
          ``,
          `export async function queryRows(`,
          `  client: DataClient,`,
          `  source: string,`,
          `  limit = 100,`,
          `): Promise<Record<string, unknown>[]> {`,
          ...IDENTIFIER_GUARD('Supabase', 'table'),
          `  const tableName = source;`,
          ...(scoped
            ? scopedSupabaseListRowsLines({ indent: '  ' })
            : [
                `  const { data, error } = await client`,
                `    .from(tableName)`,
                `    .select('*')`,
                `    .limit(limit);`,
                `  if (error) {`,
                `    throw error;`,
                `  }`,
                `  return (data ?? []) as Record<string, unknown>[];`,
              ]),
          `}`,
          ``,
          `export async function closeDataClient(_client: DataClient): Promise<void> {`,
          `  // The Supabase REST client holds no persistent connection to close.`,
          `}`,
          ``,
        ];
    }
  })();

  return `${[...header, ...lines].join('\n')}\n`;
}
