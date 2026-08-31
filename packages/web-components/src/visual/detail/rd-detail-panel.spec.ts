import { registerRdDetailPanel, RD_DETAIL_PANEL_TAG, RdDetailPanelElement } from './rd-detail-panel.js';

describe('rd-detail-panel', () => {
  beforeAll(() => {
    registerRdDetailPanel();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_DETAIL_PANEL_TAG)).toBe(RdDetailPanelElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_DETAIL_PANEL_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-detail"]') ? el : el.querySelector('[data-testid="rd-detail"]');
    expect(root).toBeTruthy();
    el.remove();
  });

  it('keeps empty copy outside the projected body slot', () => {
    const el = document.createElement(RD_DETAIL_PANEL_TAG);
    document.body.appendChild(el);
    const empty = el.querySelector('.rd-detail__empty');
    const body = el.querySelector('.rd-detail__body');
    expect(empty).toBeTruthy();
    expect(body).toBeTruthy();
    expect(body?.contains(empty)).toBe(false);
    el.remove();
  });
});
