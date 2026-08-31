import { wrapSignedDegrees } from './panorama-wrap.js';

/** Framework-agnostic virtual camera for equirect authoring (browser + CLI). */
export type VirtualCameraVantage = 'inside' | 'outside';

export interface VirtualCameraState {
  vantage: VirtualCameraVantage;
  yaw: number;
  pitch: number;
  roll: number;
  fov: number;
  aspect: number;
  distance: number;
  sphereRadius: number;
}

export type VirtualCameraOptions = Partial<VirtualCameraState>;

function num(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export class VirtualCamera implements VirtualCameraState {
  vantage: VirtualCameraVantage;
  yaw: number;
  pitch: number;
  roll: number;
  fov: number;
  aspect: number;
  distance: number;
  sphereRadius: number;

  constructor(options: VirtualCameraOptions = {}) {
    this.vantage = options.vantage === 'outside' ? 'outside' : 'inside';
    this.yaw = num(options.yaw, 0);
    this.pitch = num(options.pitch, 0);
    this.roll = num(options.roll, 0);
    this.fov = num(options.fov, 75);
    this.aspect = num(options.aspect, 16 / 9);
    this.distance = num(options.distance, 12);
    this.sphereRadius = num(options.sphereRadius, 10);
  }

  toJSON(): VirtualCameraState {
    return {
      vantage: this.vantage,
      yaw: round(this.yaw),
      pitch: round(this.pitch),
      roll: round(this.roll),
      fov: round(this.fov),
      aspect: round(this.aspect, 4),
      distance: round(this.distance, 3),
      sphereRadius: this.sphereRadius,
    };
  }

  static fromJSON(data: Partial<VirtualCameraState> | null | undefined): VirtualCamera {
    return new VirtualCamera(data ?? {});
  }

  normalizeReadable(options: { lockRoll?: boolean; maxPitch?: number } = {}): this {
    const { lockRoll = true, maxPitch = 89 } = options;
    this.yaw = wrapSignedDegrees(this.yaw);
    this.pitch = clamp(this.pitch, -maxPitch, maxPitch);
    if (lockRoll) {
      this.roll = 0;
    }
    return this;
  }

  merge(partial: Partial<VirtualCameraState>): this {
    for (const key of ['vantage', 'yaw', 'pitch', 'roll', 'fov', 'aspect', 'distance', 'sphereRadius'] as const) {
      if (partial[key] !== undefined) {
        this[key] = partial[key] as never;
      }
    }
    return this;
  }
}

export interface AuthoringCropRegionInput {
  camera: Pick<VirtualCameraState, 'yaw' | 'pitch' | 'roll' | 'fov'>;
  sourceWidth?: number;
  sourceHeight?: number;
  outputWidth: number;
  outputHeight: number;
  reverse?: boolean;
}

export interface AuthoringCropRegion {
  previewMode: 'rectilinear';
  yaw: number;
  pitch: number;
  roll: number;
  horizontalFov: number;
  outputWidth: number;
  outputHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  reverse: boolean;
  filter: string;
}

import { buildEquirectExtractFilter } from './equirect-filter.js';

/** Build crop-region payload for WasmMedia from virtual camera + output dimensions. */
export function virtualCameraToCropRegion(input: AuthoringCropRegionInput): AuthoringCropRegion {
  const yaw = wrapSignedDegrees(num(input.camera.yaw, 0));
  const pitch = num(input.camera.pitch, 0);
  const roll = num(input.camera.roll, 0);
  const horizontalFov = Math.max(1, num(input.camera.fov, 90));
  const outputWidth = Math.max(2, Math.round(input.outputWidth));
  const outputHeight = Math.max(2, Math.round(input.outputHeight));

  return {
    previewMode: 'rectilinear',
    yaw,
    pitch,
    roll,
    horizontalFov,
    outputWidth,
    outputHeight,
    sourceWidth: input.sourceWidth ?? 4096,
    sourceHeight: input.sourceHeight ?? 2048,
    reverse: Boolean(input.reverse),
    filter: buildEquirectExtractFilter('rectilinear', {
      yaw,
      pitch,
      roll,
      horizontalFov,
      outputWidth,
      outputHeight,
      reverse: input.reverse,
    }),
  };
}
