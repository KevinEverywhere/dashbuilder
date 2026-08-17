import { registerRdThreeBarChart, RD_THREE_BAR_CHART_TAG, RdThreeBarChartElement } from './rd-three-bar-chart.js';

describe('rd-three-bar-chart', () => {
  beforeAll(() => {
    registerRdThreeBarChart();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_THREE_BAR_CHART_TAG)).toBe(RdThreeBarChartElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_THREE_BAR_CHART_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-display-3d-bar-chart"]') ? el : el.querySelector('[data-testid="rd-display-3d-bar-chart"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
