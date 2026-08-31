import { PreviewService } from './preview.service';

describe('PreviewService', () => {
  let service: PreviewService;

  beforeEach(() => {
    service = new PreviewService();
  });

  it('generates preview content from preview-content.json', () => {
    const data = service.generatePreviewContent({
      projectName: 'Revenue Ops',
      compositeName: 'Dashboard',
      dateRangePreset: 'last-30-days',
    });

    expect(data.tableRows.length).toBeGreaterThan(0);
    expect(data.chartPoints.length).toBeGreaterThan(0);
    expect(data.selectOptions.some((option) => option.label.includes('Revenue Ops'))).toBe(
      true,
    );
    expect(data.dateRangeLabel).toBe('Last 30 days');
  });

  it('returns deterministic output for the same request', () => {
    const request = {
      projectName: 'Alpha',
      compositeName: 'Main',
    };
    expect(service.generatePreviewContent(request)).toEqual(
      service.generatePreviewContent(request),
    );
  });
});
