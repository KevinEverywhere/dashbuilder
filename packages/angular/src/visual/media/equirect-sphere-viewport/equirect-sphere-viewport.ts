import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import {
  DB_EQUIRECT_SPHERE_VIEWPORT_TAG,
  registerRdEquirectSphereViewport,
  type EquirectSphereCameraChange,
  type EquirectSphereOutputSizeChange,
} from '@rosettadash/web-components/visual/media/equirect-sphere-viewport';
import {
  attachHostEvents,
  setHostAttribute,
  setHostProperty,
} from '../../../lib/custom-element-host';
import { delegateViewportMethods } from '../../../lib/viewport-delegate';

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

/** Public props for visual/media/equirect-sphere-viewport. */
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
  outputPreviewElement?: HTMLElement | null;
  resetExportReferenceToken?: number;
  outputSizeCommitToken?: number;
}

/** Angular host for `<rd-equirect-sphere-viewport>` (WC reference implementation). */
@Component({
  selector: DB_EQUIRECT_SPHERE_VIEWPORT_TAG,
  standalone: true,
  template: '',
})
export class EquirectSphereViewport implements OnInit, OnDestroy, EquirectSphereViewportHandle {
  private readonly host = inject(ElementRef<HTMLElement>);
  private detachEvents: (() => void) | undefined;
  private ready = false;
  private lastResetToken = 0;
  private lastOutputSizeCommitToken = 0;

  readonly videoSrc = input<string | null | undefined>(undefined);
  readonly flipInterior = input<boolean | undefined>(undefined);
  readonly yaw = input<number | undefined>(undefined);
  readonly pitch = input<number | undefined>(undefined);
  readonly horizontalFov = input<number | undefined>(undefined);
  readonly outputWidth = input<number | undefined>(undefined);
  readonly outputHeight = input<number | undefined>(undefined);
  readonly minHorizontalFov = input<number | undefined>(undefined);
  readonly maxHorizontalFov = input<number | undefined>(undefined);
  readonly className = input<string | undefined>(undefined);
  readonly outputPreviewElement = input<HTMLElement | null | undefined>(undefined);
  readonly resetExportReferenceToken = input<number | undefined>(undefined);
  readonly outputSizeCommitToken = input<number | undefined>(undefined);

  readonly cameraChange = output<EquirectSphereCameraChange>();
  readonly outputSizeChange = output<EquirectSphereOutputSizeChange>();

  private readonly delegate = () => delegateViewportMethods(this.host.nativeElement);

  play = (): Promise<void> => this.delegate().play();
  pause = (): void => this.delegate().pause();
  stop = (): void => this.delegate().stop();
  seek = (time: number): void => this.delegate().seek(time);
  getCurrentTime = (): number => this.delegate().getCurrentTime();
  getDuration = (): number => this.delegate().getDuration();
  isPaused = (): boolean => this.delegate().isPaused();
  getOutputCanvas = (): HTMLCanvasElement | null => this.delegate().getOutputCanvas();
  startRecording = (): boolean => this.delegate().startRecording();
  stopRecording = (): Promise<Blob | null> => this.delegate().stopRecording();

  constructor() {
    effect(() => {
      this.videoSrc();
      this.flipInterior();
      this.yaw();
      this.pitch();
      this.horizontalFov();
      this.minHorizontalFov();
      this.maxHorizontalFov();
      this.className();
      this.outputPreviewElement();
      const token = this.resetExportReferenceToken();
      const outputSizeToken = this.outputSizeCommitToken();
      if (this.ready) {
        this.syncFromInputs();
        if (outputSizeToken && outputSizeToken !== this.lastOutputSizeCommitToken) {
          this.lastOutputSizeCommitToken = outputSizeToken;
          this.commitOutputSize();
        }
        if (token && token !== this.lastResetToken) {
          this.lastResetToken = token;
          setHostProperty(this.host.nativeElement, 'resetExportReference', true);
        }
      }
    });
  }

  ngOnInit(): void {
    registerRdEquirectSphereViewport();
    this.ready = true;
    this.syncFromInputs();
    const outputSizeToken = this.outputSizeCommitToken();
    if (outputSizeToken) {
      this.lastOutputSizeCommitToken = outputSizeToken;
      this.commitOutputSize();
    }
    this.detachEvents = attachHostEvents(this.host.nativeElement, {
      'camera-change': (detail: unknown) =>
        this.cameraChange.emit(detail as EquirectSphereCameraChange),
      'output-size-change': (detail: unknown) =>
        this.outputSizeChange.emit(detail as EquirectSphereOutputSizeChange),
    });
  }

  ngOnDestroy(): void {
    this.detachEvents?.();
  }

  private syncFromInputs(): void {
    const el = this.host.nativeElement;
    setHostAttribute(el, 'flip-interior', this.flipInterior());
    setHostAttribute(el, 'yaw', this.yaw());
    setHostAttribute(el, 'pitch', this.pitch());
    setHostAttribute(el, 'horizontal-fov', this.horizontalFov());
    setHostAttribute(el, 'min-horizontal-fov', this.minHorizontalFov());
    setHostAttribute(el, 'max-horizontal-fov', this.maxHorizontalFov());
    setHostProperty(el, 'videoSrc', this.videoSrc() ?? null);
    setHostProperty(el, 'outputPreviewHost', this.outputPreviewElement() ?? null);
    if (this.className()) {
      el.setAttribute('class', this.className()!);
    } else {
      el.removeAttribute('class');
    }
  }

  private commitOutputSize(): void {
    const el = this.host.nativeElement;
    setHostAttribute(el, 'output-width', this.outputWidth());
    setHostAttribute(el, 'output-height', this.outputHeight());
  }
}
