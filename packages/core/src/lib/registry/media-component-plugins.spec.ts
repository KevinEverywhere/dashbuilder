import { defaultComponentRegistry } from './component-registry';
import { MEDIA_COMPONENT_PLUGINS } from './media-component-plugins';

describe('media component plugins', () => {
  it('registers media authoring palette plugins', () => {
    for (const plugin of MEDIA_COMPONENT_PLUGINS) {
      const registered = defaultComponentRegistry.get(plugin.definition.type);
      expect(registered?.label).toBe(plugin.definition.label);
      expect(plugin.metadata.paletteGroupId).toBe('media-authoring');
    }
  });

  it('defaults equirect viewport to 4096×2048 → 1080×720 → 720×480', () => {
    const viewport = defaultComponentRegistry.get('visual.media.equirect-viewport');
    expect(viewport?.properties.find((p) => p.key === 'cropWidth')?.default).toBe(1080);
    expect(viewport?.properties.find((p) => p.key === 'outputWidth')?.default).toBe(720);
  });

  it('exposes page display size for video source (not equirect source dimensions)', () => {
    const videoSource = defaultComponentRegistry.get('visual.media.video-source');
    expect(videoSource?.properties.find((p) => p.key === 'displaySize')?.default).toBe('640x360');
    expect(videoSource?.properties.find((p) => p.key === 'fullscreen')?.default).toBe(false);
    expect(videoSource?.properties.some((p) => p.key === 'sourceWidth')).toBe(false);
  });

  it('exposes display size for equirect and flat video viewports', () => {
    for (const type of [
      'visual.media.equirect-viewport',
      'visual.media.flat-video-viewport',
      'visual.media.equirect-sphere-viewport',
    ]) {
      const definition = defaultComponentRegistry.get(type);
      expect(definition?.properties.find((p) => p.key === 'displaySize')?.default).toBe('640x360');
      expect(definition?.properties.some((p) => p.key === 'sourceWidth')).toBe(false);
    }
  });
});
