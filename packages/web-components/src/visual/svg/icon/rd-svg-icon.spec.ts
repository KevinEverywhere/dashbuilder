import { registerRdSvgIcon, RD_SVG_ICON_TAG, RdSvgIconElement } from './rd-svg-icon.js';

describe('rd-svg-icon', () => {
  beforeAll(() => {
    registerRdSvgIcon();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_SVG_ICON_TAG)).toBe(RdSvgIconElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_SVG_ICON_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-svg-icon"]') ? el : el.querySelector('[data-testid="rd-svg-icon"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
