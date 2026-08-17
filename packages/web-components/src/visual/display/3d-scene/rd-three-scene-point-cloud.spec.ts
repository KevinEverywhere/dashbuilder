import { registerRdThreeScenePointCloud, RD_THREE_SCENE_POINT_CLOUD_TAG, RdThreeScenePointCloudElement } from './rd-three-scene-point-cloud.js';

describe('rd-three-scene', () => {
  beforeAll(() => {
    registerRdThreeScenePointCloud();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_THREE_SCENE_POINT_CLOUD_TAG)).toBe(RdThreeScenePointCloudElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_THREE_SCENE_POINT_CLOUD_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-display-3d-scene"]') ? el : el.querySelector('[data-testid="rd-display-3d-scene"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
