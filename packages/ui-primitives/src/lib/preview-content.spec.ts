import { flattenPreviewContent, parsePreviewContentDocument } from './preview-content';

describe('preview content document', () => {
  it('parses structured sources and datasets', () => {
    const document = parsePreviewContentDocument({
      version: 1,
      sources: {
        orders: {
          kind: 'rowset',
          label: 'Orders',
          table: 'orders',
          connectionEnvKey: 'DATABASE_URL',
        },
      },
      datasets: {
        orders: {
          rows: [
            { id: '1', name: 'Globex LLC', status: 'Active', amount: 100, date: '2026-08-07' },
          ],
        },
        filters: { selectOptions: [], dateRangeLabel: 'Last 7 days' },
      },
    });

    expect(document.sources.orders?.table).toBe('orders');
    expect(flattenPreviewContent(document).tableRows[0]?.name).toBe('Globex LLC');
  });

  it('imports legacy flat JSON into the content structure', () => {
    const document = parsePreviewContentDocument({
      tableRows: [{ id: '1', name: 'Legacy Co', status: 'Active', amount: 1, date: '2026-08-07' }],
      newsRows: [],
      chartPoints: [],
      selectOptions: [],
      kpiValue: 1,
      kpiDelta: 1,
      dateRangeLabel: 'Last 7 days',
    });

    expect(document.datasets.orders?.rows[0]?.name).toBe('Legacy Co');
  });
});
