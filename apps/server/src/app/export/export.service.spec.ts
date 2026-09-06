import { ExportBuildError, defaultComponentRegistry } from '@rosettadash/core';
import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  it('returns ExportIR for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', { id: 'pg1' });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });

    const ir = service.buildIr({
      id: 'c1',
      name: 'Export me',
      version: 1,
      nodes: [pg, table],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(ir.meta.compositeName).toBe('Export me');
    expect(ir.events).toHaveLength(1);
  });

  it('returns generated React files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', { id: 'pg1' });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });

    const result = service.buildReactExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest' },
      nodes: [pg, table],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(true);
    expect(result.files.some((file) => file.path.startsWith('src/components/'))).toBe(true);
  });

  it('returns generated Angular files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', { id: 'pg1' });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });

    const result = service.buildAngularExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'angular', server: 'nest' },
      nodes: [pg, table],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'src/dashboard.component.ts')).toBe(true);
    expect(result.files.some((file) => file.path.startsWith('src/components/'))).toBe(true);
  });

  it('returns generated Vue files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', { id: 'pg1' });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });

    const result = service.buildVueExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'vue', server: 'nest' },
      nodes: [pg, table],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'src/Dashboard.vue')).toBe(true);
    expect(result.files.some((file) => file.path.endsWith('.vue'))).toBe(true);
  });

  it('returns generated Svelte files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', { id: 'pg1' });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });

    const result = service.buildSvelteExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'svelte', server: 'nest' },
      nodes: [pg, table],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'src/Dashboard.svelte')).toBe(true);
    expect(result.files.some((file) => file.path.endsWith('.svelte'))).toBe(true);
  });

  it('returns generated NestJS files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildNestExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/src/sales/sales.controller.ts')).toBe(
      true,
    );
  });

  it('returns generated Express files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.express', { id: 's1' });

    const result = service.buildExpressExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'express', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'server/src/index.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/src/routes/sales.ts')).toBe(true);
  });

  it('returns generated Next.js files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.next', { id: 's1' });

    const result = service.buildNextExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'next', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'server/src/lib/database/pool.ts')).toBe(
      true,
    );
    expect(result.files.some((file) => file.path === 'server/src/app/api/sales/route.ts')).toBe(
      true,
    );
  });

  it('returns generated Nuxt files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nuxt', { id: 's1' });

    const result = service.buildNuxtExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nuxt', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'server/utils/database.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/api/sales.get.ts')).toBe(true);
  });

  it('returns generated MongoDB files for a valid composite', () => {
    const mongo = defaultComponentRegistry.createNode('infra.mongodb', {
      id: 'mg1',
      properties: { connectionEnvKey: 'MONGODB_URI', collection: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildMongoExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'mongodb' },
      nodes: [mongo, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'mg1',
          sourcePortId: 'documents',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'database/src/mongo.client.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'database/src/collections/sales.ts')).toBe(
      true,
    );
  });

  it('returns generated Supabase files for a valid composite', () => {
    const supabase = defaultComponentRegistry.createNode('infra.supabase', {
      id: 'sb1',
      properties: { urlEnvKey: 'SUPABASE_URL', anonKeyEnvKey: 'SUPABASE_ANON_KEY', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildSupabaseExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'supabase' },
      nodes: [supabase, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'sb1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'database/src/supabase.client.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'database/src/tables/sales.ts')).toBe(true);
  });

  it('returns generated MySQL files for a valid composite', () => {
    const mysql = defaultComponentRegistry.createNode('infra.mysql', {
      id: 'my1',
      properties: { connectionEnvKey: 'MYSQL_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildMysqlExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'mysql' },
      nodes: [mysql, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'my1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.ir.meta.compositeName).toBe('Export me');
    expect(result.files.some((file) => file.path === 'database/src/mysql.pool.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'database/src/tables/sales.ts')).toBe(true);
  });

  it('returns combined React and NestJS files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(true);
    expect(result.files.length).toBeGreaterThan(10);
  });

  it('returns UI-only bundle files for a visual-only scoped composite', () => {
    const kpi = defaultComponentRegistry.createNode('visual.kpi', { id: 'kpi1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'KPI only',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'postgresql' },
      nodes: [kpi],
      bindings: [],
    });

    expect(result.files.some((file) => file.path === 'src/KpiOnly.tsx')).toBe(true);
    expect(result.files.some((file) => file.path.includes('KpiCard'))).toBe(true);
    // A visual-only composite has no data source, so no server layer.
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(false);
    expect(result.files.some((file) => file.path.includes('DataTable'))).toBe(false);
  });

  it('returns combined Angular and NestJS files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'angular', server: 'nest', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.files.some((file) => file.path === 'src/dashboard.component.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(false);
  });

  it('returns combined Vue and NestJS files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'vue', server: 'nest', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.files.some((file) => file.path === 'src/Dashboard.vue')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(false);
  });

  it('returns combined Svelte and NestJS files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'svelte', server: 'nest', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.files.some((file) => file.path === 'src/Dashboard.svelte')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(true);
    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(false);
  });

  it('returns combined React and Express files for a valid composite', () => {
    const pg = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'express', database: 'postgresql' },
      nodes: [pg, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(true);
    expect(result.files.some((file) => file.path === 'server/src/index.ts')).toBe(true);
    // Express emits index.ts; main.ts is Nest's entry point.
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(false);
  });

  it('returns combined React and MongoDB database files for a valid composite', () => {
    const mongo = defaultComponentRegistry.createNode('infra.mongodb', {
      id: 'mg1',
      properties: { connectionEnvKey: 'MONGODB_URI', collection: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'mongodb' },
      nodes: [mongo, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'mg1',
          sourcePortId: 'documents',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(true);
    expect(result.files.some((file) => file.path === 'database/src/mongo.client.ts')).toBe(true);
    // DAS-185: the server layer is emitted alongside the database layer.
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(true);
  });

  it('returns combined React and Supabase database files for a valid composite', () => {
    const supabase = defaultComponentRegistry.createNode('infra.supabase', {
      id: 'sb1',
      properties: { urlEnvKey: 'SUPABASE_URL', anonKeyEnvKey: 'SUPABASE_ANON_KEY', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'supabase' },
      nodes: [supabase, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'sb1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(true);
    expect(result.files.some((file) => file.path === 'database/src/supabase.client.ts')).toBe(true);
    // DAS-185: the server layer is emitted alongside the database layer.
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(true);
  });

  it('returns combined React and MySQL database files for a valid composite', () => {
    const mysql = defaultComponentRegistry.createNode('infra.mysql', {
      id: 'my1',
      properties: { connectionEnvKey: 'MYSQL_URL', table: 'sales' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const server = defaultComponentRegistry.createNode('infra.server.nest', { id: 's1' });

    const result = service.buildBundleExport({
      id: 'c1',
      name: 'Export me',
      version: 1,
      exportTargets: { ui: 'react', server: 'nest', database: 'mysql' },
      nodes: [mysql, table, server],
      bindings: [
        {
          id: 'b1',
          sourceNodeId: 'my1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
    });

    expect(result.files.some((file) => file.path === 'src/ExportMe.tsx')).toBe(true);
    expect(result.files.some((file) => file.path === 'database/src/mysql.pool.ts')).toBe(true);
    // DAS-185: the server layer is emitted alongside the database layer.
    expect(result.files.some((file) => file.path === 'server/src/main.ts')).toBe(true);
  });

  it('throws ExportBuildError for invalid composites', () => {
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });

    expect(() =>
      service.buildIr({
        id: 'c1',
        name: 'Broken',
        version: 1,
        nodes: [table],
        bindings: [],
      }),
    ).toThrow(ExportBuildError);
  });
});
