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
import type { FlatCropRect } from '@rosettadash/core';
import {
  DB_FLAT_VIDEO_VIEWPORT_TAG,
  registerRdFlatVideoViewport,
} from '@rosettadash/web-components/visual/media/flat-video-viewport';

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
  style?: StyleValue;
  outputPreviewHost?: HTMLElement | null;
  onCropChange?: (detail: FlatVideoCropChange) => void;
}

type MediaViewportElement = HTMLElement & FlatVideoViewportHandle;

function syncAttr(el: HTMLElement, name: string, value: unknown): void {
  if (value === undefined || value === null || value === false) {
    if (el.hasAttribute(name)) {
      el.removeAttribute(name);
    }
    return;
  }
  const next = value === true ? '' : String(value);
  if (el.getAttribute(name) === next) {
    return;
  }
  if (value === true) {
    el.setAttribute(name, '');
  } else {
    el.setAttribute(name, String(value));
  }
}

function syncProperty(el: HTMLElement, name: string, value: unknown): void {
  const setProperty = (el as { setProperty?: (n: string, v: unknown) => void }).setProperty;
  setProperty?.call(el, name, value);
}

/** Vue host for `<rd-flat-video-viewport>` (WC reference implementation). */
export const FlatVideoViewport = defineComponent({
  name: 'FlatVideoViewport',
  props: {
    videoSrc: { type: String as PropType<string | null | undefined>, default: undefined },
    sourceWidth: { type: Number, required: true },
    sourceHeight: { type: Number, required: true },
    cropX: { type: Number, required: true },
    cropY: { type: Number, required: true },
    cropWidth: { type: Number, required: true },
    cropHeight: { type: Number, required: true },
    outputWidth: { type: Number, default: undefined },
    outputHeight: { type: Number, default: undefined },
    lockAspectRatio: { type: Boolean, default: undefined },
    className: { type: String, default: undefined },
    style: { type: [String, Object] as PropType<StyleValue>, default: undefined },
    outputPreviewHost: {
      type: Object as PropType<HTMLElement | null | undefined>,
      default: undefined,
    },
    onCropChange: {
      type: Function as PropType<(detail: FlatVideoCropChange) => void>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    registerRdFlatVideoViewport();
    const host = ref<MediaViewportElement | null>(null);
    let cropListener: EventListener | null = null;

    const viewportHandle: FlatVideoViewportHandle = {
      play: () => host.value?.play() ?? Promise.resolve(),
      pause: () => host.value?.pause(),
      stop: () => host.value?.stop(),
      seek: (time) => host.value?.seek(time),
      getCurrentTime: () => host.value?.getCurrentTime() ?? 0,
      getDuration: () => host.value?.getDuration() ?? 0,
      isPaused: () => host.value?.isPaused() ?? true,
      getOutputCanvas: () => host.value?.getOutputCanvas() ?? null,
      startRecording: () => host.value?.startRecording() ?? false,
      stopRecording: () => host.value?.stopRecording() ?? Promise.resolve(null),
    };
    expose(viewportHandle);

    function applyAttrs(): void {
      const el = host.value;
      if (!el) {
        return;
      }
      syncAttr(el, 'source-width', props.sourceWidth);
      syncAttr(el, 'source-height', props.sourceHeight);
      syncAttr(el, 'crop-x', props.cropX);
      syncAttr(el, 'crop-y', props.cropY);
      syncAttr(el, 'crop-width', props.cropWidth);
      syncAttr(el, 'crop-height', props.cropHeight);
      syncAttr(el, 'output-width', props.outputWidth);
      syncAttr(el, 'output-height', props.outputHeight);
      syncAttr(el, 'lock-aspect-ratio', props.lockAspectRatio);
      syncProperty(el, 'videoSrc', props.videoSrc ?? null);
      syncProperty(el, 'outputPreviewHost', props.outputPreviewHost ?? null);
    }

    onMounted(() => {
      const el = host.value;
      if (!el) {
        return;
      }
      applyAttrs();
      cropListener = (event) => {
        props.onCropChange?.((event as CustomEvent<FlatVideoCropChange>).detail);
      };
      el.addEventListener('crop-change', cropListener);
    });

    onBeforeUnmount(() => {
      if (cropListener && host.value) {
        host.value.removeEventListener('crop-change', cropListener);
      }
    });

    watch(
      () => [
        props.videoSrc,
        props.sourceWidth,
        props.sourceHeight,
        props.cropX,
        props.cropY,
        props.cropWidth,
        props.cropHeight,
        props.outputWidth,
        props.outputHeight,
        props.lockAspectRatio,
        props.outputPreviewHost,
      ],
      () => applyAttrs(),
    );

    return () =>
      h(DB_FLAT_VIDEO_VIEWPORT_TAG, {
        ref: host,
        class: props.className,
        style: props.style,
      });
  },
});

export const FlatVideoViewportComponent = FlatVideoViewport;
