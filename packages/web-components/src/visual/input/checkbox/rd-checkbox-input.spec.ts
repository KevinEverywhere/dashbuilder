import { registerRdCheckboxInput, RD_CHECKBOX_INPUT_TAG, RdCheckboxInputElement } from './rd-checkbox-input.js';

describe('rd-checkbox-input', () => {
  beforeAll(() => {
    registerRdCheckboxInput();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_CHECKBOX_INPUT_TAG)).toBe(RdCheckboxInputElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_CHECKBOX_INPUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-input-checkbox"]') ? el : el.querySelector('[data-testid="rd-input-checkbox"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
