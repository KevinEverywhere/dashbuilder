import { registerRdThreeGeoGlobe, RD_THREE_GEO_GLOBE_TAG, RdThreeGeoGlobeElement } from './rd-three-geo-globe.js';

describe('rd-three-geo-globe', () => {
  beforeAll(() => {
    registerRdThreeGeoGlobe();
  });

  it('registers the custom element', () => {
    expect(customElements.get(RD_THREE_GEO_GLOBE_TAG)).toBe(RdThreeGeoGlobeElement);
  });

  it('renders taxonomy-aligned BEM root block', () => {
    const el = document.createElement(RD_THREE_GEO_GLOBE_TAG);
    document.body.appendChild(el);
    const root = el.matches('[data-testid="rd-display-3d-geo-globe"]') ? el : el.querySelector('[data-testid="rd-display-3d-geo-globe"]');
    expect(root).toBeTruthy();
    el.remove();
  });
});
