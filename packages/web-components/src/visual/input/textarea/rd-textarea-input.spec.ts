import { registerRdTextareaInput, RD_TEXTAREA_INPUT_TAG, RdTextareaInputElement } from './rd-textarea-input.js';

describe('rd-textarea-input', () => {
  beforeAll(() => {
    registerRdTextareaInput();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_TEXTAREA_INPUT_TAG)).toBe(RdTextareaInputElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_TEXTAREA_INPUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-input-textarea"]') ? el : el.querySelector('[data-testid="rd-input-textarea"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
