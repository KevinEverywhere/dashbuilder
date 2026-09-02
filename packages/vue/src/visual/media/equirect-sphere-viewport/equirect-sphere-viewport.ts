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
import {
  DB_EQUIRECT_SPHERE_VIEWPORT_TAG,
  registerRdEquirectSphereViewport,
  type EquirectSphereCameraChange,
  type EquirectSphereOutputSizeChange,
} from '@rosettadash/web-components/visual/media/equirect-sphere-viewport';

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
  style?: StyleValue;
  outputPreviewHost?: HTMLElement | null;
  resetExportReferenceToken?: number;
  /** Increment when app pushes new output dimensions (preset/custom fields), not on CE drag. */
  outputSizeCommitToken?: number;
  onCameraChange?: (detail: EquirectSphereCameraChange) => void;
  onOutputSizeChange?: (detail: EquirectSphereOutputSizeChange) => void;
}

type MediaViewportElement = HTMLElement & EquirectSphereViewportHandle;

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

/** Vue host for `<rd-equirect-sphere-viewport>` (WC reference implementation). */
export const EquirectSphereViewport = defineComponent({
  name: 'EquirectSphereViewport',
  props: {
    videoSrc: { type: String as PropType<string | null | undefined>, default: undefined },
    flipInterior: { type: Boolean, default: undefined },
    yaw: { type: Number, default: undefined },
    pitch: { type: Number, default: undefined },
    horizontalFov: { type: Number, default: undefined },
    outputWidth: { type: Number, default: undefined },
    outputHeight: { type: Number, default: undefined },
    minHorizontalFov: { type: Number, default: undefined },
    maxHorizontalFov: { type: Number, default: undefined },
    className: { type: String, default: undefined },
    style: { type: [String, Object] as PropType<StyleValue>, default: undefined },
    outputPreviewHost: {
      type: Object as PropType<HTMLElement | null | undefined>,
      default: undefined,
    },
    resetExportReferenceToken: { type: Number, default: undefined },
    outputSizeCommitToken: { type: Number, default: undefined },
    onCameraChange: {
      type: Function as PropType<(detail: EquirectSphereCameraChange) => void>,
      default: undefined,
    },
    onOutputSizeChange: {
      type: Function as PropType<(detail: EquirectSphereOutputSizeChange) => void>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    registerRdEquirectSphereViewport();
    const host = ref<MediaViewportElement | null>(null);
    const listeners: Array<[string, EventListener]> = [];

    const viewportHandle: EquirectSphereViewportHandle = {
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

    function syncCameraAttrs(): void {
      const el = host.value;
      if (!el) {
        return;
      }
      syncAttr(el, 'flip-interior', props.flipInterior);
      syncAttr(el, 'yaw', props.yaw);
      syncAttr(el, 'pitch', props.pitch);
      syncAttr(el, 'horizontal-fov', props.horizontalFov);
      syncAttr(el, 'min-horizontal-fov', props.minHorizontalFov);
      syncAttr(el, 'max-horizontal-fov', props.maxHorizontalFov);
    }

    function syncVideoSrc(): void {
      const el = host.value;
      if (!el) {
        return;
      }
      syncProperty(el, 'videoSrc', props.videoSrc ?? null);
    }

    function syncOutputPreviewHost(): void {
      const el = host.value;
      if (!el) {
        return;
      }
      syncProperty(el, 'outputPreviewHost', props.outputPreviewHost ?? null);
    }

    function syncStaticAttrs(): void {
      syncCameraAttrs();
      syncVideoSrc();
      syncOutputPreviewHost();
    }

    function commitOutputSize(): void {
      const el = host.value;
      if (!el || !props.outputSizeCommitToken) {
        return;
      }
      syncAttr(el, 'output-width', props.outputWidth);
      syncAttr(el, 'output-height', props.outputHeight);
    }

    onMounted(() => {
      const el = host.value;
      if (!el) {
        return;
      }
      syncStaticAttrs();
      commitOutputSize();
      const onCamera: EventListener = (event) => {
        props.onCameraChange?.((event as CustomEvent<EquirectSphereCameraChange>).detail);
      };
      const onOutputSize: EventListener = (event) => {
        props.onOutputSizeChange?.((event as CustomEvent<EquirectSphereOutputSizeChange>).detail);
      };
      el.addEventListener('camera-change', onCamera);
      el.addEventListener('output-size-change', onOutputSize);
      listeners.push(['camera-change', onCamera], ['output-size-change', onOutputSize]);
    });

    onBeforeUnmount(() => {
      const el = host.value;
      for (const [name, listener] of listeners) {
        el?.removeEventListener(name, listener);
      }
    });

    watch(
      () => [
        props.flipInterior,
        props.yaw,
        props.pitch,
        props.horizontalFov,
        props.minHorizontalFov,
        props.maxHorizontalFov,
      ],
      () => syncCameraAttrs(),
    );

    watch(() => props.videoSrc, () => syncVideoSrc());

    watch(() => props.outputPreviewHost, () => syncOutputPreviewHost());

    watch(
      () => props.outputSizeCommitToken,
      () => commitOutputSize(),
    );

    watch(
      () => props.resetExportReferenceToken,
      (token) => {
        if (token && host.value) {
          syncProperty(host.value, 'resetExportReference', true);
        }
      },
    );

    return () =>
      h(DB_EQUIRECT_SPHERE_VIEWPORT_TAG, {
        ref: host,
        class: props.className,
        style: props.style,
      });
  },
});

export const EquirectSphereViewportComponent = EquirectSphereViewport;
