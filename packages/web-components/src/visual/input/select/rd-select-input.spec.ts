import { registerRdSelectInput, RD_SELECT_INPUT_TAG, RdSelectInputElement } from './rd-select-input.js';

describe('rd-select-input', () => {
  beforeAll(() => {
    registerRdSelectInput();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_SELECT_INPUT_TAG)).toBe(RdSelectInputElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_SELECT_INPUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-input-select"]') ? el : el.querySelector('[data-testid="rd-input-select"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
