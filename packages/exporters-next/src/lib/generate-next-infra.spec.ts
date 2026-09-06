import { buildExportIR, defaultComponentRegistry } from '@rosettadash/core';
import { generateNextInfraFiles } from './generate-next-infra';
import { NextExportError } from './types';

describe('generateNextInfraFiles', () => {
  const registry = defaultComponentRegistry;

  it('generates Next.js server files for a postgres-backed composite', () => {
    const dateRange = registry.createNode('visual.input.date-range', { id: 'dr1' });
    const table = registry.createNode('visual.table', { id: 't1' });
    const chart = registry.createNode('visual.chart.line', { id: 'c1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.next', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Sales Dashboard',
        version: 2,
        exportTargets: { ui: 'react', server: 'next', database: 'postgresql' },
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

    const files = generateNextInfraFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        '.env.example',
        'server/src/lib/database/pool.ts',
        'server/src/app/api/sales/route.ts',
        'README.export.server.md',
      ]),
    );

    const route = files.find((file) => file.path === 'server/src/app/api/sales/route.ts');
    expect(route?.content).toContain('export async function GET()');
    expect(route?.content).toContain("from '../../../lib/database/pool'");
    expect(route?.content).toContain("queryRows(createDataClient(), 'sales')");
    expect(route?.content).toContain('NextResponse.json');

    const pool = files.find((file) => file.path === 'server/src/lib/database/pool.ts');
    expect(pool?.content).toContain("process.env['DATABASE_URL']");

    const env = files.find((file) => file.path === '.env.example');
    expect(env?.content).toContain('DATABASE_URL=');
  });

  it('rejects non-next server targets', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Express only',
        version: 1,
        exportTargets: { ui: 'react', server: 'express' },
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

    expect(() => generateNextInfraFiles(ir)).toThrow(/cannot generate server target "express"/);
  });

  it('requires at least one database data source', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'No database',
        version: 1,
        exportTargets: { ui: 'react', server: 'next' },
        nodes: [registry.createNode('infra.server.next', { id: 's1' })],
        bindings: [],
      },
      registry,
    );

    expect(() => generateNextInfraFiles(ir)).toThrow(NextExportError);
    expect(() => generateNextInfraFiles(ir)).toThrow(/database data source/);
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
          exportTargets: { ui: 'react', server: 'next', database },
          nodes: [
            registry.createNode('visual.table', { id: 't1' }),
            dataSource,
            registry.createNode('infra.server.next', { id: 's1' }),
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
      'generates a %s-backed Next.js server',
      (nodeType, database, properties, expectedImport, expectedEnvKey) => {
        const files = generateNextInfraFiles(
          buildIrFor(nodeType, database, properties as Record<string, unknown>),
        );

        const pool = files.find((file) => file.path === 'server/src/lib/database/pool.ts');
        expect(pool?.content).toContain(expectedImport);
        expect(pool?.content).toContain(`process.env['${expectedEnvKey}']`);
        expect(pool?.content).toContain('export type DataClient');

        const route = files.find((file) => file.path.endsWith('/route.ts'));
        expect(route?.content).toContain("queryRows(createDataClient(), 'sales')");
        expect(route?.content).not.toContain("from 'pg'");
      },
    );
  });
});
