import { registerRdThreeGltfModel, RD_THREE_GLTF_MODEL_TAG, RdThreeGltfModelElement } from './rd-three-gltf-model.js';

describe('rd-three-gltf-model', () => {
  beforeAll(() => {
    registerRdThreeGltfModel();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_THREE_GLTF_MODEL_TAG)).toBe(RdThreeGltfModelElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_THREE_GLTF_MODEL_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-display-3d-gltf-model"]') ? el : el.querySelector('[data-testid="rd-display-3d-gltf-model"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
