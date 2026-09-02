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
import type { FlatCropRect } from '@rosettadash/core';
import {
  DB_FLAT_VIDEO_VIEWPORT_TAG,
  registerRdFlatVideoViewport,
} from '@rosettadash/web-components/visual/media/flat-video-viewport';
import {
  attachHostEvents,
  setHostAttribute,
  setHostProperty,
} from '../../../lib/custom-element-host';
import { delegateViewportMethods } from '../../../lib/viewport-delegate';

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

/** Angular host for `<rd-flat-video-viewport>` (WC reference implementation). */
@Component({
  selector: DB_FLAT_VIDEO_VIEWPORT_TAG,
  standalone: true,
  template: '',
})
export class FlatVideoViewport implements OnInit, OnDestroy, FlatVideoViewportHandle {
  private readonly host = inject(ElementRef<HTMLElement>);
  private detachEvents: (() => void) | undefined;
  private ready = false;

  readonly videoSrc = input<string | null | undefined>(undefined);
  readonly sourceWidth = input<number | undefined>(undefined);
  readonly sourceHeight = input<number | undefined>(undefined);
  readonly cropX = input<number | undefined>(undefined);
  readonly cropY = input<number | undefined>(undefined);
  readonly cropWidth = input<number | undefined>(undefined);
  readonly cropHeight = input<number | undefined>(undefined);
  readonly outputWidth = input<number | undefined>(undefined);
  readonly outputHeight = input<number | undefined>(undefined);
  readonly lockAspectRatio = input<boolean | undefined>(undefined);
  readonly className = input<string | undefined>(undefined);
  readonly outputPreviewElement = input<HTMLElement | null | undefined>(undefined);

  readonly cropChange = output<FlatVideoCropChange>();

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
      this.sourceWidth();
      this.sourceHeight();
      this.cropX();
      this.cropY();
      this.cropWidth();
      this.cropHeight();
      this.outputWidth();
      this.outputHeight();
      this.lockAspectRatio();
      this.className();
      this.outputPreviewElement();
      if (this.ready) {
        this.syncFromInputs();
      }
    });
  }

  ngOnInit(): void {
    registerRdFlatVideoViewport();
    this.ready = true;
    this.syncFromInputs();
    this.detachEvents = attachHostEvents(this.host.nativeElement, {
      'crop-change': (detail: unknown) => this.cropChange.emit(detail as FlatVideoCropChange),
    });
  }

  ngOnDestroy(): void {
    this.detachEvents?.();
  }

  private syncFromInputs(): void {
    const el = this.host.nativeElement;
    setHostAttribute(el, 'source-width', this.sourceWidth());
    setHostAttribute(el, 'source-height', this.sourceHeight());
    setHostAttribute(el, 'crop-x', this.cropX());
    setHostAttribute(el, 'crop-y', this.cropY());
    setHostAttribute(el, 'crop-width', this.cropWidth());
    setHostAttribute(el, 'crop-height', this.cropHeight());
    setHostAttribute(el, 'output-width', this.outputWidth());
    setHostAttribute(el, 'output-height', this.outputHeight());
    setHostAttribute(el, 'lock-aspect-ratio', this.lockAspectRatio());
    setHostProperty(el, 'videoSrc', this.videoSrc() ?? null);
    setHostProperty(el, 'outputPreviewHost', this.outputPreviewElement() ?? null);
    if (this.className()) {
      el.setAttribute('class', this.className()!);
    } else {
      el.removeAttribute('class');
    }
  }
}
