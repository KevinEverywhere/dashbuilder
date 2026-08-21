import type { Composite, ExportTargetConfig } from '@rosettadash/core';
import { defaultComponentRegistry } from '@rosettadash/core';

export type UiTarget = NonNullable<ExportTargetConfig['ui']>;
export type ServerTarget = NonNullable<ExportTargetConfig['server']>;
export type DatabaseTarget = NonNullable<ExportTargetConfig['database']>;

export type DatabaseLayerTarget = 'mongodb' | 'supabase' | 'mysql';

export const UI_TARGETS: UiTarget[] = ['react', 'angular', 'vue', 'svelte', 'web-components'];
export const SERVER_TARGETS: ServerTarget[] = ['nest', 'express', 'next', 'nuxt'];
export const DATABASE_LAYER_TARGETS: DatabaseLayerTarget[] = ['mongodb', 'supabase', 'mysql'];

export const UI_ENTRY_FILES: Record<UiTarget, string> = {
  react: 'src/Dashboard.tsx',
  angular: 'src/dashboard.component.ts',
  vue: 'src/Dashboard.vue',
  svelte: 'src/Dashboard.svelte',
  'web-components': 'src/dashboard.ts',
};

export const UI_EXCLUDED_FILES: Record<UiTarget, string[]> = {
  react: ['src/dashboard.component.ts', 'src/Dashboard.vue', 'src/Dashboard.svelte', 'src/dashboard.ts'],
  angular: ['src/Dashboard.tsx', 'src/Dashboard.vue', 'src/Dashboard.svelte', 'src/dashboard.ts'],
  vue: ['src/Dashboard.tsx', 'src/dashboard.component.ts', 'src/Dashboard.svelte', 'src/dashboard.ts'],
  svelte: ['src/Dashboard.tsx', 'src/dashboard.component.ts', 'src/Dashboard.vue', 'src/dashboard.ts'],
  'web-components': [
    'src/Dashboard.tsx',
    'src/dashboard.component.ts',
    'src/Dashboard.vue',
    'src/Dashboard.svelte',
  ],
};

export const SERVER_ENTRY_FILES: Record<ServerTarget, string> = {
  nest: 'server/src/main.ts',
  express: 'server/src/index.ts',
  next: 'server/src/app/api/sales/route.ts',
  nuxt: 'server/api/sales.get.ts',
};

export const SERVER_EXCLUDED_FILES: Record<ServerTarget, string[]> = {
  nest: ['server/src/index.ts'],
  express: ['server/src/main.ts'],
  next: ['server/src/main.ts', 'server/src/index.ts'],
  nuxt: ['server/src/main.ts', 'server/src/index.ts'],
};

export const DATABASE_ENTRY_FILES: Record<DatabaseLayerTarget, string> = {
  mongodb: 'database/src/mongo.client.ts',
  supabase: 'database/src/supabase.client.ts',
  mysql: 'database/src/mysql.pool.ts',
};

export function cartesian<T, U>(left: readonly T[], right: readonly U[]): Array<[T, U]> {
  const pairs: Array<[T, U]> = [];
  for (const a of left) {
    for (const b of right) {
      pairs.push([a, b]);
    }
  }
  return pairs;
}

export function buildPostgresqlBundleComposite(
  ui: UiTarget,
  server: ServerTarget,
): Composite {
  const pg = defaultComponentRegistry.createNode('infra.postgresql', {
    id: 'pg1',
    properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
  });
  const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
  const serverNode = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

  return {
    id: 'matrix-pg',
    name: 'Dashboard',
    version: 1,
    exportTargets: { ui, server, database: 'postgresql' },
    nodes: [pg, table, serverNode],
    bindings: [
      {
        id: 'b1',
        sourceNodeId: 'pg1',
        sourcePortId: 'rowset',
        targetNodeId: 't1',
        targetPortId: 'data',
      },
    ],
  };
}

export function buildDatabaseLayerBundleComposite(
  ui: UiTarget,
  database: DatabaseLayerTarget,
): Composite {
  const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
  const serverNode = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

  if (database === 'mongodb') {
    const mongo = defaultComponentRegistry.createNode('infra.mongodb', {
      id: 'db1',
      properties: { connectionEnvKey: 'MONGODB_URI', collection: 'sales' },
    });

    return {
      id: 'matrix-mongo',
      name: 'Dashboard',
      version: 1,
      exportTargets: { ui, server: 'nest', database: 'mongodb' },
      nodes: [mongo, table, serverNode],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'db1',
          sourcePortId: 'documents',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    };
  }

  if (database === 'supabase') {
    const supabase = defaultComponentRegistry.createNode('infra.supabase', {
      id: 'db1',
      properties: {
        urlEnvKey: 'SUPABASE_URL',
        anonKeyEnvKey: 'SUPABASE_ANON_KEY',
        table: 'sales',
      },
    });

    return {
      id: 'matrix-supabase',
      name: 'Dashboard',
      version: 1,
      exportTargets: { ui, server: 'nest', database: 'supabase' },
      nodes: [supabase, table, serverNode],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'db1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    };
  }

  const mysql = defaultComponentRegistry.createNode('infra.mysql', {
    id: 'db1',
    properties: { connectionEnvKey: 'MYSQL_URL', table: 'sales' },
  });

  return {
    id: 'matrix-mysql',
    name: 'Dashboard',
    version: 1,
    exportTargets: { ui, server: 'nest', database: 'mysql' },
    nodes: [mysql, table, serverNode],
    bindings: [
      {
        id: 'b1',
        sourceNodeId: 'db1',
        sourcePortId: 'rowset',
        targetNodeId: 't1',
        targetPortId: 'data',
      },
    ],
  };
}

export function filePaths(files: { path: string }[]): string[] {
  return files.map((file) => file.path);
}
