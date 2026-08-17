import { registerRdPieChart, RD_PIE_CHART_TAG, RdPieChartElement } from './rd-pie-chart.js';

describe('rd-pie-chart', () => {
  beforeAll(() => {
    registerRdPieChart();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_PIE_CHART_TAG)).toBe(RdPieChartElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_PIE_CHART_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-chart-pie"]') ? el : el.querySelector('[data-testid="rd-chart-pie"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
