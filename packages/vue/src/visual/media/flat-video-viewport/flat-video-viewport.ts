import { clampCropToSource, type FlatCropRect } from '@rosettadash/core';
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
  type StyleValue,
} from 'vue';

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
  startRecording: () => void;
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
  style?: StyleValue;
  outputPreviewHost?: HTMLElement | null;
  onCropChange?: (detail: FlatVideoCropChange) => void;
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function pickRecorderMimeType(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

function previewCanvasSize(cropWidth: number, cropHeight: number, maxEdge = 720) {
  const safeCropWidth = Math.max(2, Math.round(cropWidth));
  const safeCropHeight = Math.max(2, Math.round(cropHeight));
  const scale = Math.min(1, maxEdge / Math.max(safeCropWidth, safeCropHeight));
  return {
    width: Math.max(2, Math.round((safeCropWidth * scale) / 2) * 2),
    height: Math.max(2, Math.round((safeCropHeight * scale) / 2) * 2),
  };
}

function fitCropSizeInHost(
  cropWidth: number,
  cropHeight: number,
  hostWidth: number,
  hostHeight: number,
  dpr = 1,
) {
  const cropW = Math.max(2, Math.round(cropWidth));
  const cropH = Math.max(2, Math.round(cropHeight));
  const cropAspect = cropW / cropH;
  const hostAspect = hostWidth / hostHeight;

  let fitWidth: number;
  let fitHeight: number;
  if (cropAspect > hostAspect) {
    fitWidth = hostWidth;
    fitHeight = hostWidth / cropAspect;
  } else {
    fitHeight = hostHeight;
    fitWidth = hostHeight * cropAspect;
  }

  return {
    width: Math.max(2, Math.round((fitWidth * dpr) / 2) * 2),
    height: Math.max(2, Math.round((fitHeight * dpr) / 2) * 2),
  };
}

function applyPreviewCanvasLayout(
  canvas: HTMLCanvasElement,
  cropWidth: number,
  cropHeight: number,
  host?: HTMLElement | null,
) {
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
  const rect = host?.getBoundingClientRect();
  const { width, height } =
    rect && rect.width > 0 && rect.height > 0
      ? fitCropSizeInHost(cropWidth, cropHeight, rect.width, rect.height, dpr)
      : previewCanvasSize(cropWidth, cropHeight);

  canvas.width = width;
  canvas.height = height;
  canvas.style.removeProperty('width');
  canvas.style.removeProperty('height');
  canvas.style.removeProperty('max-width');
  canvas.style.removeProperty('max-height');
  canvas.style.removeProperty('aspect-ratio');
}

function drawFlatCropPreview(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvasWidth, canvasHeight);
}

function cropToPercent(crop: FlatCropRect, sourceWidth: number, sourceHeight: number) {
  return {
    left: (crop.cropX / sourceWidth) * 100,
    top: (crop.cropY / sourceHeight) * 100,
    width: (crop.cropWidth / sourceWidth) * 100,
    height: (crop.cropHeight / sourceHeight) * 100,
  };
}

function pointerToSource(
  clientX: number,
  clientY: number,
  frameRect: DOMRect,
  sourceWidth: number,
  sourceHeight: number,
) {
  const x = clamp(((clientX - frameRect.left) / frameRect.width) * sourceWidth, 0, sourceWidth);
  const y = clamp(((clientY - frameRect.top) / frameRect.height) * sourceHeight, 0, sourceHeight);
  return { x, y };
}

type HostWithRecorder = HTMLDivElement & { __recorder?: MediaRecorder | null; __recordedChunks?: Blob[] };

export const FlatVideoViewport = defineComponent({
  name: 'RdFlatVideoViewport',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    style: { type: [String, Object, Array] as PropType<StyleValue | undefined>, default: undefined },
    videoSrc: { type: String as PropType<string | null | undefined>, default: undefined },
    sourceWidth: { type: Number, required: true },
    sourceHeight: { type: Number, required: true },
    cropX: { type: Number, required: true },
    cropY: { type: Number, required: true },
    cropWidth: { type: Number, required: true },
    cropHeight: { type: Number, required: true },
    outputWidth: { type: Number as PropType<number | undefined>, default: 640 },
    outputHeight: { type: Number as PropType<number | undefined>, default: 360 },
    lockAspectRatio: { type: Boolean as PropType<boolean | undefined>, default: false },
    outputPreviewHost: { type: Object as PropType<HTMLElement | null | undefined>, default: undefined },
    onCropChange: {
      type: Function as PropType<((detail: FlatVideoCropChange) => void) | undefined>,
      default: undefined,
    },
  },
  emits: ['cropChange'],
  setup(props, { emit, expose, attrs }) {
    const hostRef = ref<HTMLDivElement | null>(null);
    const frameRef = ref<HTMLDivElement | null>(null);
    const videoRef = ref<HTMLVideoElement | null>(null);
    const outputCanvasRef = ref<HTMLCanvasElement | null>(null);
    const dragRef = ref<{
      mode: DragMode;
      startX: number;
      startY: number;
      origin: FlatCropRect;
    } | null>(null);
    let disposePreview: (() => void) | null = null;

    const handle: FlatVideoViewportHandle = {
      play: async () => {
        const video = videoRef.value;
        if (!video) {
          return;
        }
        await video.play();
      },
      pause: () => videoRef.value?.pause(),
      stop: () => {
        const video = videoRef.value;
        if (!video) {
          return;
        }
        video.pause();
        video.currentTime = 0;
      },
      seek: (time: number) => {
        const video = videoRef.value;
        if (!video) {
          return;
        }
        video.currentTime = clamp(time, 0, video.duration || time);
      },
      getCurrentTime: () => videoRef.value?.currentTime ?? 0,
      getDuration: () => videoRef.value?.duration ?? 0,
      isPaused: () => videoRef.value?.paused ?? true,
      getOutputCanvas: () => outputCanvasRef.value,
      startRecording: () => {
        const canvas = outputCanvasRef.value;
        const host = hostRef.value as HostWithRecorder | null;
        if (!canvas || !host || host.__recorder) {
          return;
        }
        const stream = canvas.captureStream(30);
        const chunks: Blob[] = [];
        host.__recordedChunks = chunks;
        const recorder = new MediaRecorder(stream, { mimeType: pickRecorderMimeType() });
        host.__recorder = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.start(200);
      },
      stopRecording: () =>
        new Promise((resolve) => {
          const host = hostRef.value as HostWithRecorder | null;
          const recorder = host?.__recorder;
          if (!recorder || recorder.state === 'inactive') {
            resolve(null);
            return;
          }
          recorder.onstop = () => {
            const chunks = host?.__recordedChunks ?? [];
            if (host) {
              host.__recorder = null;
              host.__recordedChunks = [];
            }
            resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
          };
          recorder.stop();
        }),
    };

    expose(handle);

    function mountPreview(): void {
      disposePreview?.();
      disposePreview = null;
      const host = props.outputPreviewHost;
      if (!host) {
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.className = 'rd-flat-video-viewport__mirror';
      canvas.setAttribute('aria-label', 'Output view (cropped region)');
      host.appendChild(canvas);
      outputCanvasRef.value = canvas;

      const resize = () => {
        applyPreviewCanvasLayout(canvas, props.cropWidth, props.cropHeight, host);
      };
      resize();

      let animationId = 0;
      const tick = () => {
        const video = videoRef.value;
        const ctx = canvas.getContext('2d');
        if (video && ctx && video.readyState >= 2) {
          drawFlatCropPreview(
            ctx,
            video,
            props.cropX,
            props.cropY,
            props.cropWidth,
            props.cropHeight,
            canvas.width,
            canvas.height,
          );
        }
        animationId = requestAnimationFrame(tick);
      };
      tick();

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      disposePreview = () => {
        cancelAnimationFrame(animationId);
        resizeObserver.disconnect();
        canvas.remove();
        outputCanvasRef.value = null;
      };
    }

    const emitCrop = (next: FlatCropRect) => {
      const clamped = clampCropToSource(next, props.sourceWidth, props.sourceHeight);
      props.onCropChange?.(clamped);
      emit('cropChange', clamped);
    };

    const applyDrag = (clientX: number, clientY: number) => {
      const drag = dragRef.value;
      const frame = frameRef.value;
      if (!drag || !frame) {
        return;
      }
      const frameRect = frame.getBoundingClientRect();
      const pointer = pointerToSource(clientX, clientY, frameRect, props.sourceWidth, props.sourceHeight);
      const dx = pointer.x - drag.startX;
      const dy = pointer.y - drag.startY;
      const origin = drag.origin;
      const outputAspect = (props.outputWidth ?? 640) / (props.outputHeight ?? 360);

      if (drag.mode === 'move') {
        emitCrop({
          cropX: origin.cropX + dx,
          cropY: origin.cropY + dy,
          cropWidth: origin.cropWidth,
          cropHeight: origin.cropHeight,
        });
        return;
      }

      let nextX = origin.cropX;
      let nextY = origin.cropY;
      let nextW = origin.cropWidth;
      let nextH = origin.cropHeight;

      if (drag.mode.includes('e')) {
        nextW = origin.cropWidth + dx;
      }
      if (drag.mode.includes('w')) {
        nextW = origin.cropWidth - dx;
        nextX = origin.cropX + dx;
      }
      if (drag.mode.includes('s')) {
        nextH = origin.cropHeight + dy;
      }
      if (drag.mode.includes('n')) {
        nextH = origin.cropHeight - dy;
        nextY = origin.cropY + dy;
      }

      if (props.lockAspectRatio && outputAspect > 0) {
        nextH = nextW / outputAspect;
        if (drag.mode.includes('n')) {
          nextY = origin.cropY + origin.cropHeight - nextH;
        }
        if (drag.mode.includes('w')) {
          nextX = origin.cropX + origin.cropWidth - nextW;
        }
      }

      nextW = Math.max(2, nextW);
      nextH = Math.max(2, nextH);
      emitCrop({ cropX: nextX, cropY: nextY, cropWidth: nextW, cropHeight: nextH });
    };

    const onPointerDown = (event: PointerEvent, mode: DragMode) => {
      const frame = frameRef.value;
      if (!frame || event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const frameRect = frame.getBoundingClientRect();
      const pointer = pointerToSource(event.clientX, event.clientY, frameRect, props.sourceWidth, props.sourceHeight);
      dragRef.value = {
        mode,
        startX: pointer.x,
        startY: pointer.y,
        origin: {
          cropX: props.cropX,
          cropY: props.cropY,
          cropWidth: props.cropWidth,
          cropHeight: props.cropHeight,
        },
      };

      const onWindowMove = (moveEvent: PointerEvent) => {
        applyDrag(moveEvent.clientX, moveEvent.clientY);
      };
      const onWindowUp = () => {
        dragRef.value = null;
        window.removeEventListener('pointermove', onWindowMove);
        window.removeEventListener('pointerup', onWindowUp);
        window.removeEventListener('pointercancel', onWindowUp);
      };
      window.addEventListener('pointermove', onWindowMove);
      window.addEventListener('pointerup', onWindowUp);
      window.addEventListener('pointercancel', onWindowUp);
    };

    onMounted(() => {
      watch(
        () => [props.outputPreviewHost, props.videoSrc],
        () => mountPreview(),
        { immediate: true, flush: 'post' },
      );
      watch(
        () => [props.cropWidth, props.cropHeight],
        () => {
          const canvas = outputCanvasRef.value;
          if (!canvas) {
            return;
          }
          applyPreviewCanvasLayout(canvas, props.cropWidth, props.cropHeight, props.outputPreviewHost);
        },
      );
      watch(
        () => props.videoSrc,
        (src) => {
          const video = videoRef.value;
          if (!video || !src) {
            return;
          }
          video.src = src;
          video.load();
          void video.play().catch(() => undefined);
        },
        { immediate: true },
      );
    });

    onBeforeUnmount(() => {
      disposePreview?.();
      disposePreview = null;
    });

    return () => {
      const cropPct = cropToPercent(
        {
          cropX: props.cropX,
          cropY: props.cropY,
          cropWidth: props.cropWidth,
          cropHeight: props.cropHeight,
        },
        props.sourceWidth,
        props.sourceHeight,
      );
      const rootClass = [
        'rd-flat-video-viewport',
        props.className,
        typeof attrs.class === 'string' ? attrs.class : '',
      ]
        .filter(Boolean)
        .join(' ');
      const handles = ['nw', 'ne', 'sw', 'se'] as const;

      return h('div', { ref: hostRef, class: rootClass, style: props.style, 'data-testid': 'rd-flat-video-viewport' }, [
        h(
          'div',
          {
            ref: frameRef,
            class: 'rd-flat-video-viewport__frame',
            style: { aspectRatio: `${props.sourceWidth} / ${props.sourceHeight}` },
          },
          [
            h('video', {
              ref: videoRef,
              class: 'rd-flat-video-viewport__video',
              muted: true,
              playsInline: true,
              loop: false,
              crossOrigin: 'anonymous',
            }),
            h(
              'div',
              {
                class: 'rd-flat-video-viewport__crop',
                style: {
                  left: `${cropPct.left}%`,
                  top: `${cropPct.top}%`,
                  width: `${cropPct.width}%`,
                  height: `${cropPct.height}%`,
                },
                onPointerdown: (event: PointerEvent) => onPointerDown(event, 'move'),
              },
              handles.map((handleName) =>
                h('span', {
                  key: handleName,
                  class: `rd-flat-video-viewport__handle rd-flat-video-viewport__handle--${handleName}`,
                  onPointerdown: (event: PointerEvent) => onPointerDown(event, handleName),
                }),
              ),
            ),
          ],
        ),
      ]);
    };
  },
});

export type FlatVideoViewportComponent = typeof FlatVideoViewport;
