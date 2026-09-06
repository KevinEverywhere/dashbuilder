import { buildExportIR, buildOnboardingComposite, defaultComponentRegistry } from '@rosettadash/core';
import { generateNestInfraFiles } from './generate-nest-infra';
import { NestExportError } from './types';

describe('generateNestInfraFiles', () => {
  const registry = defaultComponentRegistry;

  it('generates NestJS server files for a postgres-backed composite', () => {
    const dateRange = registry.createNode('visual.input.date-range', { id: 'dr1' });
    const table = registry.createNode('visual.table', { id: 't1' });
    const chart = registry.createNode('visual.chart.line', { id: 'c1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Sales Dashboard',
        version: 2,
        exportTargets: { ui: 'react', server: 'nest', database: 'postgresql' },
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

    const files = generateNestInfraFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        '.env.example',
        'server/src/main.ts',
        'server/src/app.module.ts',
        'server/src/database/database.module.ts',
        'server/src/database/database.service.ts',
        'server/src/sales/sales.controller.ts',
        'server/src/sales/sales.module.ts',
        'README.export.server.md',
      ]),
    );

    const controller = files.find((file) => file.path === 'server/src/sales/sales.controller.ts');
    expect(controller?.content).toContain("@Controller('sales')");
    expect(controller?.content).toContain("queryRows('sales')");

    const dataClient = files.find((file) => file.path === 'server/src/database/data-client.ts');
    expect(dataClient?.content).toContain("process.env['DATABASE_URL']");
    expect(dataClient?.content).toContain("import { Pool } from 'pg';");

    // The injectable stays engine-agnostic and delegates to the data client.
    const service = files.find(
      (file) => file.path === 'server/src/database/database.service.ts',
    );
    expect(service?.content).toContain("from './data-client'");
    expect(service?.content).not.toContain("from 'pg'");

    const env = files.find((file) => file.path === '.env.example');
    expect(env?.content).toContain('DATABASE_URL=');
  });

  it('rejects non-nest server targets', () => {
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

    expect(() => generateNestInfraFiles(ir)).toThrow(/cannot generate server target "express"/);
  });

  it('requires at least one database data source', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'No database',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [registry.createNode('infra.server.nest', { id: 's1' })],
        bindings: [],
      },
      registry,
    );

    expect(() => generateNestInfraFiles(ir)).toThrow(NestExportError);
    expect(() => generateNestInfraFiles(ir)).toThrow(/database data source/);
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
          exportTargets: { ui: 'angular', server: 'nest', database },
          nodes: [
            registry.createNode('visual.table', { id: 't1' }),
            dataSource,
            registry.createNode('infra.server.nest', { id: 's1' }),
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
      'generates a %s-backed NestJS server',
      (nodeType, database, properties, expectedImport, expectedEnvKey) => {
        const files = generateNestInfraFiles(
          buildIrFor(nodeType, database, properties as Record<string, unknown>),
        );

        const dataClient = files.find(
          (file) => file.path === 'server/src/database/data-client.ts',
        );
        expect(dataClient?.content).toContain(expectedImport);
        expect(dataClient?.content).toContain(`process.env['${expectedEnvKey}']`);
        expect(dataClient?.content).toContain('export type DataClient');

        const controller = files.find(
          (file) => file.path === 'server/src/sales/sales.controller.ts',
        );
        expect(controller?.content).toContain("this.database.queryRows('sales')");
      },
    );
  });

  it('generates role guard stubs when role gates are present', () => {
    const roleGate = registry.createNode('domain.role-gate', {
      id: 'rg1',
      properties: { roles: ['admin'] },
    });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Role Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest', database: 'postgresql' },
        nodes: [roleGate, postgres, server],
        bindings: [],
        domainContext: {
          roles: [
            { id: 'admin', name: 'Admin' },
            { id: 'viewer', name: 'Viewer' },
          ],
        },
      },
      registry,
    );

    const files = generateNestInfraFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'server/src/auth/roles.guard.ts',
        'server/src/auth/roles.decorator.ts',
        'server/src/auth/auth.module.ts',
      ]),
    );

    const controller = files.find((file) => file.path === 'server/src/sales/sales.controller.ts');
    expect(controller?.content).toContain('@UseGuards(RolesGuard)');
    expect(controller?.content).toContain("@Roles('admin', 'viewer')");
  });

  it('generates scoped postgres queries when domain context is present', () => {
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Scoped Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest', database: 'postgresql' },
        nodes: [postgres, server],
        bindings: [],
        domainContext: {
          client: { id: 'acme', name: 'Acme Corp' },
          project: { id: 'rev-ops', name: 'Revenue Ops' },
          defaultTimeRange: 'last-7-days',
        },
      },
      registry,
      { generatedAt: '2026-08-08T00:00:00.000Z' },
    );

    const files = generateNestInfraFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toContain('server/src/domain/scope.ts');

    const database = files.find((file) => file.path === 'server/src/database/data-client.ts');
    expect(database?.content).toContain('resolveRuntimeScope');
    expect(database?.content).toContain('client_id');
    expect(database?.content).toContain('created_at >=');

    const env = files.find((file) => file.path === '.env.example');
    expect(env?.content).toContain('ROSETTADASH_CLIENT_ID=');
  });

  it('generates onboarding route stubs for onboarding composites', () => {
    const composite = buildOnboardingComposite(registry, { id: 'comp1', version: 1 });
    const ir = buildExportIR(composite, registry, { generatedAt: '2026-08-08T00:00:00.000Z' });
    const files = generateNestInfraFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'server/src/onboarding/onboarding.controller.ts',
        'server/src/onboarding/onboarding.module.ts',
      ]),
    );

    const controller = files.find((file) => file.path === 'server/src/onboarding/onboarding.controller.ts');
    expect(controller?.content).toContain("@Post('invite')");
    expect(controller?.content).toContain("@Patch('role')");

    const appModule = files.find((file) => file.path === 'server/src/app.module.ts');
    expect(appModule?.content).toContain('OnboardingModule');
  });
});
