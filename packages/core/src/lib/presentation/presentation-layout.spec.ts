import {
  DEFAULT_VIDEO_DISPLAY_SIZE,
  parseVideoDisplaySize,
  resolvePresentationDimensions,
  shouldSyncLayoutOnPropertyChange,
} from './presentation-layout';

describe('presentation-layout', () => {
  it('parses video display size presets', () => {
    expect(parseVideoDisplaySize(DEFAULT_VIDEO_DISPLAY_SIZE)).toEqual({
      width: 640,
      height: 360,
    });
    expect(parseVideoDisplaySize('invalid')).toBeNull();
  });

  it('resolves video source page dimensions from displaySize', () => {
    expect(
      resolvePresentationDimensions({
        type: 'visual.media.video-source',
        label: 'Video Source',
        properties: { displaySize: '960x540', fullscreen: false },
      }),
    ).toEqual({ width: 960, height: 540, fullscreen: false });
  });

  it('uses fullscreen layout when enabled', () => {
    const result = resolvePresentationDimensions({
      type: 'visual.media.video-source',
      label: 'Video Source',
      properties: { displaySize: '320x180', fullscreen: true },
    });
    expect(result).toEqual({ width: 320, height: 180, fullscreen: true });
  });

  it('accounts for form field labels in layout height', () => {
    const withLabel = resolvePresentationDimensions({
      type: 'visual.input.text',
      label: 'Customer',
      properties: { label: 'Customer name' },
    });
    const withoutLabel = resolvePresentationDimensions({
      type: 'visual.input.text',
      label: '',
      properties: { label: '' },
    });

    expect(withLabel?.height).toBeGreaterThan(withoutLabel?.height ?? 0);
  });

  it('flags layout-sync property keys', () => {
    expect(shouldSyncLayoutOnPropertyChange('visual.media.video-source', 'displaySize')).toBe(
      true,
    );
    expect(shouldSyncLayoutOnPropertyChange('visual.input.text', 'placeholder')).toBe(false);
  });
});
