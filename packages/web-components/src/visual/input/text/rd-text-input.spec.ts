import { registerRdTextInput, RD_TEXT_INPUT_TAG, RdTextInputElement } from './rd-text-input.js';

describe('rd-text-input', () => {
  beforeAll(() => {
    registerRdTextInput();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_TEXT_INPUT_TAG)).toBe(RdTextInputElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_TEXT_INPUT_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-input-text"]') ? el : el.querySelector('[data-testid="rd-input-text"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
