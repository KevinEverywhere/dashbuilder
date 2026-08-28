import { mount } from '@vue/test-utils';
import { FlatVideoViewport } from './index';

describe('@rosettadash/vue/visual/media/flat-video-viewport', () => {
  it('renders the authoring host', () => {
    const wrapper = mount(FlatVideoViewport, {
      props: {
        sourceWidth: 1280,
        sourceHeight: 720,
        cropX: 0,
        cropY: 0,
        cropWidth: 640,
        cropHeight: 360,
      },
    });
    expect(wrapper.find('[data-testid="rd-flat-video-viewport"]').exists()).toBe(true);
  });
});
