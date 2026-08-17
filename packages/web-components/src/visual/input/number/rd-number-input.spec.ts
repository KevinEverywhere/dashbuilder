import { registerRdNumberInput, RD_NUMBER_INPUT_TAG, RdNumberInputElement } from './rd-number-input.js';

describe('rd-number-input', () => {
  beforeAll(() => {
    registerRdNumberInput();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_NUMBER_INPUT_TAG)).toBe(RdNumberInputElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_NUMBER_INPUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-input-number"]') ? el : el.querySelector('[data-testid="rd-input-number"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
