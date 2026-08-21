import {
  DEFAULT_VIDEO_DISPLAY_SIZE,
  mapRowsetToSelectOptions,
  parseStaticSelectOptions,
  parseVideoDisplaySize,
  resolvePresentationDimensions,
  resolveSelectOptionList,
  shouldSyncLayoutOnPropertyChange,
  syncMediaDisplayPropertiesFromLayout,
  syncTextRowsFromLayout,
  textInputUsesMultiline,
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

  it('resolves custom display size from stored dimensions', () => {
    expect(
      resolvePresentationDimensions({
        type: 'visual.media.video-source',
        label: 'Video Source',
        properties: {
          displaySize: 'custom',
          customWidth: 512,
          customHeight: 288,
          fullscreen: false,
        },
      }),
    ).toEqual({ width: 512, height: 288, fullscreen: false });
  });

  it('marks media display as custom when canvas size diverges from preset', () => {
    expect(
      syncMediaDisplayPropertiesFromLayout(
        'visual.media.video-source',
        { width: 704, height: 400 },
        { displaySize: '640x360' },
        { width: 640, height: 360 },
      ),
    ).toEqual({
      displaySize: 'custom',
      customWidth: 704,
      customHeight: 400,
    });
  });
});

describe('select option resolution', () => {
  it('parses static options from newlines and pipes', () => {
    expect(parseStaticSelectOptions('Alpha\nBeta|b2')).toEqual([
      { label: 'Alpha', value: 'Alpha' },
      { label: 'Beta', value: 'b2' },
    ]);
  });

  it('prefers bound rowset over static options', () => {
    const options = resolveSelectOptionList({
      boundRows: [
        { id: '1', name: 'Revenue' },
        { id: '2', name: 'Orders' },
      ],
      staticOptions: 'Ignored A\nIgnored B',
      labelField: 'name',
      valueField: 'id',
    });
    expect(options).toEqual([
      { label: 'Revenue', value: '1' },
      { label: 'Orders', value: '2' },
    ]);
  });

  it('maps rowset fields with fallbacks', () => {
    expect(
      mapRowsetToSelectOptions([{ label: 'Only label' }], 'missing', 'missing'),
    ).toEqual([{ label: 'Only label', value: 'Only label' }]);
  });

  it('auto-detects typical label/value columns when configured fields are absent', () => {
    expect(
      mapRowsetToSelectOptions([{ title: 'North', code: 'N' }], 'name', 'id'),
    ).toEqual([{ label: 'North', value: 'N' }]);
  });
});

describe('text rows from layout', () => {
  it('removes rows when height is single-line', () => {
    const ports = {
      inputs: [],
      outputs: [{ id: 'value', name: 'value', dataType: 'string' as const }],
    };
    const next = syncTextRowsFromLayout({ width: 280, height: 100 }, { rows: 4 }, ports);
    expect(next['rows']).toBeUndefined();
    expect(
      textInputUsesMultiline({
        type: 'visual.input.text',
        properties: {},
        layout: { x: 0, y: 0, width: 280, height: 100 },
        ports,
      }),
    ).toBe(false);
  });

  it('derives rows from stretched height', () => {
    const ports = {
      inputs: [],
      outputs: [{ id: 'value', name: 'value', dataType: 'string' as const }],
    };
    const layout = { width: 280, height: 220 };
    expect(
      textInputUsesMultiline({
        type: 'visual.input.text',
        properties: {},
        layout: { x: 0, y: 0, ...layout },
        ports,
      }),
    ).toBe(true);
    const next = syncTextRowsFromLayout(layout, {}, ports);
    expect(typeof next['rows']).toBe('number');
    expect(next['rows'] as number).toBeGreaterThanOrEqual(2);
  });
});
