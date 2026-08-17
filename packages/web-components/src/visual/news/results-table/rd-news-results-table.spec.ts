import { registerRdNewsResultsTable, RD_NEWS_RESULTS_TABLE_TAG, RdNewsResultsTableElement } from './rd-news-results-table.js';

describe('rd-news-results-table', () => {
  beforeAll(() => {
    registerRdNewsResultsTable();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_NEWS_RESULTS_TABLE_TAG)).toBe(RdNewsResultsTableElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_NEWS_RESULTS_TABLE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-news-results-table"]') ? el : el.querySelector('[data-testid="rd-news-results-table"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
