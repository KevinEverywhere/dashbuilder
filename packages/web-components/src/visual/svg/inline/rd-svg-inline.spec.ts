import { registerRdSvgInline, RD_SVG_INLINE_TAG, RdSvgInlineElement } from './rd-svg-inline.js';

describe('rd-svg-inline', () => {
  beforeAll(() => {
    registerRdSvgInline();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_SVG_INLINE_TAG)).toBe(RdSvgInlineElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_SVG_INLINE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-svg-inline"]') ? el : el.querySelector('[data-testid="rd-svg-inline"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
