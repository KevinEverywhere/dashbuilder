import { wrapSignedDegrees } from './panorama-wrap.js';

export interface EquirectFlatCropOptions {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  outputWidth: number;
  outputHeight: number;
}

export interface EquirectRectilinearOptions {
  yaw: number;
  pitch: number;
  roll?: number;
  horizontalFov: number;
  outputWidth: number;
  outputHeight: number;
}

/** ffmpeg -vf filter for a rectangular crop on a flat 2:1 equirect frame, then scale. */
export function buildEquirectFlatCropFilter(options: EquirectFlatCropOptions, reverse = false): string {
  const cropX = Math.max(0, Math.round(options.cropX));
  const cropY = Math.max(0, Math.round(options.cropY));
  const cropWidth = Math.max(2, Math.round(options.cropWidth));
  const cropHeight = Math.max(2, Math.round(options.cropHeight));
  const outputWidth = Math.max(2, Math.round(options.outputWidth));
  const outputHeight = Math.max(2, Math.round(options.outputHeight));

  const filter = `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY},scale=${outputWidth}:${outputHeight}`;
  return reverse ? `${filter},reverse` : filter;
}

/** ffmpeg -vf filter for rectilinear reprojection from equirect source. */
function roundAngle(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildEquirectRectilinearFilter(options: EquirectRectilinearOptions, reverse = false): string {
  const yaw = roundAngle(wrapSignedDegrees(Number(options.yaw) || 0));
  const pitch = roundAngle(Number(options.pitch) || 0);
  const roll = roundAngle(Number(options.roll ?? 0) || 0);
  const horizontalFov = Math.max(1, Number(options.horizontalFov) || 90);
  const outputWidth = Math.max(2, Math.round(options.outputWidth));
  const outputHeight = Math.max(2, Math.round(options.outputHeight));

  const filter = [
    `v360=input=equirect:output=rectilinear:yaw=${yaw}:pitch=${pitch}:roll=${roll}:d_fov=${horizontalFov}`,
    `scale=${outputWidth}:${outputHeight}`,
  ].join(',');
  return reverse ? `${filter},reverse` : filter;
}

export type EquirectRectilinearExtractOptions = EquirectRectilinearOptions & {
  reverse?: boolean;
};

export type EquirectFlatCropExtractOptions = EquirectFlatCropOptions & {
  reverse?: boolean;
};

/** Mode-specific fields; callers may include extras (ignored per mode). */
export type EquirectExtractOptions = (Partial<EquirectFlatCropOptions> &
  Partial<EquirectRectilinearOptions> & {
    outputWidth: number;
    outputHeight: number;
    reverse?: boolean;
  });

export function buildEquirectExtractFilter(
  mode: 'flat-crop' | 'rectilinear',
  options: EquirectExtractOptions,
): string {
  const reverse = Boolean(options.reverse);
  if (mode === 'rectilinear') {
    return buildEquirectRectilinearFilter(
      {
        yaw: options.yaw ?? 0,
        pitch: options.pitch ?? 0,
        roll: options.roll ?? 0,
        horizontalFov: options.horizontalFov ?? 90,
        outputWidth: options.outputWidth,
        outputHeight: options.outputHeight,
      },
      reverse,
    );
  }

  return buildEquirectFlatCropFilter(
    {
      cropX: options.cropX ?? DEFAULT_EQUIRECT_FLAT_CROP.cropX,
      cropY: options.cropY ?? DEFAULT_EQUIRECT_FLAT_CROP.cropY,
      cropWidth: options.cropWidth ?? DEFAULT_EQUIRECT_FLAT_CROP.cropWidth,
      cropHeight: options.cropHeight ?? DEFAULT_EQUIRECT_FLAT_CROP.cropHeight,
      outputWidth: options.outputWidth,
      outputHeight: options.outputHeight,
    },
    reverse,
  );
}

/** Default crop centered on a 4096×2048 equirect frame. */
export const DEFAULT_EQUIRECT_SOURCE = { width: 4096, height: 2048 } as const;

export const DEFAULT_EQUIRECT_FLAT_CROP: EquirectFlatCropOptions = {
  cropX: Math.floor((DEFAULT_EQUIRECT_SOURCE.width - 1080) / 2),
  cropY: Math.floor((DEFAULT_EQUIRECT_SOURCE.height - 720) / 2),
  cropWidth: 1080,
  cropHeight: 720,
  outputWidth: 720,
  outputHeight: 480,
};
