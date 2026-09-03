import {
  buildEquirectExtractFilter,
  buildAuthoringExtractFfmpegArgs,
  buildPreviewRecordingTranscodeArgs,
  DEFAULT_EQUIRECT_FLAT_CROP,
  formatFfmpegError,
  isValidAuthoringRecordRange,
  loadFfmpegCore,
  normalizeAuthoringRecordRange,
  resolveFfmpegCoreBaseUrl,
  type AuthoringRecordRange,
} from '@rosettadash/core';
import { defineRosettaElement, type DashRow, readNumber, readString } from '../../lib/element-utils.js';
import { applyShadowMount, ensureShadowBase, getShadowBase, loadShadowPairForTag } from '../../lib/shadow-base.js';
import { loadTextResource } from '../../lib/shadow-resources.js';

export const DB_WASM_MEDIA_TAG = 'rd-wasm-media';

type ExtractionMode = 'flat-crop' | 'rectilinear';

interface FfmpegModule {
  FFmpeg: new () => FfmpegInstance;
}

interface FfmpegUtilModule {
  fetchFile: (file: File | Blob) => Promise<Uint8Array>;
  toBlobURL: (url: string, mimeType: string) => Promise<string>;
}

interface FfmpegInstance {
  loaded: boolean;
  on(
    event: 'progress' | 'log',
    handler: (payload: { progress?: number; type?: string; message?: string }) => void,
  ): void;
  off?(
    event: 'progress' | 'log',
    handler: (payload: { progress?: number; type?: string; message?: string }) => void,
  ): void;
  load(options: { coreURL: string; wasmURL: string; workerURL?: string }): Promise<void | boolean>;
  writeFile(name: string, data: Uint8Array): Promise<void>;
  readFile(name: string, encoding?: string): Promise<Uint8Array>;
  exec(args: string[]): Promise<number>;
}

export class RdWasmMediaElement extends HTMLElement {
  static readonly tagName = DB_WASM_MEDIA_TAG;

  private ffmpeg: FfmpegInstance | null = null;
  private inputFile: File | Blob | null = null;
  private previewRecording: Blob | null = null;
  private cropRegion: DashRow | null = null;
  private busy = false;
  private progress = 0;
  private error: string | null = null;
  private resourcesReady: Promise<void> | null = null;
  private extractListener: (() => void) | null = null;

  static get observedAttributes(): string[] {
    return [
      'label',
      'operation',
      'extraction-mode',
      'output-format',
      'show-progress',
      'reverse',
      'yaw',
      'pitch',
      'horizontal-fov',
      'crop-x',
      'crop-y',
      'crop-width',
      'crop-height',
      'output-width',
      'output-height',
      'ffmpeg-core-base-url',
      'trim-start-sec',
      'trim-end-sec',
    ];
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    this.resourcesReady = this.mountShadow();
    void this.resourcesReady.then(() => this.paint());
  }

  disconnectedCallback(): void {
    const root = this.shadowRoot;
    const button = root?.querySelector('[data-role="extract"]');
    if (button && this.extractListener) {
      button.removeEventListener('click', this.extractListener);
    }
    this.extractListener = null;
  }

  attributeChangedCallback(): void {
    if (this.shadowRoot && this.resourcesReady) {
      void this.resourcesReady.then(() => this.paint());
    }
  }

  setProperty(name: string, value: unknown): void {
    if (name === 'inputFile') {
      if (value instanceof Blob) {
        this.inputFile = value;
      } else if (value && typeof value === 'object' && 'file' in value) {
        const file = (value as { file?: File | Blob }).file;
        this.inputFile = file instanceof Blob ? file : null;
      } else {
        this.inputFile = null;
      }
      if (this.shadowRoot && this.resourcesReady) {
        void this.resourcesReady.then(() => this.paint());
      }
    } else if (name === 'previewRecording') {
      this.previewRecording = value instanceof Blob ? value : null;
      if (this.shadowRoot && this.resourcesReady) {
        void this.resourcesReady.then(() => this.paint());
      }
    } else if (name === 'cropRegion' && value && typeof value === 'object') {
      this.cropRegion = value as DashRow;
      if (this.shadowRoot && this.resourcesReady) {
        void this.resourcesReady.then(() => this.paint());
      }
    } else if (name === 'recordRange') {
      if (value && typeof value === 'object') {
        const range = value as AuthoringRecordRange;
        this.setAttribute('trim-start-sec', String(range.startSec));
        this.setAttribute('trim-end-sec', String(range.endSec));
      } else {
        this.removeAttribute('trim-start-sec');
        this.removeAttribute('trim-end-sec');
      }
      if (this.shadowRoot && this.resourcesReady) {
        void this.resourcesReady.then(() => this.paint());
      }
    } else {
      const attrMap: Record<string, string> = {
        outputFormat: 'output-format',
        extractionMode: 'extraction-mode',
        cropX: 'crop-x',
        cropY: 'crop-y',
        cropWidth: 'crop-width',
        cropHeight: 'crop-height',
        outputWidth: 'output-width',
        outputHeight: 'output-height',
        trimStartSec: 'trim-start-sec',
        trimEndSec: 'trim-end-sec',
        yaw: 'yaw',
        pitch: 'pitch',
        horizontalFov: 'horizontal-fov',
        showProgress: 'show-progress',
        reverse: 'reverse',
      };
      const attr = attrMap[name] ?? name;
      if (value === null || value === undefined) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, String(value));
      }
    }
    if (this.resourcesReady) {
      void this.resourcesReady.then(() => this.paint());
    }
  }

  whenReady(): Promise<void> {
    return this.resourcesReady ?? Promise.resolve();
  }

  get label(): string {
    return readString(this.getAttribute('label'), 'Media transcode');
  }

  get operation(): string {
    return readString(this.getAttribute('operation'), 'transcode');
  }

  get extractionMode(): ExtractionMode {
    const mode = readString(this.getAttribute('extraction-mode'), 'flat-crop');
    return mode === 'rectilinear' ? 'rectilinear' : 'flat-crop';
  }

  get outputFormat(): string {
    return readString(this.getAttribute('output-format'), 'mp4');
  }

  get showProgress(): boolean {
    return this.getAttribute('show-progress') !== 'false';
  }

  get reverse(): boolean {
    const value = this.getAttribute('reverse');
    return value === 'true' || value === '';
  }

  get filterPreview(): string {
    if (this.operation !== 'equirect-extract') {
      return '';
    }
    if (this.previewRecording) {
      if (this.outputFormat === 'webm') {
        return 'Output mirror recording → WebM (same clip as playback download)';
      }
      return 'Output mirror recording → MP4 (ffmpeg.wasm libx264 transcode)';
    }
    const crop = this.resolveCrop();
    return buildEquirectExtractFilter(this.extractionMode, {
      ...crop,
      yaw: readNumber(this.getAttribute('yaw'), 0),
      pitch: readNumber(this.getAttribute('pitch'), 0),
      horizontalFov: readNumber(this.getAttribute('horizontal-fov'), 90),
      reverse: this.reverse,
    });
  }

  private resolveCrop() {
    return {
      cropX: readNumber(this.cropRegion?.['cropX'] ?? this.getAttribute('crop-x'), DEFAULT_EQUIRECT_FLAT_CROP.cropX),
      cropY: readNumber(this.cropRegion?.['cropY'] ?? this.getAttribute('crop-y'), DEFAULT_EQUIRECT_FLAT_CROP.cropY),
      cropWidth: readNumber(
        this.cropRegion?.['cropWidth'] ?? this.getAttribute('crop-width'),
        DEFAULT_EQUIRECT_FLAT_CROP.cropWidth,
      ),
      cropHeight: readNumber(
        this.cropRegion?.['cropHeight'] ?? this.getAttribute('crop-height'),
        DEFAULT_EQUIRECT_FLAT_CROP.cropHeight,
      ),
      outputWidth: readNumber(
        this.cropRegion?.['outputWidth'] ?? this.getAttribute('output-width'),
        DEFAULT_EQUIRECT_FLAT_CROP.outputWidth,
      ),
      outputHeight: readNumber(
        this.cropRegion?.['outputHeight'] ?? this.getAttribute('output-height'),
        DEFAULT_EQUIRECT_FLAT_CROP.outputHeight,
      ),
    };
  }

  private async mountShadow(): Promise<void> {
    const root = this.shadowRoot;
    if (!root || root.querySelector('[data-ref="root"]')) {
      return;
    }
    const pair = await loadShadowPairForTag(
      DB_WASM_MEDIA_TAG,
      './rd-wasm-media.html',
      './rd-wasm-media.css',
    );
    const panelCss = await loadTextResource('../../lib/panel.css', getShadowBase(DB_WASM_MEDIA_TAG));
    applyShadowMount(root, { html: pair.html, css: `${panelCss}\n${pair.css}` });
  }

  private paint(): void {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    const labelEl = root.querySelector('[data-ref="label"]');
    const metaEl = root.querySelector('[data-ref="meta"]');
    if (labelEl) {
      labelEl.textContent = this.label;
    }
    if (metaEl) {
      metaEl.textContent = `${this.operation} → ${this.outputFormat}`;
    }

    const filterEl = root.querySelector('[data-ref="filter"]') as HTMLElement;
    if (this.filterPreview) {
      filterEl.hidden = false;
      filterEl.textContent = this.filterPreview;
    } else {
      filterEl.hidden = true;
    }

    const progressEl = root.querySelector('[data-ref="progress"]') as HTMLElement;
    const progressBar = root.querySelector('[data-ref="progress-bar"]') as HTMLElement;
    const showExtractProgress =
      this.showProgress &&
      this.operation === 'equirect-extract' &&
      (!this.previewRecording || this.outputFormat !== 'webm');
    if (showExtractProgress) {
      progressEl.hidden = false;
      progressEl.setAttribute('aria-valuenow', String(this.progress));
      progressBar.style.width = `${this.progress}%`;
    } else {
      progressEl.hidden = true;
    }

    const canExtract = this.canExtract();

    const actions = root.querySelector('[data-ref="actions"]');
    if (actions) {
      if (this.operation === 'equirect-extract') {
        actions.innerHTML = `<button type="button" data-role="extract" ${
          this.busy || !canExtract ? 'disabled' : ''
        }>${this.busy ? 'Extracting…' : 'Extract subsection'}</button>`;
      } else {
        actions.innerHTML =
          '<p class="wasm-media__hint">Set operation to equirect-extract and attach a video file.</p>';
      }
    }

    const errorEl = root.querySelector('[data-ref="error"]') as HTMLElement;
    if (this.error) {
      errorEl.hidden = false;
      errorEl.textContent = this.error;
    } else {
      errorEl.hidden = true;
    }

    const button = root.querySelector('[data-role="extract"]');
    if (button) {
      if (this.extractListener) {
        button.removeEventListener('click', this.extractListener);
      }
      this.extractListener = () => {
        void this.runEquirectExtract();
      };
      button.addEventListener('click', this.extractListener);
    }
  }

  private resolveTrim(): AuthoringRecordRange | null {
    const startSec = readNumber(this.getAttribute('trim-start-sec'), Number.NaN);
    const endSec = readNumber(this.getAttribute('trim-end-sec'), Number.NaN);
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) {
      return null;
    }
    return { startSec, endSec };
  }

  private hasValidTrim(): boolean {
    return isValidAuthoringRecordRange(this.resolveTrim());
  }

  private canExtract(): boolean {
    return this.hasValidTrim() && (this.previewRecording != null || this.inputFile != null);
  }

  private requireValidTrim(): AuthoringRecordRange | null {
    const trim = this.resolveTrim();
    if (!trim || !isValidAuthoringRecordRange(trim)) {
      return null;
    }
    return trim;
  }

  private async runPreviewRecordingExtract(): Promise<void> {
    const trim = this.requireValidTrim();
    if (!trim) {
      this.emitExtractError('Record a segment on the timeline before extracting.');
      return;
    }
    const source = this.previewRecording;
    if (!source || source.size <= 0) {
      this.emitExtractError('Record a segment on the playback bar before extracting.');
      return;
    }

    const crop = this.resolveCrop();
    const trimMeta = normalizeAuthoringRecordRange(trim);
    const baseMetadata: DashRow = {
      source: 'preview-recording',
      outputWidth: crop.outputWidth,
      outputHeight: crop.outputHeight,
      trimStartSec: trim.startSec,
      trimEndSec: trim.endSec,
      trimDurationSec: trimMeta?.durationSec ?? 0,
      reverse: this.reverse,
    };

    if (this.outputFormat === 'webm') {
      this.busy = true;
      this.error = null;
      this.paint();
      const metadata: DashRow = {
        ...baseMetadata,
        format: 'webm',
      };
      this.dispatchEvent(
        new CustomEvent('extract-complete', {
          detail: { blob: source, metadata },
          bubbles: true,
          composed: true,
        }),
      );
      this.dispatchEvent(
        new CustomEvent('metadata', {
          detail: metadata,
          bubbles: true,
          composed: true,
        }),
      );
      this.busy = false;
      this.paint();
      return;
    }

    this.busy = true;
    this.error = null;
    this.progress = 0;
    this.paint();

    let logTail: string[] = [];
    try {
      const ffmpeg = await this.ensureFfmpeg();
      const logs = this.attachFfmpegLogs(ffmpeg);
      try {
        const utilModule = (await import('@ffmpeg/util')) as FfmpegUtilModule;
        const inputName = 'preview-recording.webm';
        const outputName = this.outputFileName();
        await ffmpeg.writeFile(inputName, await utilModule.fetchFile(source));
        const exitCode = await ffmpeg.exec(
          buildPreviewRecordingTranscodeArgs({
            inputName,
            outputName,
            reverse: this.reverse,
          }),
        );
        if (exitCode !== 0) {
          throw new Error(
            logs.tail().length
              ? logs.tail().join(' ')
              : `ffmpeg exited with code ${exitCode}`,
          );
        }
        const data = await ffmpeg.readFile(outputName, 'binary');
        const blob = this.blobFromFfmpegOutput(data);
        if (blob.size === 0) {
          throw new Error('ffmpeg produced an empty output file');
        }
        const metadata: DashRow = {
          ...baseMetadata,
          format: this.outputFormat,
        };
        this.dispatchEvent(
          new CustomEvent('extract-complete', {
            detail: { blob, metadata },
            bubbles: true,
            composed: true,
          }),
        );
        this.dispatchEvent(
          new CustomEvent('metadata', {
            detail: metadata,
            bubbles: true,
            composed: true,
          }),
        );
      } finally {
        logTail = logs.tail();
        logs.stop();
      }
    } catch (nextError) {
      this.emitExtractError(formatFfmpegError(nextError, logTail));
    } finally {
      this.busy = false;
      this.paint();
    }
  }

  private inputFileName(): string {
    if (this.inputFile instanceof File) {
      const extension = this.inputFile.name.split('.').pop()?.toLowerCase();
      if (extension && /^[a-z0-9]+$/.test(extension)) {
        return `input.${extension}`;
      }
    }
    return 'input.mp4';
  }

  private outputFileName(): string {
    const format = this.outputFormat.replace(/[^a-z0-9]/gi, '') || 'mp4';
    return `output.${format}`;
  }

  private emitExtractError(message: string): void {
    this.error = message;
    this.dispatchEvent(
      new CustomEvent('extract-error', {
        detail: { message },
        bubbles: true,
        composed: true,
      }),
    );
    this.paint();
  }

  private blobFromFfmpegOutput(data: Uint8Array | string): Blob {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const mime =
      this.outputFormat === 'webm'
        ? 'video/webm'
        : this.outputFormat === 'mp4'
          ? 'video/mp4'
          : `video/${this.outputFormat}`;
    return new Blob([Uint8Array.from(bytes)], { type: mime });
  }

  private async ensureFfmpeg(): Promise<FfmpegInstance> {
    if (this.ffmpeg?.loaded) {
      return this.ffmpeg;
    }

    let ffmpegModule: FfmpegModule;
    let utilModule: FfmpegUtilModule;
    try {
      ffmpegModule = (await import('@ffmpeg/ffmpeg')) as unknown as FfmpegModule;
      utilModule = (await import('@ffmpeg/util')) as unknown as FfmpegUtilModule;
    } catch {
      throw new Error('Install @ffmpeg/ffmpeg and @ffmpeg/util to run equirect extract.');
    }

    const ffmpeg = new ffmpegModule.FFmpeg();
    ffmpeg.on('progress', ({ progress = 0 }) => {
      this.progress = Math.round(progress * 100);
      this.dispatchEvent(
        new CustomEvent('progress', {
          detail: { progress: this.progress },
          bubbles: true,
          composed: true,
        }),
      );
      this.paint();
    });

    const baseURL = resolveFfmpegCoreBaseUrl(this.getAttribute('ffmpeg-core-base-url'));
    await loadFfmpegCore(ffmpeg, utilModule, baseURL);

    this.ffmpeg = ffmpeg;
    return ffmpeg;
  }

  private attachFfmpegLogs(ffmpeg: FfmpegInstance) {
    const lines: string[] = [];
    const handler = ({ message }: { message?: string }) => {
      const trimmed = message?.trim();
      if (!trimmed) {
        return;
      }
      lines.push(trimmed);
      if (lines.length > 12) {
        lines.shift();
      }
    };
    ffmpeg.on('log', handler);
    return {
      tail: () => lines.slice(-4),
      stop: () => ffmpeg.off?.('log', handler),
    };
  }

  async runEquirectExtract(): Promise<void> {
    if (this.previewRecording) {
      await this.runPreviewRecordingExtract();
      return;
    }
    if (!this.inputFile) {
      this.emitExtractError('Attach a video file before extracting.');
      return;
    }
    const trim = this.requireValidTrim();
    if (!trim) {
      this.emitExtractError('Record a segment on the timeline before extracting.');
      return;
    }

    this.busy = true;
    this.error = null;
    this.progress = 0;
    this.paint();

    let logTail: string[] = [];
    try {
      const ffmpeg = await this.ensureFfmpeg();
      const logs = this.attachFfmpegLogs(ffmpeg);
      try {
        const utilModule = (await import('@ffmpeg/util')) as FfmpegUtilModule;
        const inputName = this.inputFileName();
        const outputName = this.outputFileName();
        const crop = this.resolveCrop();
        const filter = buildEquirectExtractFilter(this.extractionMode, {
          ...crop,
          yaw: readNumber(this.getAttribute('yaw'), 0),
          pitch: readNumber(this.getAttribute('pitch'), 0),
          horizontalFov: readNumber(this.getAttribute('horizontal-fov'), 90),
          reverse: this.reverse,
        });

        await ffmpeg.writeFile(inputName, await utilModule.fetchFile(this.inputFile));
        const exitCode = await ffmpeg.exec(
          buildAuthoringExtractFfmpegArgs({
            inputName,
            outputName,
            filter,
            trim,
          }),
        );
        if (exitCode !== 0) {
          throw new Error(
            logs.tail().length
              ? logs.tail().join(' ')
              : `ffmpeg exited with code ${exitCode}`,
          );
        }
        const data = await ffmpeg.readFile(outputName, 'binary');
        const blob = this.blobFromFfmpegOutput(data);
        if (blob.size === 0) {
          throw new Error('ffmpeg produced an empty output file');
        }
        const trimMeta = normalizeAuthoringRecordRange(trim);
        const metadata: DashRow = {
          filter,
          outputWidth: crop.outputWidth,
          outputHeight: crop.outputHeight,
          format: this.outputFormat,
          reverse: this.reverse,
          trimStartSec: trim.startSec,
          trimEndSec: trim.endSec,
          trimDurationSec: trimMeta?.durationSec ?? 0,
        };

        this.dispatchEvent(
          new CustomEvent('extract-complete', {
            detail: { blob, metadata },
            bubbles: true,
            composed: true,
          }),
        );
        this.dispatchEvent(
          new CustomEvent('metadata', {
            detail: metadata,
            bubbles: true,
            composed: true,
          }),
        );
      } finally {
        logTail = logs.tail();
        logs.stop();
      }
    } catch (nextError) {
      this.emitExtractError(formatFfmpegError(nextError, logTail));
    } finally {
      this.busy = false;
      this.paint();
    }
  }
}

export function registerRdWasmMedia(): void {
  ensureShadowBase(DB_WASM_MEDIA_TAG);
  defineRosettaElement(RdWasmMediaElement.tagName, RdWasmMediaElement);
}
