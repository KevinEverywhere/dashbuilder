import { registerRdGridLayout, RD_GRID_LAYOUT_TAG, RdGridLayoutElement } from './rd-grid-layout.js';

describe('rd-grid-layout', () => {
  beforeAll(() => {
    registerRdGridLayout();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_GRID_LAYOUT_TAG)).toBe(RdGridLayoutElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_GRID_LAYOUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-grid"]') ? el : el.querySelector('[data-testid="rd-grid"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
