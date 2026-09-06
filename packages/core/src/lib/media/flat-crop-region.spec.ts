import {
  centerCropForOutput,
  clampCropToSource,
  flatCropToCropRegion,
  fitCropToOutputAspect,
  isEquirectSourceDimensions,
} from './flat-crop-region';

describe('flat-crop-region', () => {
  it('detects equirect 2:1 sources', () => {
    expect(isEquirectSourceDimensions(3840, 1920)).toBe(true);
    expect(isEquirectSourceDimensions(1920, 1080)).toBe(false);
  });

  it('fits crop to export aspect', () => {
    const crop = fitCropToOutputAspect(
      { cropX: 0, cropY: 0, cropWidth: 640, cropHeight: 360 },
      1920,
      1080,
      480,
      480,
    );
    expect(crop.cropWidth / crop.cropHeight).toBeCloseTo(1, 2);
  });

  it('centers crop with output aspect', () => {
    const crop = centerCropForOutput(1920, 1080, 640, 360);
    expect(crop.cropWidth / crop.cropHeight).toBeCloseTo(640 / 360, 2);
    expect(crop.cropX).toBeGreaterThanOrEqual(0);
    expect(crop.cropY).toBeGreaterThanOrEqual(0);
    expect(crop.cropX + crop.cropWidth).toBeLessThanOrEqual(1920);
    expect(crop.cropY + crop.cropHeight).toBeLessThanOrEqual(1080);
  });

  it('clamps crop inside source bounds', () => {
    const crop = clampCropToSource(
      { cropX: 1900, cropY: 1000, cropWidth: 500, cropHeight: 400 },
      1920,
      1080,
    );
    expect(crop.cropX + crop.cropWidth).toBeLessThanOrEqual(1920);
    expect(crop.cropY + crop.cropHeight).toBeLessThanOrEqual(1080);
  });

  it('builds flat-crop wasm region', () => {
    const region = flatCropToCropRegion({
      cropX: 100,
      cropY: 50,
      cropWidth: 640,
      cropHeight: 360,
      sourceWidth: 1920,
      sourceHeight: 1080,
      outputWidth: 640,
      outputHeight: 360,
    });
    expect(region.previewMode).toBe('flat-crop');
    expect(String(region.filter)).toContain('crop=640:360:100:50');
    expect(String(region.filter)).toContain('scale=640:360');
  });
});
