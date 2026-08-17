import { registerRdNewsLanguageSelect, RD_NEWS_LANGUAGE_SELECT_TAG, RdNewsLanguageSelectElement } from './rd-news-language-select.js';

describe('rd-news-language-select', () => {
  beforeAll(() => {
    registerRdNewsLanguageSelect();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_NEWS_LANGUAGE_SELECT_TAG)).toBe(RdNewsLanguageSelectElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_NEWS_LANGUAGE_SELECT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-news-language-select"]') ? el : el.querySelector('[data-testid="rd-news-language-select"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
