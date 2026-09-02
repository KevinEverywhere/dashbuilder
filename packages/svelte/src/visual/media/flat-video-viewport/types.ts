import type { FlatCropRect } from '@rosettadash/core';

export type FlatVideoCropChange = FlatCropRect;

export interface FlatVideoViewportHandle {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPaused: () => boolean;
  getOutputCanvas: () => HTMLCanvasElement | null;
  startRecording: () => boolean;
  stopRecording: () => Promise<Blob | null>;
}

export interface FlatVideoViewportProps {
  videoSrc?: string | null;
  sourceWidth: number;
  sourceHeight: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  outputWidth?: number;
  outputHeight?: number;
  lockAspectRatio?: boolean;
  className?: string;
  outputPreviewHost?: HTMLElement | null;
  onCropChange?: (detail: FlatCropRect) => void;
}
