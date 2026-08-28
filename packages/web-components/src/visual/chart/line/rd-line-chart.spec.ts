import { registerRdLineChart, RD_LINE_CHART_TAG, RdLineChartElement } from './rd-line-chart.js';

describe('rd-line-chart', () => {
  beforeAll(() => {
    registerRdLineChart();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_LINE_CHART_TAG)).toBe(RdLineChartElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_LINE_CHART_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-chart-line"]') ? el : el.querySelector('[data-testid="rd-chart-line"]');
    expect(root).toBeTruthy();
    el.remove();
  });

  it('draws a polyline from the points attribute', () => {
    const el = document.createElement(RD_LINE_CHART_TAG);
    el.setAttribute('points', JSON.stringify([{ x: 'a', y: 10 }, { x: 'b', y: 90 }]));
    document.body.appendChild(el);
    const polyline = el.querySelector('polyline');
    expect(polyline?.getAttribute('points')).toContain('0,');
    expect(polyline?.getAttribute('points')).toContain('240,');
    el.remove();
  });
});
