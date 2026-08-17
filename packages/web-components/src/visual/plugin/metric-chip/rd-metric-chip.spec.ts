import { registerRdMetricChip, RD_METRIC_CHIP_TAG, RdMetricChipElement } from './rd-metric-chip.js';

describe('rd-metric-chip', () => {
  beforeAll(() => {
    registerRdMetricChip();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_METRIC_CHIP_TAG)).toBe(RdMetricChipElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_METRIC_CHIP_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-plugin-metric-chip"]') ? el : el.querySelector('[data-testid="rd-plugin-metric-chip"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
