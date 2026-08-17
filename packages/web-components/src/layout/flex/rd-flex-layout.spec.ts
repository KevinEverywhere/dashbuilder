import { registerRdFlexLayout, RD_FLEX_LAYOUT_TAG, RdFlexLayoutElement } from './rd-flex-layout.js';

describe('rd-flex-layout', () => {
  beforeAll(() => {
    registerRdFlexLayout();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_FLEX_LAYOUT_TAG)).toBe(RdFlexLayoutElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_FLEX_LAYOUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-flex"]') ? el : el.querySelector('[data-testid="rd-flex"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
