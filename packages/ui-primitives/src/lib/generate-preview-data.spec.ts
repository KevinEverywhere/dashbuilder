import { generatePreviewData } from './generate-preview-data';

describe('generatePreviewData', () => {
  it('returns deterministic data for the same inputs', () => {
    const first = generatePreviewData({
      projectName: 'Sales',
      compositeName: 'Overview',
      dateRangePreset: 'last-7-days',
    });
    const second = generatePreviewData({
      projectName: 'Sales',
      compositeName: 'Overview',
      dateRangePreset: 'last-7-days',
    });

    expect(second).toEqual(first);
  });

  it('varies select options when project name changes', () => {
    const changed = generatePreviewData({
      projectName: 'Marketing',
      compositeName: 'Overview',
    });

    expect(
      changed.selectOptions.some((option) => option.label.includes('Marketing')),
    ).toBe(true);
  });

  it('uses domain context in preview row labels and select options', () => {
    const scoped = generatePreviewData({
      projectName: 'Sales',
      compositeName: 'Overview',
      domainContext: {
        client: { id: 'acme', name: 'Acme Corp' },
        project: { id: 'rev', name: 'Revenue Ops' },
        defaultTimeRange: 'last-30-days',
      },
    });

    expect(scoped.tableRows[0]?.name).toContain('Acme Corp');
    expect(scoped.selectOptions.some((option) => option.label.includes('Revenue Ops'))).toBe(
      true,
    );
  });
});
