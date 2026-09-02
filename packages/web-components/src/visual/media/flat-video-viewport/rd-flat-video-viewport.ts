import { clampCropToSource, type FlatCropRect } from '@rosettadash/core';
import { defineRosettaElement, readNumber } from '../../../lib/element-utils.js';
import { applyCanvasContainDisplay } from '../contain-layout.js';
import { startCanvasRecorder, stopCanvasRecorder, type CanvasRecorderSession } from '../canvas-recorder.js';

export const DB_FLAT_VIDEO_VIEWPORT_TAG = 'rd-flat-video-viewport';

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function applyPreviewCanvasLayout(
  canvas: HTMLCanvasElement,
  cropWidth: number,
  cropHeight: number,
  host?: HTMLElement | null,
) {
  applyCanvasContainDisplay(canvas, cropWidth, cropHeight, host);
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

export class RdFlatVideoViewportElement extends HTMLElement {
  static readonly tagName = DB_FLAT_VIDEO_VIEWPORT_TAG;

  private frameEl: HTMLDivElement | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private cropEl: HTMLDivElement | null = null;
  private outputCanvas: HTMLCanvasElement | null = null;
  private outputPreviewHost: HTMLElement | null = null;
  private outputMirrorResizeObserver: ResizeObserver | null = null;
  private animationId = 0;
  private drag: {
    mode: DragMode;
    startX: number;
    startY: number;
    origin: FlatCropRect;
  } | null = null;
  private recorderSession: CanvasRecorderSession | null = null;
  private mounted = false;

  static get observedAttributes(): string[] {
    return [
      'video-src',
      'source-width',
      'source-height',
      'crop-x',
      'crop-y',
      'crop-width',
      'crop-height',
      'output-width',
      'output-height',
      'lock-aspect-ratio',
    ];
  }

  connectedCallback(): void {
    if (!this.mounted) {
      this.mountDom();
    }
    this.syncVideoSrc();
    this.paintCrop();
    this.ensureOutputMirror();
  }

  disconnectedCallback(): void {
    this.teardownOutputMirror();
    cancelAnimationFrame(this.animationId);
  }

  attributeChangedCallback(name: string): void {
    if (!this.mounted) {
      return;
    }
    if (name === 'video-src') {
      this.syncVideoSrc();
    }
    if (name.startsWith('crop-') || name === 'source-width' || name === 'source-height') {
      if (this.drag) {
        return;
      }
      this.paintCrop();
      this.resizeOutputCanvas();
    }
    if (name === 'output-width' || name === 'output-height') {
      this.resizeOutputCanvas();
    }
  }

  setProperty(name: string, value: unknown): void {
    if (name === 'outputPreviewHost') {
      const nextHost = value instanceof HTMLElement ? value : null;
      if (nextHost === this.outputPreviewHost) {
        return;
      }
      this.outputPreviewHost = nextHost;
      if (!this.outputPreviewHost) {
        this.teardownOutputMirror();
      } else {
        this.ensureOutputMirror();
      }
      return;
    }
    if (name === 'videoSrc') {
      if (value == null || value === '') {
        this.removeAttribute('video-src');
      } else {
        this.setAttribute('video-src', String(value));
      }
    }
  }

  get sourceWidth(): number {
    return readNumber(this.getAttribute('source-width'), 1920);
  }

  get sourceHeight(): number {
    return readNumber(this.getAttribute('source-height'), 1080);
  }

  get cropX(): number {
    return readNumber(this.getAttribute('crop-x'), 0);
  }

  get cropY(): number {
    return readNumber(this.getAttribute('crop-y'), 0);
  }

  get cropWidth(): number {
    return readNumber(this.getAttribute('crop-width'), 640);
  }

  get cropHeight(): number {
    return readNumber(this.getAttribute('crop-height'), 360);
  }

  get outputWidth(): number {
    return readNumber(this.getAttribute('output-width'), 640);
  }

  get outputHeight(): number {
    return readNumber(this.getAttribute('output-height'), 360);
  }

  get lockAspectRatio(): boolean {
    return this.hasAttribute('lock-aspect-ratio');
  }

  async play(): Promise<void> {
    if (!this.videoEl) {
      return;
    }
    await this.videoEl.play();
  }

  pause(): void {
    this.videoEl?.pause();
  }

  stop(): void {
    if (!this.videoEl) {
      return;
    }
    this.videoEl.pause();
    this.videoEl.currentTime = 0;
  }

  seek(time: number): void {
    if (!this.videoEl) {
      return;
    }
    this.videoEl.currentTime = clamp(time, 0, this.videoEl.duration || time);
  }

  getCurrentTime(): number {
    return this.videoEl?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.videoEl?.duration ?? 0;
  }

  isPaused(): boolean {
    return this.videoEl?.paused ?? true;
  }

  getOutputCanvas(): HTMLCanvasElement | null {
    return this.outputCanvas;
  }

  startRecording(): boolean {
    this.ensureOutputMirror();
    const canvas = this.outputCanvas;
    if (!canvas || this.recorderSession) {
      return false;
    }
    const session = startCanvasRecorder(canvas);
    if (!session) {
      return false;
    }
    this.recorderSession = session;
    return true;
  }

  stopRecording(): Promise<Blob | null> {
    const session = this.recorderSession;
    this.recorderSession = null;
    return stopCanvasRecorder(session);
  }

  private mountDom(): void {
    this.innerHTML = `
      <div class="rd-flat-video-viewport__frame" data-ref="frame">
        <video class="rd-flat-video-viewport__video" data-ref="video" muted playsinline crossorigin="anonymous"></video>
        <div class="rd-flat-video-viewport__crop" data-ref="crop">
          <span class="rd-flat-video-viewport__handle rd-flat-video-viewport__handle--nw" data-handle="nw"></span>
          <span class="rd-flat-video-viewport__handle rd-flat-video-viewport__handle--se" data-handle="se"></span>
          <span class="rd-flat-video-viewport__handle rd-flat-video-viewport__handle--sw" data-handle="sw"></span>
          <span class="rd-flat-video-viewport__handle rd-flat-video-viewport__handle--ne" data-handle="ne"></span>
        </div>
      </div>`;
    this.setAttribute('data-testid', DB_FLAT_VIDEO_VIEWPORT_TAG);
    this.frameEl = this.querySelector('[data-ref="frame"]');
    this.videoEl = this.querySelector('[data-ref="video"]');
    this.cropEl = this.querySelector('[data-ref="crop"]');
    this.cropEl?.addEventListener('pointerdown', (event) => this.onPointerDown(event, 'move'));
    this.querySelectorAll('[data-handle]').forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        const mode = (handle as HTMLElement).dataset['handle'] as DragMode;
        this.onPointerDown(event, mode);
      });
    });
    if (this.frameEl) {
      this.frameEl.style.aspectRatio = `${this.sourceWidth} / ${this.sourceHeight}`;
    }
    this.mounted = true;
  }

  private syncVideoSrc(): void {
    const src = this.getAttribute('video-src');
    const video = this.videoEl;
    if (!video || !src) {
      return;
    }
    video.src = src;
    video.load();
    video.addEventListener(
      'loadedmetadata',
      () => {
        this.paintCrop();
      },
      { once: true },
    );
    void video.play().catch(() => undefined);
  }

  private paintCrop(): void {
    const sw = this.sourceWidth;
    const sh = this.sourceHeight;
    if (!this.cropEl || sw <= 0 || sh <= 0) {
      return;
    }
    this.cropEl.style.left = `${(this.cropX / sw) * 100}%`;
    this.cropEl.style.top = `${(this.cropY / sh) * 100}%`;
    this.cropEl.style.width = `${(this.cropWidth / sw) * 100}%`;
    this.cropEl.style.height = `${(this.cropHeight / sh) * 100}%`;
    if (this.frameEl) {
      this.frameEl.style.aspectRatio = `${sw} / ${sh}`;
    }
  }

  private emitCrop(next: FlatCropRect, silent = false): void {
    const clamped = clampCropToSource(next, this.sourceWidth, this.sourceHeight);
    this.setAttribute('crop-x', String(clamped.cropX));
    this.setAttribute('crop-y', String(clamped.cropY));
    this.setAttribute('crop-width', String(clamped.cropWidth));
    this.setAttribute('crop-height', String(clamped.cropHeight));
    if (silent) {
      this.paintCrop();
      this.resizeOutputCanvas();
      return;
    }
    this.dispatchEvent(
      new CustomEvent('crop-change', {
        detail: clamped,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private pointerToSource(clientX: number, clientY: number): { x: number; y: number } {
    const frame = this.frameEl;
    if (!frame) {
      return { x: 0, y: 0 };
    }
    const rect = frame.getBoundingClientRect();
    const sw = this.sourceWidth;
    const sh = this.sourceHeight;
    return {
      x: clamp(((clientX - rect.left) / rect.width) * sw, 0, sw),
      y: clamp(((clientY - rect.top) / rect.height) * sh, 0, sh),
    };
  }

  private onPointerDown(event: Event, mode: DragMode): void {
    const pointerEvent = event as PointerEvent;
    if (pointerEvent.button !== 0) {
      return;
    }
    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    const pointer = this.pointerToSource(pointerEvent.clientX, pointerEvent.clientY);
    this.drag = {
      mode,
      startX: pointer.x,
      startY: pointer.y,
      origin: {
        cropX: this.cropX,
        cropY: this.cropY,
        cropWidth: this.cropWidth,
        cropHeight: this.cropHeight,
      },
    };

    const onWindowMove = (moveEvent: PointerEvent) => {
      this.applyDrag(moveEvent.clientX, moveEvent.clientY);
    };
    const onWindowUp = () => {
      const hadDrag = this.drag != null;
      this.drag = null;
      if (hadDrag) {
        this.emitCrop(
          {
            cropX: this.cropX,
            cropY: this.cropY,
            cropWidth: this.cropWidth,
            cropHeight: this.cropHeight,
          },
          false,
        );
      }
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    };
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
  }

  private applyDrag(clientX: number, clientY: number): void {
    const drag = this.drag;
    if (!drag) {
      return;
    }
    const pointer = this.pointerToSource(clientX, clientY);
    const dx = pointer.x - drag.startX;
    const dy = pointer.y - drag.startY;
    const origin = drag.origin;
    const outputAspect = this.outputWidth / this.outputHeight;

    if (drag.mode === 'move') {
      this.emitCrop(
        {
          cropX: origin.cropX + dx,
          cropY: origin.cropY + dy,
          cropWidth: origin.cropWidth,
          cropHeight: origin.cropHeight,
        },
        true,
      );
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

    if (this.lockAspectRatio && outputAspect > 0) {
      nextH = nextW / outputAspect;
      if (drag.mode.includes('n')) {
        nextY = origin.cropY + origin.cropHeight - nextH;
      }
      if (drag.mode.includes('w')) {
        nextX = origin.cropX + origin.cropWidth - nextW;
      }
    }

    this.emitCrop(
      {
        cropX: nextX,
        cropY: nextY,
        cropWidth: Math.max(2, nextW),
        cropHeight: Math.max(2, nextH),
      },
      true,
    );
  }

  private ensureOutputMirror(): void {
    const host = this.outputPreviewHost;
    if (!host) {
      return;
    }
    if (this.outputCanvas && !this.outputCanvas.isConnected) {
      this.outputCanvas = null;
    }
    if (this.outputCanvas?.isConnected) {
      return;
    }
    this.teardownOutputMirror();
    const canvas = document.createElement('canvas');
    canvas.className = 'rd-flat-video-viewport__mirror';
    canvas.setAttribute('aria-label', 'Output view (cropped region)');
    host.appendChild(canvas);
    this.outputCanvas = canvas;
    this.resizeOutputCanvas();

    const tick = () => {
      const video = this.videoEl;
      const ctx = canvas.getContext('2d');
      if (video && ctx && video.readyState >= 2) {
        drawFlatCropPreview(
          ctx,
          video,
          this.cropX,
          this.cropY,
          this.cropWidth,
          this.cropHeight,
          canvas.width,
          canvas.height,
        );
      }
      this.animationId = requestAnimationFrame(tick);
    };
    tick();

    this.outputMirrorResizeObserver = new ResizeObserver(() => this.resizeOutputCanvas());
    this.outputMirrorResizeObserver.observe(host);
  }

  private teardownOutputMirror(): void {
    this.outputMirrorResizeObserver?.disconnect();
    this.outputMirrorResizeObserver = null;
    cancelAnimationFrame(this.animationId);
    this.outputCanvas?.remove();
    this.outputCanvas = null;
  }

  private resizeOutputCanvas(): void {
    const canvas = this.outputCanvas;
    if (!canvas) {
      return;
    }
    applyPreviewCanvasLayout(canvas, this.cropWidth, this.cropHeight, this.outputPreviewHost);
  }
}

export function registerRdFlatVideoViewport(): void {
  defineRosettaElement(DB_FLAT_VIDEO_VIEWPORT_TAG, RdFlatVideoViewportElement);
}
