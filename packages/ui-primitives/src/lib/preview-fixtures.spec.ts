import {
  PREVIEW_CHART_POINTS,
  PREVIEW_TABLE_ROWS,
} from './preview-fixtures';

describe('preview fixtures', () => {
  it('loads table rows from preview-content.json', () => {
    expect(PREVIEW_TABLE_ROWS.length).toBeGreaterThan(0);
    expect(PREVIEW_TABLE_ROWS[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it('loads chart points from preview-content.json', () => {
    expect(PREVIEW_CHART_POINTS.length).toBeGreaterThan(0);
  });
});
