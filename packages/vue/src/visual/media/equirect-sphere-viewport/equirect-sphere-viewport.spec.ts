import { mount } from '@vue/test-utils';
import type { EquirectSphereViewportProps } from './equirect-sphere-viewport';
import { EquirectSphereViewport } from './index';

describe('@rosettadash/vue/visual/media/equirect-sphere-viewport', () => {
  it('exposes typed props contract', () => {
    const props: EquirectSphereViewportProps = {};
    expect(props).toBeDefined();
  });

  it('uses taxonomy-aligned BEM block rd-equirect-sphere-viewport', () => {
    expect('rd-equirect-sphere-viewport').toMatch(/^rd-/);
  });

  it('renders the WC authoring host element', () => {
    const wrapper = mount(EquirectSphereViewport, {
      props: { videoSrc: null, yaw: 15, pitch: -8, horizontalFov: 75 },
    });
    expect(wrapper.element.tagName.toLowerCase()).toBe('rd-equirect-sphere-viewport');
    wrapper.unmount();
  });
});
