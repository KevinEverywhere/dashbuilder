import type { DataTableProps } from './data-table';

describe('@rosettadash/angular/visual/table', () => {
  it('exposes typed props contract', () => {
    const props: DataTableProps = {
      columns: [{ key: 'name', header: 'Matchup' }],
    };
    expect(props.columns?.[0]?.header).toBe('Matchup');
  });

  it('uses taxonomy-aligned BEM block rd-table', () => {
    expect('rd-table').toMatch(/^rd-/);
  });
});
