import { registerRdNewsSearchBox, RD_NEWS_SEARCH_BOX_TAG, RdNewsSearchBoxElement } from './rd-news-search-box.js';

describe('rd-news-search-box', () => {
  beforeAll(() => {
    registerRdNewsSearchBox();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_NEWS_SEARCH_BOX_TAG)).toBe(RdNewsSearchBoxElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_NEWS_SEARCH_BOX_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-news-search-box"]') ? el : el.querySelector('[data-testid="rd-news-search-box"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
