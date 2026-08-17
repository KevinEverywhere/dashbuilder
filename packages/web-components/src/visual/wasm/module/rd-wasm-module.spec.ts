import { registerRdWasmModule, RD_WASM_MODULE_TAG, RdWasmModuleElement } from './rd-wasm-module.js';

describe('rd-wasm-module', () => {
  beforeAll(() => {
    registerRdWasmModule();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_WASM_MODULE_TAG)).toBe(RdWasmModuleElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_WASM_MODULE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-wasm-module"]') ? el : el.querySelector('[data-testid="rd-wasm-module"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
