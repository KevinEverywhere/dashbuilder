import { registerRdNewsArticleDetail, RD_NEWS_ARTICLE_DETAIL_TAG, RdNewsArticleDetailElement } from './rd-news-article-detail.js';

describe('rd-news-article-detail', () => {
  beforeAll(() => {
    registerRdNewsArticleDetail();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_NEWS_ARTICLE_DETAIL_TAG)).toBe(RdNewsArticleDetailElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_NEWS_ARTICLE_DETAIL_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-news-article-detail"]') ? el : el.querySelector('[data-testid="rd-news-article-detail"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
