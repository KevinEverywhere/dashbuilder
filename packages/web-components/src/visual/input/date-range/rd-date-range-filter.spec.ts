import { registerRdDateRangeFilter, RD_DATE_RANGE_FILTER_TAG, RdDateRangeFilterElement } from './rd-date-range-filter.js';

describe('rd-date-range', () => {
  beforeAll(() => {
    registerRdDateRangeFilter();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_DATE_RANGE_FILTER_TAG)).toBe(RdDateRangeFilterElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_DATE_RANGE_FILTER_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-input-date-range"]') ? el : el.querySelector('[data-testid="rd-input-date-range"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
