import { buildEquirectExtractFilter } from './equirect-filter.js';

export interface FlatCropRect {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

export interface FlatCropRegionInput extends FlatCropRect {
  sourceWidth?: number;
  sourceHeight?: number;
  outputWidth: number;
  outputHeight: number;
  reverse?: boolean;
}

export interface FlatAuthoringCropRegion extends FlatCropRect {
  previewMode: 'flat-crop';
  outputWidth: number;
  outputHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  reverse: boolean;
  filter: string;
}

function num(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** True when width:height is approximately 2:1 (equirectangular). */
export function isEquirectSourceDimensions(
  sourceWidth: number,
  sourceHeight: number,
  tolerance = 0.08,
): boolean {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return false;
  }
  return Math.abs(sourceWidth / sourceHeight - 2) <= tolerance;
}

/** Resize a crop to match export aspect while keeping its center point. */
export function fitCropToOutputAspect(
  crop: FlatCropRect,
  sourceWidth: number,
  sourceHeight: number,
  outputWidth: number,
  outputHeight: number,
): FlatCropRect {
  const aspect = Math.max(0.01, outputWidth / outputHeight);
  const centerX = crop.cropX + crop.cropWidth / 2;
  const centerY = crop.cropY + crop.cropHeight / 2;
  let cropWidth = Math.max(2, crop.cropWidth);
  let cropHeight = Math.max(2, cropWidth / aspect);
  if (cropHeight > sourceHeight) {
    cropHeight = sourceHeight;
    cropWidth = cropHeight * aspect;
  }
  if (cropWidth > sourceWidth) {
    cropWidth = sourceWidth;
    cropHeight = cropWidth / aspect;
  }
  return clampCropToSource(
    {
      cropX: Math.round(centerX - cropWidth / 2),
      cropY: Math.round(centerY - cropHeight / 2),
      cropWidth: Math.round(cropWidth),
      cropHeight: Math.round(cropHeight),
    },
    sourceWidth,
    sourceHeight,
  );
}

/** Largest centered crop on the source that matches output aspect ratio. */
export function centerCropForOutput(
  sourceWidth: number,
  sourceHeight: number,
  outputWidth: number,
  outputHeight: number,
): FlatCropRect {
  const outputAspect = Math.max(0.01, outputWidth / outputHeight);
  let cropWidth = sourceWidth;
  let cropHeight = cropWidth / outputAspect;
  if (cropHeight > sourceHeight) {
    cropHeight = sourceHeight;
    cropWidth = cropHeight * outputAspect;
  }
  return clampCropToSource(
    {
      cropX: Math.round((sourceWidth - cropWidth) / 2),
      cropY: Math.round((sourceHeight - cropHeight) / 2),
      cropWidth: Math.max(2, Math.round(cropWidth)),
      cropHeight: Math.max(2, Math.round(cropHeight)),
    },
    sourceWidth,
    sourceHeight,
  );
}

/** Keep crop rectangle inside source frame with minimum 2px size. */
export function clampCropToSource(
  crop: FlatCropRect,
  sourceWidth: number,
  sourceHeight: number,
): FlatCropRect {
  const maxW = Math.max(2, sourceWidth);
  const maxH = Math.max(2, sourceHeight);
  let cropWidth = clamp(Math.round(crop.cropWidth), 2, maxW);
  let cropHeight = clamp(Math.round(crop.cropHeight), 2, maxH);
  const cropX = clamp(Math.round(crop.cropX), 0, maxW - cropWidth);
  const cropY = clamp(Math.round(crop.cropY), 0, maxH - cropHeight);
  if (cropX + cropWidth > maxW) {
    cropWidth = maxW - cropX;
  }
  if (cropY + cropHeight > maxH) {
    cropHeight = maxH - cropY;
  }
  return { cropX, cropY, cropWidth, cropHeight };
}

/** Build crop-region payload for WasmMedia flat-crop extraction. */
export function flatCropToCropRegion(input: FlatCropRegionInput): FlatAuthoringCropRegion {
  const sourceWidth = Math.max(2, Math.round(num(input.sourceWidth, 1920)));
  const sourceHeight = Math.max(2, Math.round(num(input.sourceHeight, 1080)));
  const outputWidth = Math.max(2, Math.round(input.outputWidth));
  const outputHeight = Math.max(2, Math.round(input.outputHeight));
  const crop = clampCropToSource(
    {
      cropX: num(input.cropX, 0),
      cropY: num(input.cropY, 0),
      cropWidth: num(input.cropWidth, outputWidth),
      cropHeight: num(input.cropHeight, outputHeight),
    },
    sourceWidth,
    sourceHeight,
  );

  return {
    previewMode: 'flat-crop',
    ...crop,
    outputWidth,
    outputHeight,
    sourceWidth,
    sourceHeight,
    reverse: Boolean(input.reverse),
    filter: buildEquirectExtractFilter('flat-crop', {
      ...crop,
      outputWidth,
      outputHeight,
      reverse: input.reverse,
    }),
  };
}
