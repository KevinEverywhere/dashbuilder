import type { EquirectSphereCameraChange, EquirectSphereOutputSizeChange } from '@rosettadash/web-components/visual/media/equirect-sphere-viewport';

export type { EquirectSphereCameraChange, EquirectSphereOutputSizeChange };

export interface EquirectSphereViewportHandle {
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

export interface EquirectSphereViewportProps {
  videoSrc?: string | null;
  flipInterior?: boolean;
  yaw?: number;
  pitch?: number;
  horizontalFov?: number;
  outputWidth?: number;
  outputHeight?: number;
  minHorizontalFov?: number;
  maxHorizontalFov?: number;
  className?: string;
  outputPreviewHost?: HTMLElement | null;
  resetExportReferenceToken?: number;
  /** Increment when app pushes new output dimensions (preset/custom fields), not on CE drag. */
  outputSizeCommitToken?: number;
  onCameraChange?: (detail: EquirectSphereCameraChange) => void;
  onOutputSizeChange?: (detail: EquirectSphereOutputSizeChange) => void;
}
