import { mount } from '@vue/test-utils';
import { RD_THREE_GEO_GLOBE_TAG } from '@rosettadash/web-components/visual/display/3d-geo-globe';
import { ThreeGeoGlobe } from './index';

describe('@rosettadash/vue/visual/display/3d-geo-globe', () => {
  it('renders and registers the WC host', () => {
    const wrapper = mount(ThreeGeoGlobe, {
      props: {
        title: 'Destination globe',
        textureUrl: '/world.jpg',
        selectedId: 'tokyo',
      },
    });

    const host = wrapper.find(RD_THREE_GEO_GLOBE_TAG);
    expect(host.exists()).toBe(true);
    expect(host.attributes('title')).toBe('Destination globe');
    expect(host.attributes('texture-url')).toBe('/world.jpg');
    expect(host.attributes('selected-id')).toBe('tokyo');
    expect(customElements.get(RD_THREE_GEO_GLOBE_TAG)).toBeTruthy();
  });
});
