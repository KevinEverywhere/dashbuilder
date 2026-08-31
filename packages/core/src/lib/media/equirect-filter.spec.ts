import {
  buildEquirectExtractFilter,
  buildEquirectFlatCropFilter,
  buildEquirectRectilinearFilter,
  DEFAULT_EQUIRECT_FLAT_CROP,
} from './equirect-filter';

describe('equirect-filter', () => {
  it('builds flat crop + scale filter for subsection export', () => {
    expect(buildEquirectFlatCropFilter(DEFAULT_EQUIRECT_FLAT_CROP)).toBe(
      'crop=1080:720:1508:664,scale=720:480',
    );
  });

  it('builds rectilinear reprojection filter', () => {
    expect(
      buildEquirectRectilinearFilter({
        yaw: 90,
        pitch: 0,
        horizontalFov: 75,
        outputWidth: 720,
        outputHeight: 480,
      }),
    ).toBe(
      'v360=input=equirect:output=rectilinear:yaw=90:pitch=0:roll=0:d_fov=75,scale=720:480',
    );
    expect(
      buildEquirectRectilinearFilter({
        yaw: 370,
        pitch: 0,
        horizontalFov: 75,
        outputWidth: 720,
        outputHeight: 480,
      }),
    ).toContain('yaw=10');
  });

  it('selects filter mode via buildEquirectExtractFilter', () => {
    expect(buildEquirectExtractFilter('flat-crop', DEFAULT_EQUIRECT_FLAT_CROP)).toContain(
      'crop=1080:720',
    );
    expect(
      buildEquirectExtractFilter('rectilinear', {
        ...DEFAULT_EQUIRECT_FLAT_CROP,
        yaw: 45,
        pitch: -10,
        horizontalFov: 60,
      }),
    ).toContain('v360=input=equirect');
  });

  it('appends reverse when requested', () => {
    expect(
      buildEquirectExtractFilter('rectilinear', {
        ...DEFAULT_EQUIRECT_FLAT_CROP,
        yaw: 45,
        pitch: -10,
        horizontalFov: 60,
        reverse: true,
      }),
    ).toContain(',reverse');
  });
});
