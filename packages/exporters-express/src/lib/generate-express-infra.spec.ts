import { buildExportIR, defaultComponentRegistry } from '@rosettadash/core';
import { generateExpressInfraFiles } from './generate-express-infra';
import { ExpressExportError } from './types';

describe('generateExpressInfraFiles', () => {
  const registry = defaultComponentRegistry;

  it('generates Express server files for a postgres-backed composite', () => {
    const dateRange = registry.createNode('visual.input.date-range', { id: 'dr1' });
    const table = registry.createNode('visual.table', { id: 't1' });
    const chart = registry.createNode('visual.chart.line', { id: 'c1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.express', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Sales Dashboard',
        version: 2,
        exportTargets: { ui: 'react', server: 'express', database: 'postgresql' },
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

    const files = generateExpressInfraFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        '.env.example',
        'server/src/index.ts',
        'server/src/database/pool.ts',
        'server/src/routes/sales.ts',
        'README.export.server.md',
      ]),
    );

    const route = files.find((file) => file.path === 'server/src/routes/sales.ts');
    expect(route?.content).toContain('createSalesRouter');
    expect(route?.content).toContain("queryRows(client, 'sales')");

    const index = files.find((file) => file.path === 'server/src/index.ts');
    expect(index?.content).toContain("app.use('/api/sales', createSalesRouter(client))");

    const pool = files.find((file) => file.path === 'server/src/database/pool.ts');
    expect(pool?.content).toContain("process.env['DATABASE_URL']");
    expect(pool?.content).toContain("import { Pool } from 'pg';");

    const env = files.find((file) => file.path === '.env.example');
    expect(env?.content).toContain('DATABASE_URL=');
  });

  it('rejects non-express server targets', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Nest only',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
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

    expect(() => generateExpressInfraFiles(ir)).toThrow(/cannot generate server target "nest"/);
  });

  it('requires at least one database data source', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'No database',
        version: 1,
        exportTargets: { ui: 'react', server: 'express' },
        nodes: [registry.createNode('infra.server.express', { id: 's1' })],
        bindings: [],
      },
      registry,
    );

    expect(() => generateExpressInfraFiles(ir)).toThrow(ExpressExportError);
    expect(() => generateExpressInfraFiles(ir)).toThrow(/database data source/);
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
          exportTargets: { ui: 'react', server: 'express', database },
          nodes: [
            registry.createNode('visual.table', { id: 't1' }),
            dataSource,
            registry.createNode('infra.server.express', { id: 's1' }),
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

    it('generates a MySQL-backed Express server', () => {
      const ir = buildIrFor('infra.mysql', 'mysql', {
        connectionEnvKey: 'MYSQL_URL',
        table: 'sales',
      });
      const files = generateExpressInfraFiles(ir);

      const pool = files.find((file) => file.path === 'server/src/database/pool.ts');
      expect(pool?.content).toContain("from 'mysql2/promise'");
      expect(pool?.content).toContain("process.env['MYSQL_URL']");
      expect(pool?.content).toContain('export type DataClient');

      const route = files.find((file) => file.path === 'server/src/routes/sales.ts');
      expect(route?.content).toContain("queryRows(client, 'sales')");
      // The route must not import a driver package directly.
      expect(route?.content).not.toContain("from 'pg'");
    });

    it('generates a MongoDB-backed Express server', () => {
      const ir = buildIrFor('infra.mongodb', 'mongodb', {
        connectionEnvKey: 'MONGODB_URI',
        collection: 'sales',
      });
      const files = generateExpressInfraFiles(ir);

      const pool = files.find((file) => file.path === 'server/src/database/pool.ts');
      expect(pool?.content).toContain("import { MongoClient } from 'mongodb';");
      expect(pool?.content).toContain("process.env['MONGODB_URI']");

      const route = files.find((file) => file.path === 'server/src/routes/sales.ts');
      expect(route?.content).toContain("queryRows(client, 'sales')");
    });

    it('generates a Supabase-backed Express server', () => {
      const ir = buildIrFor('infra.supabase', 'supabase', {
        urlEnvKey: 'SUPABASE_URL',
        anonKeyEnvKey: 'SUPABASE_ANON_KEY',
        table: 'sales',
      });
      const files = generateExpressInfraFiles(ir);

      const pool = files.find((file) => file.path === 'server/src/database/pool.ts');
      expect(pool?.content).toContain("from '@supabase/supabase-js'");
      expect(pool?.content).toContain("process.env['SUPABASE_URL']");
      expect(pool?.content).toContain("process.env['SUPABASE_ANON_KEY']");

      const readme = files.find((file) => file.path === 'README.export.server.md');
      expect(readme?.content).toContain('@supabase/supabase-js');
    });
  });
});
