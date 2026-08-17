import { registerRdThreeScatterPlot, RD_THREE_SCATTER_PLOT_TAG, RdThreeScatterPlotElement } from './rd-three-scatter-plot.js';

describe('rd-three-scatter', () => {
  beforeAll(() => {
    registerRdThreeScatterPlot();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_THREE_SCATTER_PLOT_TAG)).toBe(RdThreeScatterPlotElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_THREE_SCATTER_PLOT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-display-3d-scatter"]') ? el : el.querySelector('[data-testid="rd-display-3d-scatter"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
