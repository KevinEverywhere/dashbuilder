import { registerRdCollapsible, RD_COLLAPSIBLE_TAG, RdCollapsibleElement } from './rd-collapsible.js';

describe('rd-collapsible', () => {
  beforeAll(() => {
    registerRdCollapsible();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_COLLAPSIBLE_TAG)).toBe(RdCollapsibleElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_COLLAPSIBLE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-collapsible"]') ? el : el.querySelector('[data-testid="rd-collapsible"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
