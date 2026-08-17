import { registerRdWasmWorkerHost, RD_WASM_WORKER_HOST_TAG, RdWasmWorkerHostElement } from './rd-wasm-worker-host.js';

describe('rd-wasm-worker-host', () => {
  beforeAll(() => {
    registerRdWasmWorkerHost();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_WASM_WORKER_HOST_TAG)).toBe(RdWasmWorkerHostElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_WASM_WORKER_HOST_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-wasm-worker-host"]') ? el : el.querySelector('[data-testid="rd-wasm-worker-host"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
