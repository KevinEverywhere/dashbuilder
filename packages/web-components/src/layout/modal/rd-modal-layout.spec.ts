import { registerRdModalLayout, RD_MODAL_LAYOUT_TAG, RdModalLayoutElement } from './rd-modal-layout.js';

describe('rd-modal-layout', () => {
  beforeAll(() => {
    registerRdModalLayout();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_MODAL_LAYOUT_TAG)).toBe(RdModalLayoutElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_MODAL_LAYOUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-modal"]') ? el : el.querySelector('[data-testid="rd-modal"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
