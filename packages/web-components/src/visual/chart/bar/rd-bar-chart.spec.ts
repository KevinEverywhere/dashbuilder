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
});
