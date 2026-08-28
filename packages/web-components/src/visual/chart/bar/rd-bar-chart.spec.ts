import { registerRdBarChart, RD_BAR_CHART_TAG, RdBarChartElement } from './rd-bar-chart.js';

describe('rd-bar-chart', () => {
  beforeAll(() => {
    registerRdBarChart();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_BAR_CHART_TAG)).toBe(RdBarChartElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_BAR_CHART_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-chart-bar"]') ? el : el.querySelector('[data-testid="rd-chart-bar"]');
    expect(root).toBeTruthy();
    el.remove();
  });

  it('renders bar labels, values, and a y-axis', () => {
    const el = document.createElement(RD_BAR_CHART_TAG);
    el.setAttribute('bars', JSON.stringify([{ label: 'Tokyo', value: 15_800_000 }]));
    el.setAttribute('y-axis-label', 'Visitors');
    document.body.appendChild(el);
    expect(el.querySelector('.rd-chart-bar__x-label')?.textContent).toBe('Tokyo');
    expect(el.querySelector('.rd-chart-bar__value')?.textContent).toBe('15.8M');
    expect(el.querySelector('.rd-chart-bar__y-label')?.textContent).toBe('Visitors');
    el.remove();
  });
});
