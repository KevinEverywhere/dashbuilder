import { registerRdKpiCard, RD_KPI_CARD_TAG, RdKpiCardElement } from './rd-kpi-card.js';

describe('rd-kpi-card', () => {
  beforeAll(() => {
    registerRdKpiCard();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_KPI_CARD_TAG)).toBe(RdKpiCardElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_KPI_CARD_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-kpi"]') ? el : el.querySelector('[data-testid="rd-kpi"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
