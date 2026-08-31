import { defaultComponentRegistry } from '../registry/component-registry';
import { resolveDataWiring } from './resolve-data-wiring';

describe('resolveDataWiring', () => {
  it('reports unwired when data port has no binding', () => {
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const report = resolveDataWiring([table], [], defaultComponentRegistry, 't1');
    expect(report?.status).toBe('unwired');
    expect(report?.issues.some((issue) => issue.code === 'UNBOUND_DATA_PORT')).toBe(true);
  });

  it('reports ready when postgres rowset is bound and table is set', () => {
    const postgres = defaultComponentRegistry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'records' },
    });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const report = resolveDataWiring(
      [postgres, table],
      [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
      defaultComponentRegistry,
      't1',
    );
    expect(report?.status).toBe('ready');
    expect(report?.connectionEnvKey).toBe('DATABASE_URL');
    expect(report?.tableName).toBe('records');
    expect(report?.chain).toEqual([
      'PostgreSQL.rowset (rowset)',
      '→ Data Table.data (rowset)',
    ]);
  });

  it('reports incomplete when postgres table name is missing', () => {
    const postgres = defaultComponentRegistry.createNode('infra.postgresql', { id: 'pg1' });
    const table = defaultComponentRegistry.createNode('visual.table', { id: 't1' });
    const report = resolveDataWiring(
      [postgres, table],
      [
        {
          id: 'b1',
          sourceNodeId: 'pg1',
          sourcePortId: 'rowset',
          targetNodeId: 't1',
          targetPortId: 'data',
        },
      ],
      defaultComponentRegistry,
      't1',
    );
    expect(report?.status).toBe('incomplete');
    expect(report?.issues.some((issue) => issue.code === 'MISSING_TABLE')).toBe(true);
  });
});
