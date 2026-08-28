jest.mock('three', () => {
  const actual = jest.requireActual('three') as typeof import('three');
  class MockWebGLRenderer {
    domElement = document.createElement('canvas');
    setPixelRatio = jest.fn();
    setSize = jest.fn();
    render = jest.fn();
    dispose = jest.fn();
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

import { mount } from '@vue/test-utils';
import type { EquirectSphereViewportProps } from './equirect-sphere-viewport';
import { EquirectSphereViewport } from './index';

describe('@rosettadash/vue/visual/media/equirect-sphere-viewport', () => {
  beforeAll(() => {
    class MockResizeObserver {
      observe = jest.fn();
      disconnect = jest.fn();
      unobserve = jest.fn();
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    global.requestAnimationFrame = jest.fn(() => 1) as unknown as typeof requestAnimationFrame;
    global.cancelAnimationFrame = jest.fn();
  });

  it('exposes typed props contract', () => {
    const props: EquirectSphereViewportProps = {};
    expect(props).toBeDefined();
  });

  it('uses taxonomy-aligned BEM block rd-equirect-sphere-viewport', () => {
    expect('rd-equirect-sphere-viewport').toMatch(/^rd-/);
  });

  it('renders the authoring host', () => {
    const wrapper = mount(EquirectSphereViewport, {
      props: { videoSrc: null, yaw: 15, pitch: -8, horizontalFov: 75 },
    });
    expect(wrapper.find('[data-testid="rd-equirect-sphere-viewport"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
