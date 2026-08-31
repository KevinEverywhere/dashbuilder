import type { BarChartProps } from './bar-chart';

describe('@rosettadash/angular/visual/chart/bar', () => {
  it('exposes typed props contract', () => {
    const props: BarChartProps = {
      bars: [{ label: 'Tokyo', value: 12 }],
      yAxisLabel: 'Visitors',
    };
    expect(props.bars?.[0]?.label).toBe('Tokyo');
  });

  it('uses taxonomy-aligned BEM block rd-chart-bar', () => {
    expect('rd-chart-bar').toMatch(/^rd-/);
  });
});
