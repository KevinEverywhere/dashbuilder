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
  DB_WASM_MEDIA_TAG,
  registerRdWasmMedia,
} from '@rosettadash/web-components/visual/wasm/media';
import type { AuthoringRecordRange } from '@rosettadash/core';
import {
  attachHostEvents,
  setHostAttribute,
  setHostProperty,
} from '../../../lib/custom-element-host';

export interface WasmMediaProps {
  label?: string;
  operation?: string;
  extractionMode?: 'flat-crop' | 'rectilinear';
  outputFormat?: string;
  showProgress?: boolean;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  outputWidth?: number;
  outputHeight?: number;
  yaw?: number;
  pitch?: number;
  horizontalFov?: number;
  reverse?: boolean;
  inputFile?: File | Blob | null;
  cropRegion?: Record<string, string | number | boolean | null | undefined> | null;
  recordRange?: AuthoringRecordRange | null;
  previewRecording?: Blob | null;
  className?: string;
}

/** Angular host for `<rd-wasm-media>`. */
@Component({
  selector: DB_WASM_MEDIA_TAG,
  standalone: true,
  template: '',
})
export class WasmMedia implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private detachEvents: (() => void) | undefined;
  private ready = false;

  readonly label = input<string | undefined>(undefined);
  readonly operation = input<string | undefined>(undefined);
  readonly extractionMode = input<'flat-crop' | 'rectilinear' | undefined>(undefined);
  readonly outputFormat = input<string | undefined>(undefined);
  readonly showProgress = input<boolean | undefined>(undefined);
  readonly cropX = input<number | undefined>(undefined);
  readonly cropY = input<number | undefined>(undefined);
  readonly cropWidth = input<number | undefined>(undefined);
  readonly cropHeight = input<number | undefined>(undefined);
  readonly outputWidth = input<number | undefined>(undefined);
  readonly outputHeight = input<number | undefined>(undefined);
  readonly yaw = input<number | undefined>(undefined);
  readonly pitch = input<number | undefined>(undefined);
  readonly horizontalFov = input<number | undefined>(undefined);
  readonly reverse = input<boolean | undefined>(undefined);
  readonly inputFile = input<File | Blob | null | undefined>(undefined);
  readonly cropRegion = input<
    Record<string, string | number | boolean | null | undefined> | null | undefined
  >(undefined);
  readonly recordRange = input<AuthoringRecordRange | null | undefined>(undefined);
  readonly previewRecording = input<Blob | null | undefined>(undefined);
  readonly className = input<string | undefined>(undefined);

  readonly progress = output<{ progress: number }>();
  readonly extractComplete = output<{
    blob: Blob;
    metadata: Record<string, string | number | boolean | null | undefined>;
  }>();
  readonly extractError = output<{ message: string }>();
  readonly metadata = output<
    Record<string, string | number | boolean | null | undefined>
  >();

  constructor() {
    effect(() => {
      this.label();
      this.operation();
      this.extractionMode();
      this.outputFormat();
      this.showProgress();
      this.cropX();
      this.cropY();
      this.cropWidth();
      this.cropHeight();
      this.outputWidth();
      this.outputHeight();
      this.yaw();
      this.pitch();
      this.horizontalFov();
      this.reverse();
      this.inputFile();
      this.cropRegion();
      this.recordRange();
      this.previewRecording();
      this.className();
      if (this.ready) {
        this.syncFromInputs();
      }
    });
  }

  ngOnInit(): void {
    registerRdWasmMedia();
    this.ready = true;
    this.syncFromInputs();
    this.detachEvents = attachHostEvents(this.host.nativeElement, {
      progress: (detail: unknown) =>
        this.progress.emit(detail as { progress: number }),
      'extract-complete': (detail: unknown) =>
        this.extractComplete.emit(
          detail as {
            blob: Blob;
            metadata: Record<string, string | number | boolean | null | undefined>;
          },
        ),
      'extract-error': (detail: unknown) =>
        this.extractError.emit(detail as { message: string }),
      metadata: (detail: unknown) =>
        this.metadata.emit(
          detail as Record<string, string | number | boolean | null | undefined>,
        ),
    });
  }

  ngOnDestroy(): void {
    this.detachEvents?.();
  }

  private syncFromInputs(): void {
    const el = this.host.nativeElement;
    setHostAttribute(el, 'label', this.label());
    setHostAttribute(el, 'operation', this.operation());
    setHostAttribute(el, 'extraction-mode', this.extractionMode());
    setHostAttribute(el, 'output-format', this.outputFormat());
    setHostAttribute(el, 'show-progress', this.showProgress());
    setHostAttribute(el, 'crop-x', this.cropX());
    setHostAttribute(el, 'crop-y', this.cropY());
    setHostAttribute(el, 'crop-width', this.cropWidth());
    setHostAttribute(el, 'crop-height', this.cropHeight());
    setHostAttribute(el, 'output-width', this.outputWidth());
    setHostAttribute(el, 'output-height', this.outputHeight());
    setHostAttribute(el, 'yaw', this.yaw());
    setHostAttribute(el, 'pitch', this.pitch());
    setHostAttribute(el, 'horizontal-fov', this.horizontalFov());
    setHostAttribute(el, 'reverse', this.reverse());
    setHostProperty(el, 'inputFile', this.inputFile() ?? null);
    setHostProperty(el, 'cropRegion', this.cropRegion() ?? null);
    setHostProperty(el, 'recordRange', this.recordRange() ?? null);
    setHostProperty(el, 'previewRecording', this.previewRecording() ?? null);
    if (this.className()) {
      el.setAttribute('class', this.className()!);
    } else {
      el.removeAttribute('class');
    }
  }
}
