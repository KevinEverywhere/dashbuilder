import { registerRdNewsRegionSelect, RD_NEWS_REGION_SELECT_TAG, RdNewsRegionSelectElement } from './rd-news-region-select.js';

describe('rd-news-region-select', () => {
  beforeAll(() => {
    registerRdNewsRegionSelect();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_NEWS_REGION_SELECT_TAG)).toBe(RdNewsRegionSelectElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_NEWS_REGION_SELECT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-news-region-select"]') ? el : el.querySelector('[data-testid="rd-news-region-select"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
