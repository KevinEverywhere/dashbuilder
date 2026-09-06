import { buildExportIR, defaultComponentRegistry } from '@rosettadash/core';
import { generateNuxtInfraFiles } from './generate-nuxt-infra';
import { NuxtExportError } from './types';

describe('generateNuxtInfraFiles', () => {
  const registry = defaultComponentRegistry;

  it('generates Nuxt server files for a postgres-backed composite', () => {
    const dateRange = registry.createNode('visual.input.date-range', { id: 'dr1' });
    const table = registry.createNode('visual.table', { id: 't1' });
    const chart = registry.createNode('visual.chart.line', { id: 'c1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nuxt', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Sales Dashboard',
        version: 2,
        exportTargets: { ui: 'react', server: 'nuxt', database: 'postgresql' },
        nodes: [dateRange, table, chart, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 't1',
            targetPortId: 'data',
          },
          {
            id: 'b2',
            sourceNodeId: 'dr1',
            sourcePortId: 'range',
            targetNodeId: 't1',
            targetPortId: 'filter',
          },
          {
            id: 'b3',
            sourceNodeId: 'dr1',
            sourcePortId: 'range',
            targetNodeId: 'c1',
            targetPortId: 'range',
          },
          {
            id: 'b4',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 'c1',
            targetPortId: 'data',
          },
        ],
      },
      registry,
      { generatedAt: '2026-08-08T00:00:00.000Z' },
    );

    const files = generateNuxtInfraFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        '.env.example',
        'server/utils/database.ts',
        'server/api/sales.get.ts',
        'README.export.server.md',
      ]),
    );

    const route = files.find((file) => file.path === 'server/api/sales.get.ts');
    expect(route?.content).toContain('defineEventHandler');
    expect(route?.content).toContain("queryRows(createDataClient(), 'sales')");
    expect(route?.content).toContain('createError');

    const database = files.find((file) => file.path === 'server/utils/database.ts');
    expect(database?.content).toContain("process.env['DATABASE_URL']");

    const env = files.find((file) => file.path === '.env.example');
    expect(env?.content).toContain('DATABASE_URL=');
  });

  it('rejects non-nuxt server targets', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Next only',
        version: 1,
        exportTargets: { ui: 'react', server: 'next' },
        nodes: [
          registry.createNode('infra.postgresql', {
            id: 'pg1',
            properties: { table: 'sales' },
          }),
        ],
        bindings: [],
      },
      registry,
    );

    expect(() => generateNuxtInfraFiles(ir)).toThrow(/cannot generate server target "next"/);
  });

  it('requires at least one database data source', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'No database',
        version: 1,
        exportTargets: { ui: 'react', server: 'nuxt' },
        nodes: [registry.createNode('infra.server.nuxt', { id: 's1' })],
        bindings: [],
      },
      registry,
    );

    expect(() => generateNuxtInfraFiles(ir)).toThrow(NuxtExportError);
    expect(() => generateNuxtInfraFiles(ir)).toThrow(/database data source/);
  });

  // DAS-185: the docs promise every server pairs with every database, but the
  // exporter used to hard-require PostgreSQL and reject the other three.
  describe('non-PostgreSQL database promises', () => {
    function buildIrFor(
      nodeType: string,
      database: 'mysql' | 'mongodb' | 'supabase',
      properties: Record<string, unknown>,
    ) {
      const dataSource = registry.createNode(nodeType, { id: 'db1', properties });

      return buildExportIR(
        {
          id: `comp-${database}`,
          name: `Sales via ${database}`,
          version: 1,
          exportTargets: { ui: 'vue', server: 'nuxt', database },
          nodes: [
            registry.createNode('visual.table', { id: 't1' }),
            dataSource,
            registry.createNode('infra.server.nuxt', { id: 's1' }),
          ],
          bindings: [
            {
              id: 'b1',
              sourceNodeId: 'db1',
              // Mongo exposes `documents` where the SQL engines expose `rowset`.
              sourcePortId: dataSource.ports.outputs[0].id,
              targetNodeId: 't1',
              targetPortId: 'data',
            },
          ],
        },
        registry,
        { generatedAt: '2026-08-08T00:00:00.000Z' },
      );
    }

    it.each([
      ['infra.mysql', 'mysql', { connectionEnvKey: 'MYSQL_URL', table: 'sales' }, "from 'mysql2/promise'", 'MYSQL_URL'],
      ['infra.mongodb', 'mongodb', { connectionEnvKey: 'MONGODB_URI', collection: 'sales' }, "from 'mongodb'", 'MONGODB_URI'],
      [
        'infra.supabase',
        'supabase',
        { urlEnvKey: 'SUPABASE_URL', anonKeyEnvKey: 'SUPABASE_ANON_KEY', table: 'sales' },
        "from '@supabase/supabase-js'",
        'SUPABASE_URL',
      ],
    ] as const)(
      'generates a %s-backed Nuxt server',
      (nodeType, database, properties, expectedImport, expectedEnvKey) => {
        const files = generateNuxtInfraFiles(
          buildIrFor(nodeType, database, properties as Record<string, unknown>),
        );

        const db = files.find((file) => file.path === 'server/utils/database.ts');
        expect(db?.content).toContain(expectedImport);
        expect(db?.content).toContain(`process.env['${expectedEnvKey}']`);
        expect(db?.content).toContain('export type DataClient');

        const route = files.find((file) => file.path.endsWith('.get.ts'));
        expect(route?.content).toContain("queryRows(createDataClient(), 'sales')");
        expect(route?.content).not.toContain("from 'pg'");
      },
    );
  });
});
