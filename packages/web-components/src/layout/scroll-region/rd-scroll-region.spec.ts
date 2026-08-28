import { registerRdScrollRegion, RD_SCROLL_REGION_TAG, RdScrollRegionElement } from './rd-scroll-region.js';

describe('rd-scroll-region', () => {
  beforeAll(() => {
    registerRdScrollRegion();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_SCROLL_REGION_TAG)).toBe(RdScrollRegionElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_SCROLL_REGION_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-scroll-region"]') ? el : el.querySelector('[data-testid="rd-scroll-region"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
