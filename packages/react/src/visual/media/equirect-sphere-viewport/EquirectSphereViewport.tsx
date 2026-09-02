import {
  createElement,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type RefObject,
} from 'react';
import {
  DB_EQUIRECT_SPHERE_VIEWPORT_TAG,
  registerRdEquirectSphereViewport,
  type EquirectSphereCameraChange,
  type EquirectSphereOutputSizeChange,
} from '@rosettadash/web-components/visual/media/equirect-sphere-viewport';
import { useCustomElementHost } from '../../../lib/custom-element-host.js';
import {
  asMediaViewportElement,
  type MediaViewportElement,
} from '../media-viewport-element.js';

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
  style?: CSSProperties;
  outputPreviewHostRef?: RefObject<HTMLElement | null>;
  /** Prefer this when the preview host node is bound via a callback ref. */
  outputPreviewHost?: HTMLElement | null;
  /** Increment to reset export overlay reference after output preset change. */
  resetExportReferenceToken?: number;
  /** Increment when app pushes new output dimensions (preset/custom fields), not on CE drag. */
  outputSizeCommitToken?: number;
  onCameraChange?: (detail: EquirectSphereCameraChange) => void;
  onOutputSizeChange?: (detail: EquirectSphereOutputSizeChange) => void;
  onTimeUpdate?: (detail: { currentTime: number; duration: number }) => void;
  onPlaybackChange?: (detail: { paused: boolean }) => void;
}

function bindViewportHandle(el: MediaViewportElement | null): EquirectSphereViewportHandle {
  return {
    play: () => el?.play() ?? Promise.resolve(),
    pause: () => el?.pause(),
    stop: () => el?.stop(),
    seek: (time) => el?.seek(time),
    getCurrentTime: () => el?.getCurrentTime() ?? 0,
    getDuration: () => el?.getDuration() ?? 0,
    isPaused: () => el?.isPaused() ?? true,
    getOutputCanvas: () => el?.getOutputCanvas() ?? null,
    startRecording: () => el?.startRecording() ?? false,
    stopRecording: () => el?.stopRecording() ?? Promise.resolve(null),
  };
}

/** React wrapper around `<rd-equirect-sphere-viewport>` (WC reference implementation). */
export const EquirectSphereViewport = forwardRef<
  EquirectSphereViewportHandle,
  EquirectSphereViewportProps
>(function EquirectSphereViewport(
  {
    videoSrc,
    flipInterior,
    yaw,
    pitch,
    horizontalFov,
    outputWidth,
    outputHeight,
    minHorizontalFov,
    maxHorizontalFov,
    className,
    style,
    outputPreviewHostRef,
    outputPreviewHost,
    resetExportReferenceToken,
    outputSizeCommitToken,
    onCameraChange,
    onOutputSizeChange,
    onTimeUpdate,
    onPlaybackChange,
  },
  ref,
) {
  const elementRef = useRef<HTMLElement | null>(null);

  const previewHost = outputPreviewHost ?? outputPreviewHostRef?.current ?? null;

  const hostRef = useCustomElementHost(
    {
      register: registerRdEquirectSphereViewport,
      properties: ['videoSrc', 'outputPreviewHost'],
      attrs: {
        flipInterior: 'flip-interior',
        horizontalFov: 'horizontal-fov',
        minHorizontalFov: 'min-horizontal-fov',
        maxHorizontalFov: 'max-horizontal-fov',
      },
      events: {
        'camera-change': 'onCameraChange',
        'output-size-change': 'onOutputSizeChange',
        'time-update': 'onTimeUpdate',
        'playback-change': 'onPlaybackChange',
      },
    },
    {
      flipInterior,
      yaw,
      pitch,
      horizontalFov,
      minHorizontalFov,
      maxHorizontalFov,
    },
    {
      onCameraChange: onCameraChange as ((detail: unknown) => void) | undefined,
      onOutputSizeChange: onOutputSizeChange as ((detail: unknown) => void) | undefined,
      onTimeUpdate: onTimeUpdate as ((detail: unknown) => void) | undefined,
      onPlaybackChange: onPlaybackChange as ((detail: unknown) => void) | undefined,
    },
    (node) => {
      elementRef.current = node;
    },
    {
      videoSrc: videoSrc ?? null,
      outputPreviewHost: previewHost,
    },
  );

  useLayoutEffect(() => {
    const el = elementRef.current;
    if (!el) {
      return;
    }
    const setProperty = (el as { setProperty?: (name: string, value: unknown) => void }).setProperty;
    setProperty?.call(el, 'outputPreviewHost', previewHost);
  }, [previewHost]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) {
      return;
    }
    const setProperty = (el as { setProperty?: (name: string, value: unknown) => void }).setProperty;
    setProperty?.call(el, 'videoSrc', videoSrc ?? null);
  }, [videoSrc]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || !outputSizeCommitToken) {
      return;
    }
    if (outputWidth != null) {
      el.setAttribute('output-width', String(outputWidth));
    }
    if (outputHeight != null) {
      el.setAttribute('output-height', String(outputHeight));
    }
  }, [outputSizeCommitToken]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || !resetExportReferenceToken) {
      return;
    }
    const setProperty = (el as { setProperty?: (name: string, value: unknown) => void }).setProperty;
    setProperty?.call(el, 'resetExportReference', true);
  }, [resetExportReferenceToken]);

  useImperativeHandle(ref, () => bindViewportHandle(asMediaViewportElement(elementRef.current)));

  return createElement(DB_EQUIRECT_SPHERE_VIEWPORT_TAG, {
    ref: hostRef,
    className,
    style,
  });
});
