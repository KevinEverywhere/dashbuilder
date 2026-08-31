import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable.js';

describe('DataTable', () => {
  it('renders with taxonomy-aligned BEM root block', () => {
    render(<DataTable />);
    expect(screen.getByTestId('rd-table')).toBeTruthy();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLElement | null };
    render(<DataTable ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  it('renders custom column headers', () => {
    render(
      <DataTable
        rows={[{ id: '1', name: 'Lakers', status: 'Final', amount: '110-102', date: '8:00' }]}
        columns={[
          { key: 'name', header: 'Matchup' },
          { key: 'status', header: 'Status' },
          { key: 'amount', header: 'Score' },
          { key: 'date', header: 'When' },
        ]}
      />,
    );
    expect(screen.getByText('Matchup')).toBeTruthy();
    expect(screen.queryByText('Name')).toBeNull();
  });
});
