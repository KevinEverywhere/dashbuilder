import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type RefObject,
} from 'react';
import type { FlatCropRect } from '@rosettadash/core';
import {
  DB_FLAT_VIDEO_VIEWPORT_TAG,
  registerRdFlatVideoViewport,
} from '@rosettadash/web-components/visual/media/flat-video-viewport';
import { useCustomElementHost } from '../../../lib/custom-element-host.js';
import {
  asMediaViewportElement,
  type MediaViewportElement,
} from '../media-viewport-element.js';

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
  style?: CSSProperties;
  outputPreviewHostRef?: RefObject<HTMLElement | null>;
  outputPreviewHost?: HTMLElement | null;
  onCropChange?: (detail: FlatVideoCropChange) => void;
}

function bindViewportHandle(el: MediaViewportElement | null): FlatVideoViewportHandle {
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

/** React wrapper around `<rd-flat-video-viewport>` (WC reference implementation). */
export const FlatVideoViewport = forwardRef<FlatVideoViewportHandle, FlatVideoViewportProps>(
  function FlatVideoViewport(
    {
      videoSrc,
      sourceWidth,
      sourceHeight,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      outputWidth,
      outputHeight,
      lockAspectRatio,
      className,
      style,
      outputPreviewHostRef,
      outputPreviewHost,
      onCropChange,
    },
    ref,
  ) {
    const elementRef = useRef<HTMLElement | null>(null);
    const previewHost = outputPreviewHost ?? outputPreviewHostRef?.current ?? null;

    const hostRef = useCustomElementHost(
      {
        register: registerRdFlatVideoViewport,
        properties: ['videoSrc', 'outputPreviewHost'],
        attrs: {
          sourceWidth: 'source-width',
          sourceHeight: 'source-height',
          cropX: 'crop-x',
          cropY: 'crop-y',
          cropWidth: 'crop-width',
          cropHeight: 'crop-height',
          outputWidth: 'output-width',
          outputHeight: 'output-height',
          lockAspectRatio: 'lock-aspect-ratio',
        },
        events: {
          'crop-change': 'onCropChange',
        },
      },
      {
        sourceWidth,
        sourceHeight,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        outputWidth,
        outputHeight,
        lockAspectRatio,
      },
      {
        onCropChange: onCropChange as ((detail: unknown) => void) | undefined,
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

    useImperativeHandle(ref, () => bindViewportHandle(asMediaViewportElement(elementRef.current)));

    return createElement(DB_FLAT_VIDEO_VIEWPORT_TAG, {
      ref: hostRef,
      className,
      style,
    });
  },
);
