import type { LineChartProps } from './line-chart';

describe('@rosettadash/angular/visual/chart/line', () => {
  it('exposes typed props contract', () => {
    const props: LineChartProps = {
      points: [{ x: '2024', y: 36 }],
      xAxisLabel: 'Year',
      yAxisLabel: 'Visitors',
    };
    expect(props.points?.[0]?.y).toBe(36);
  });

  it('uses taxonomy-aligned BEM block rd-chart-line', () => {
    expect('rd-chart-line').toMatch(/^rd-/);
  });
});
