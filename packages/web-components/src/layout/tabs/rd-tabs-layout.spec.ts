import { registerRdTabsLayout, RD_TABS_LAYOUT_TAG, RdTabsLayoutElement } from './rd-tabs-layout.js';

describe('rd-tabs-layout', () => {
  beforeAll(() => {
    registerRdTabsLayout();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_TABS_LAYOUT_TAG)).toBe(RdTabsLayoutElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_TABS_LAYOUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-tabs"]') ? el : el.querySelector('[data-testid="rd-tabs"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
