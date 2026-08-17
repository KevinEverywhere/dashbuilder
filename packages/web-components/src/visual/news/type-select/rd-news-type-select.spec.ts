import { registerRdNewsTypeSelect, RD_NEWS_TYPE_SELECT_TAG, RdNewsTypeSelectElement } from './rd-news-type-select.js';

describe('rd-news-type-select', () => {
  beforeAll(() => {
    registerRdNewsTypeSelect();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_NEWS_TYPE_SELECT_TAG)).toBe(RdNewsTypeSelectElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_NEWS_TYPE_SELECT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-news-type-select"]') ? el : el.querySelector('[data-testid="rd-news-type-select"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
