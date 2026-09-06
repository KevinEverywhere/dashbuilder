import { wrapSignedDegrees } from '@rosettadash/core';
import * as THREE from 'three';
import { defineRosettaElement, readNumber } from '../../../lib/element-utils.js';
import { applyMirrorContainDisplay, fitContainRect } from '../contain-layout.js';
import { startCanvasRecorder, stopCanvasRecorder, type CanvasRecorderSession } from '../canvas-recorder.js';
import { VIEWPORT_FRAGMENT_SHADER, VIEWPORT_VERTEX_SHADER } from './planet-shader.js';

export const DB_EQUIRECT_SPHERE_VIEWPORT_TAG = 'rd-equirect-sphere-viewport';

export interface EquirectSphereCameraChange {
  yaw: number;
  pitch: number;
  horizontalFov: number;
}

export interface EquirectSphereOutputSizeChange {
  outputWidth: number;
  outputHeight: number;
}

type ExportHandleMode = 'nw' | 'ne' | 'sw' | 'se' | 'move';

const MIN_OUTPUT_EDGE = 160;
const MIN_EXPORT_FRAME_SCALE = 0.2;
const MAX_EXPORT_FRAME_SCALE = 1;

const MIN_HFOV = 30;
const PLANET_STEREO_START = 125;
const PLANET_MAX_HFOV = 360;
const NORMAL_HFOV = 75;
const MIN_PITCH = -85;
const MAX_PITCH = 85;
const DRAG_SENSITIVITY = 0.07;
const viewRotScratch = new THREE.Matrix3();
const viewRotMatrix4Scratch = new THREE.Matrix4();
const cameraOriginScratch = new THREE.Vector3();
const DEG = Math.PI / 180;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function displayFovToPlanetMix(displayFov: number): number {
  if (displayFov <= PLANET_STEREO_START) {
    return 0;
  }
  return clamp((displayFov - PLANET_STEREO_START) / (PLANET_MAX_HFOV - PLANET_STEREO_START), 0, 1);
}

/** Rectilinear camera HFOV for the unified shader (matches former sphere path below stereo). */
function rectilinearHfovForDisplay(displayFov: number): number {
  return displayFovToPlanetMix(displayFov) > 0 ? PLANET_STEREO_START : displayFov;
}

function planetMixToSpread(planetMix: number): number {
  return THREE.MathUtils.lerp(0.35, 11, planetMix);
}

function pinchZoomGain(displayFov: number): number {
  return THREE.MathUtils.lerp(18, 40, displayFovToPlanetMix(displayFov));
}

function wheelZoomDelta(displayFov: number, deltaY: number, ctrlKey: boolean): number {
  const inPlanet = displayFovToPlanetMix(displayFov) > 0;
  if (ctrlKey) {
    return deltaY * (inPlanet ? 0.15 : 0.06);
  }
  if (deltaY > 0) {
    return inPlanet ? 8 : 3;
  }
  return inPlanet ? -8 : -3;
}

function setVerticalFovFromHorizontal(
  camera: THREE.PerspectiveCamera,
  horizontalFov: number,
  aspect: number,
  maxHfov: number,
): void {
  const fov = clamp(horizontalFov, MIN_HFOV, maxHfov);
  const verticalRad = 2 * Math.atan(Math.tan((fov * Math.PI) / 360) / aspect);
  camera.fov = (verticalRad * 180) / Math.PI;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}

function applyYawPitch(camera: THREE.PerspectiveCamera, yaw: number, pitch: number): void {
  camera.rotation.set(pitch * DEG, yaw * DEG, 0, 'YXZ');
}

function applyInteriorTextureFlip(texture: THREE.VideoTexture, flip: boolean): void {
  if (flip) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1;
    texture.offset.x = 1;
  } else {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.repeat.x = 1;
    texture.offset.x = 0;
  }
}

function touchDistance(touches: TouchList): number {
  if (touches.length < 2) {
    return 0;
  }
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}


function evenDimension(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

/** Max centered export rectangle (CSS px) for a given aspect inside the host. */
function maxDisplayRectForAspect(
  aspect: number,
  hostWidth: number,
  hostHeight: number,
): { width: number; height: number } {
  const safeAspect = Math.max(0.01, aspect);
  return fitContainRect(safeAspect, 1, hostWidth, hostHeight);
}

export class RdEquirectSphereViewportElement extends HTMLElement {
  static readonly tagName = DB_EQUIRECT_SPHERE_VIEWPORT_TAG;

  private video: HTMLVideoElement | null = null;
  private outputMirror: HTMLCanvasElement | null = null;
  private outputPreviewHost: HTMLElement | null = null;
  private recorderSession: CanvasRecorderSession | null = null;
  private recordingLocked = false;

  private applyFovProp: (() => void) | null = null;
  private applyOrientationProps: (() => void) | null = null;
  private resizeOutputMirror: (() => void) | null = null;
  private blitOutputMirror: ((sourceCanvas: HTMLCanvasElement) => void) | null = null;
  private layoutExportFrame: (() => void) | null = null;
  private outputHostResizeObserver: ResizeObserver | null = null;
  private exportFrameEl: HTMLDivElement | null = null;
  private exportWindowEl: HTMLDivElement | null = null;
  private referenceOutputW = 720;
  private referenceOutputH = 480;
  /** Reference overlay size (CSS px) when output equals referenceOutput at full scale. */
  private referenceDisplayW = 0;
  private referenceDisplayH = 0;
  /** Screen-space export rectangle (CSS px). Source of truth for canvas crop. */
  private exportDisplayW = 0;
  private exportDisplayH = 0;
  /** Offset from centered position (CSS px). */
  private exportDisplayOffsetX = 0;
  private exportDisplayOffsetY = 0;
  /** Live export pixels while corner-resize drag is in progress (before commit). */
  private pendingOutputWidth: number | null = null;
  private pendingOutputHeight: number | null = null;
  private skipExportDisplaySyncOnce = false;
  private outputSizeLayoutQueued = false;
  private exportDrag: {
    mode: ExportHandleMode;
    startX: number;
    startY: number;
    originOutputW: number;
    originOutputH: number;
    originDisplayW: number;
    originDisplayH: number;
    originOffsetX: number;
    originOffsetY: number;
  } | null = null;
  private disposeRuntime: (() => void) | null = null;
  private mounted = false;
  private userInteracting = false;
  private applyingProps = false;

  static get observedAttributes(): string[] {
    return [
      'video-src',
      'flip-interior',
      'yaw',
      'pitch',
      'horizontal-fov',
      'output-width',
      'output-height',
      'min-horizontal-fov',
      'max-horizontal-fov',
    ];
  }

  connectedCallback(): void {
    this.classList.add('rd-equirect-sphere-viewport');
    this.setAttribute('data-testid', DB_EQUIRECT_SPHERE_VIEWPORT_TAG);
    this.setAttribute('aria-label', 'Equirect sphere authoring view');
    if (!this.mounted) {
      this.mountScene();
      this.mounted = true;
    }
  }

  disconnectedCallback(): void {
    this.disposeRuntime?.();
    this.disposeRuntime = null;
    this.mounted = false;
  }

  attributeChangedCallback(name: string): void {
    if (!this.mounted) {
      return;
    }
    if (name === 'video-src' || name === 'flip-interior') {
      this.remountScene();
      return;
    }
    if (name === 'yaw' || name === 'pitch' || name === 'horizontal-fov') {
      if (!this.userInteracting) {
        this.applyFovProp?.();
        this.applyOrientationProps?.();
      }
      return;
    }
    if (name === 'output-width' || name === 'output-height') {
      if (this.exportDrag && this.exportDrag.mode !== 'move') {
        return;
      }
      this.queueOutputSizeLayout();
    }
  }

  private queueOutputSizeLayout(): void {
    if (this.outputSizeLayoutQueued) {
      return;
    }
    this.outputSizeLayoutQueued = true;
    queueMicrotask(() => {
      this.outputSizeLayoutQueued = false;
      if (!this.exportDrag && !this.skipExportDisplaySyncOnce) {
        this.syncExportDisplayFromOutput();
      }
      this.skipExportDisplaySyncOnce = false;
      this.resizeOutputMirror?.();
      this.layoutExportFrame?.();
    });
  }

  setProperty(name: string, value: unknown): void {
    if (name === 'outputPreviewHost') {
      const nextHost = value instanceof HTMLElement ? value : null;
      if (nextHost === this.outputPreviewHost) {
        return;
      }
      this.outputPreviewHost = nextHost;
      if (this.mounted) {
        this.remountScene();
      }
      return;
    }
    if (name === 'videoSrc') {
      const next = value == null || value === '' ? null : String(value);
      const current = this.getAttribute('video-src');
      if (next === current || (next == null && current == null)) {
        return;
      }
      if (next == null) {
        this.removeAttribute('video-src');
      } else {
        this.setAttribute('video-src', next);
      }
      return;
    }
    if (name === 'resetExportReference') {
      this.referenceOutputW = Math.max(MIN_OUTPUT_EDGE, this.outputWidth);
      this.referenceOutputH = Math.max(MIN_OUTPUT_EDGE, this.outputHeight);
      const rect = this.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.captureReferenceDisplay(rect.width, rect.height);
        this.exportDisplayW = this.referenceDisplayW;
        this.exportDisplayH = this.referenceDisplayH;
        this.exportDisplayOffsetX = 0;
        this.exportDisplayOffsetY = 0;
      }
      this.layoutExportFrame?.();
      this.resizeOutputMirror?.();
      return;
    }
  }

  get flipInterior(): boolean {
    return this.getAttribute('flip-interior') !== 'false';
  }

  get yaw(): number {
    return readNumber(this.getAttribute('yaw'), 25);
  }

  get pitch(): number {
    return readNumber(this.getAttribute('pitch'), -8);
  }

  get horizontalFov(): number {
    return readNumber(this.getAttribute('horizontal-fov'), NORMAL_HFOV);
  }

  get outputWidth(): number {
    if (this.pendingOutputWidth != null) {
      return this.pendingOutputWidth;
    }
    return readNumber(this.getAttribute('output-width'), 1280);
  }

  get outputHeight(): number {
    if (this.pendingOutputHeight != null) {
      return this.pendingOutputHeight;
    }
    return readNumber(this.getAttribute('output-height'), 720);
  }

  get minHorizontalFov(): number {
    return readNumber(this.getAttribute('min-horizontal-fov'), MIN_HFOV);
  }

  get maxHorizontalFov(): number {
    return readNumber(this.getAttribute('max-horizontal-fov'), PLANET_MAX_HFOV);
  }

  async play(): Promise<void> {
    if (!this.video) {
      return;
    }
    await this.video.play();
  }

  pause(): void {
    this.video?.pause();
  }

  stop(): void {
    if (!this.video) {
      return;
    }
    this.video.pause();
    this.video.currentTime = 0;
  }

  seek(time: number): void {
    if (!this.video) {
      return;
    }
    this.video.currentTime = clamp(time, 0, this.video.duration || time);
  }

  getCurrentTime(): number {
    return this.video?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.video?.duration ?? 0;
  }

  isPaused(): boolean {
    return this.video?.paused ?? true;
  }

  getOutputCanvas(): HTMLCanvasElement | null {
    return this.outputMirror;
  }

  startRecording(): boolean {
    const canvas = this.outputMirror;
    if (!canvas || this.recorderSession) {
      return false;
    }
    if (canvas.width < 2 || canvas.height < 2) {
      this.resizeOutputMirror?.();
    }
    const session = startCanvasRecorder(canvas);
    if (!session) {
      return false;
    }
    this.recorderSession = session;
    this.recordingLocked = true;
    return true;
  }

  stopRecording(): Promise<Blob | null> {
    const session = this.recorderSession;
    this.recorderSession = null;
    this.recordingLocked = false;
    return stopCanvasRecorder(session);
  }

  private remountScene(): void {
    this.disposeRuntime?.();
    this.mountScene();
  }

  private mountScene(): void {
    const flipInterior = this.flipInterior;
    const videoSrc = this.getAttribute('video-src');
    const outputPreviewElement = this.outputPreviewHost;

    const planetScene = new THREE.Scene();
    planetScene.background = new THREE.Color('#05080a');

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 0.01);

    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'rd-equirect-sphere-viewport__canvas';
    this.appendChild(renderer.domElement);

    const exportFrame = document.createElement('div');
    exportFrame.className = 'rd-equirect-sphere-viewport__export-frame';
    exportFrame.setAttribute('aria-hidden', 'true');
    const exportWindow = document.createElement('div');
    exportWindow.className = 'rd-equirect-sphere-viewport__export-window';
    exportWindow.innerHTML = `
      <span class="rd-equirect-sphere-viewport__handle rd-equirect-sphere-viewport__handle--nw" data-handle="nw"></span>
      <span class="rd-equirect-sphere-viewport__handle rd-equirect-sphere-viewport__handle--ne" data-handle="ne"></span>
      <span class="rd-equirect-sphere-viewport__handle rd-equirect-sphere-viewport__handle--sw" data-handle="sw"></span>
      <span class="rd-equirect-sphere-viewport__handle rd-equirect-sphere-viewport__handle--se" data-handle="se"></span>
    `;
    exportFrame.appendChild(exportWindow);
    this.appendChild(exportFrame);
    this.exportFrameEl = exportFrame;
    this.exportWindowEl = exportWindow;
    exportWindow.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      const target = event.target;
      if (target instanceof Element && target.closest('[data-handle]')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.onExportHandlePointerDown(event as PointerEvent, 'move');
    });
    exportWindow.querySelectorAll('[data-handle]').forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        const mode = (handle as HTMLElement).dataset['handle'] as ExportHandleMode;
        this.onExportHandlePointerDown(event as PointerEvent, mode);
      });
    });
    const onHostPointerDownCapture = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const handle = target.closest('[data-handle]');
      if (!handle || !exportFrame.contains(handle)) {
        return;
      }
      event.stopPropagation();
      const mode = (handle as HTMLElement).dataset['handle'] as ExportHandleMode;
      this.onExportHandlePointerDown(event as PointerEvent, mode);
    };
    this.addEventListener('pointerdown', onHostPointerDownCapture, true);

    this.referenceOutputW = Math.max(MIN_OUTPUT_EDGE, this.outputWidth);
    this.referenceOutputH = Math.max(MIN_OUTPUT_EDGE, this.outputHeight);

    this.layoutExportFrame = () => this.layoutExportFrameNow();

    const outputMirror = document.createElement('canvas');
    outputMirror.className = 'rd-equirect-sphere-viewport__mirror';
    outputMirror.setAttribute('aria-label', 'Output view (bitmap crop from source)');
    let outputMirrorWrap: HTMLDivElement | null = null;
    if (outputPreviewElement) {
      outputMirrorWrap = document.createElement('div');
      outputMirrorWrap.className = 'rd-equirect-sphere-viewport__mirror-wrap';
      outputMirrorWrap.appendChild(outputMirror);
      outputPreviewElement.appendChild(outputMirrorWrap);
    } else {
      outputMirror.hidden = true;
      this.appendChild(outputMirror);
    }
    this.outputMirror = outputMirror;

    const resizeOutputMirror = () => {
      if (this.recordingLocked) {
        return;
      }
      const width = Math.max(2, Math.round(this.outputWidth));
      const height = Math.max(2, Math.round(this.outputHeight));
      outputMirror.width = width;
      outputMirror.height = height;
      applyMirrorContainDisplay(outputMirror, width, height, outputMirrorWrap ?? outputPreviewElement);
    };
    this.resizeOutputMirror = resizeOutputMirror;
    this.blitOutputMirror = (sourceCanvas) => this.blitOutputMirrorFromSource(sourceCanvas);
    resizeOutputMirror();

    if (outputPreviewElement) {
      this.outputHostResizeObserver = new ResizeObserver(() => resizeOutputMirror());
      this.outputHostResizeObserver.observe(outputPreviewElement);
    }

    const planetUniforms = {
      map: { value: null as THREE.Texture | null },
      projectionMatrixInverse: { value: new THREE.Matrix4() },
      cameraMatrixWorld: { value: new THREE.Matrix4() },
      cameraOrigin: { value: new THREE.Vector3() },
      viewRot: { value: new THREE.Matrix3() },
      planetMix: { value: 0 },
      planetSpread: { value: 0.35 },
      aspect: { value: 1 },
      flipInterior: { value: flipInterior ? 1 : 0 },
    };

    const planetMaterial = new THREE.ShaderMaterial({
      uniforms: planetUniforms,
      vertexShader: VIEWPORT_VERTEX_SHADER,
      fragmentShader: VIEWPORT_FRAGMENT_SHADER,
    });
    planetScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), planetMaterial));

    let displayFov = clamp(this.horizontalFov, MIN_HFOV, PLANET_MAX_HFOV);
    let viewYaw = wrapSignedDegrees(this.yaw);
    let viewPitch = clamp(this.pitch, MIN_PITCH, MAX_PITCH);

    const bounds = () => ({
      min: this.minHorizontalFov,
      max: this.maxHorizontalFov,
    });

    const syncPlanetUniforms = (aspect: number) => {
      applyYawPitch(camera, viewYaw, viewPitch);
      const planetMix = displayFovToPlanetMix(displayFov);
      setVerticalFovFromHorizontal(
        camera,
        rectilinearHfovForDisplay(displayFov),
        aspect,
        PLANET_STEREO_START,
      );
      camera.updateMatrixWorld(true);
      planetUniforms.projectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
      planetUniforms.cameraMatrixWorld.value.copy(camera.matrixWorld);
      cameraOriginScratch.setFromMatrixPosition(camera.matrixWorld);
      planetUniforms.cameraOrigin.value.copy(cameraOriginScratch);
      viewRotMatrix4Scratch.extractRotation(camera.matrixWorld);
      viewRotScratch.setFromMatrix4(viewRotMatrix4Scratch);
      planetUniforms.viewRot.value.copy(viewRotScratch);
      planetUniforms.planetMix.value = planetMix;
      planetUniforms.planetSpread.value = planetMixToSpread(planetMix);
      planetUniforms.aspect.value = aspect;
      planetUniforms.flipInterior.value = this.flipInterior ? 1 : 0;
    };

    const emitCameraChange = () => {
      if (this.applyingProps) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent('camera-change', {
          detail: {
            yaw: viewYaw,
            pitch: viewPitch,
            horizontalFov: displayFov,
          } satisfies EquirectSphereCameraChange,
          bubbles: true,
          composed: true,
        }),
      );
    };

    const zoomDisplayFov = (delta: number) => {
      const { min, max } = bounds();
      displayFov = clamp(displayFov + delta, min, max);
      emitCameraChange();
    };

    const applyFovProp = () => {
      displayFov = clamp(this.horizontalFov, bounds().min, bounds().max);
    };

    const applyOrientationProps = () => {
      this.applyingProps = true;
      viewYaw = wrapSignedDegrees(this.yaw);
      viewPitch = clamp(this.pitch, MIN_PITCH, MAX_PITCH);
      this.applyingProps = false;
    };

    const applyCameraProps = () => {
      applyOrientationProps();
      applyFovProp();
    };
    this.applyFovProp = applyFovProp;
    this.applyOrientationProps = applyOrientationProps;
    applyCameraProps();

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      this.userInteracting = true;
      zoomDisplayFov(wheelZoomDelta(displayFov, event.deltaY, event.ctrlKey));
      window.setTimeout(() => {
        this.userInteracting = false;
      }, 150);
    };

    let pinchDistance = 0;
    let activeTouchCount = 0;
    const cancelPointerDrag = () => {
      dragging = false;
      dragPointerId = -1;
    };
    const onTouchStart = (event: TouchEvent) => {
      activeTouchCount = event.touches.length;
      if (event.touches.length === 2) {
        this.userInteracting = true;
        cancelPointerDrag();
        pinchDistance = touchDistance(event.touches);
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      activeTouchCount = event.touches.length;
      if (event.touches.length !== 2 || pinchDistance <= 0) {
        return;
      }
      event.preventDefault();
      cancelPointerDrag();
      const nextDistance = touchDistance(event.touches);
      const scale = nextDistance / pinchDistance;
      if (Math.abs(scale - 1) > 0.01) {
        zoomDisplayFov((1 - scale) * pinchZoomGain(displayFov));
        pinchDistance = nextDistance;
      }
    };
    const onTouchEnd = (event: TouchEvent) => {
      activeTouchCount = event.touches.length;
      if (event.touches.length < 2) {
        pinchDistance = 0;
      }
      if (event.touches.length === 0) {
        this.userInteracting = false;
      }
    };

    let dragging = false;
    let dragPointerId = -1;
    let lastDragX = 0;
    let lastDragY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      if (event.pointerType === 'touch' && (activeTouchCount >= 2 || pinchDistance > 0)) {
        return;
      }
      this.userInteracting = true;
      dragging = true;
      dragPointerId = event.pointerId;
      lastDragX = event.clientX;
      lastDragY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (
        !dragging ||
        event.pointerId !== dragPointerId ||
        (event.pointerType === 'touch' && (activeTouchCount >= 2 || pinchDistance > 0))
      ) {
        return;
      }
      const deltaX = event.clientX - lastDragX;
      const deltaY = event.clientY - lastDragY;
      lastDragX = event.clientX;
      lastDragY = event.clientY;

      viewYaw = wrapSignedDegrees(viewYaw - deltaX * DRAG_SENSITIVITY);
      viewPitch = clamp(viewPitch - deltaY * DRAG_SENSITIVITY, MIN_PITCH, MAX_PITCH);
      emitCameraChange();
    };

    const endDrag = (event: PointerEvent) => {
      if (event.pointerId !== dragPointerId) {
        return;
      }
      dragging = false;
      dragPointerId = -1;
      this.userInteracting = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);
    renderer.domElement.addEventListener('touchcancel', onTouchEnd);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', endDrag);
    renderer.domElement.addEventListener('pointercancel', endDrag);
    renderer.domElement.addEventListener('lostpointercapture', endDrag);

    let texture: THREE.VideoTexture | null = null;

    const attachVideo = (src: string) => {
      if (texture) {
        texture.dispose();
        texture = null;
      }
      if (this.video) {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        this.video.remove();
        this.video = null;
      }

      const video = document.createElement('video');
      video.src = src;
      video.crossOrigin = 'anonymous';
      video.loop = false;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      this.video = video;

      const bindTexture = () => {
        if (texture || !this.video) {
          return;
        }
        texture = new THREE.VideoTexture(this.video);
        texture.colorSpace = THREE.SRGBColorSpace;
        applyInteriorTextureFlip(texture, this.flipInterior);
        planetUniforms.map.value = texture;
      };
      video.addEventListener('loadeddata', bindTexture, { once: true });
      void video.play().catch(() => undefined);
    };

    if (videoSrc) {
      attachVideo(videoSrc);
    }

    let aspect = 1;
    const resize = () => {
      const width = this.clientWidth || 1;
      const height = this.clientHeight || 1;
      renderer.setSize(width, height, false);
      aspect = width / height;
      syncPlanetUniforms(aspect);
      const prevRefW = this.referenceDisplayW;
      const prevRefH = this.referenceDisplayH;
      const prevDisplayW = this.exportDisplayW;
      const prevDisplayH = this.exportDisplayH;
      const prevOffsetX = this.exportDisplayOffsetX;
      const prevOffsetY = this.exportDisplayOffsetY;
      this.captureReferenceDisplay(width, height);
      if (
        prevRefW > 0 &&
        prevRefH > 0 &&
        prevDisplayW > 0 &&
        prevDisplayH > 0 &&
        !this.exportDrag
      ) {
        const scaleX = this.referenceDisplayW / prevRefW;
        const scaleY = this.referenceDisplayH / prevRefH;
        this.exportDisplayW = prevDisplayW * scaleX;
        this.exportDisplayH = prevDisplayH * scaleY;
        this.exportDisplayOffsetX = prevOffsetX * scaleX;
        this.exportDisplayOffsetY = prevOffsetY * scaleY;
      } else if (!this.exportDrag) {
        this.syncExportDisplayFromOutput();
      }
      this.layoutExportFrame?.();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(this);
    resize();

    const renderFrame = (targetAspect: number, targetRenderer: THREE.WebGLRenderer) => {
      syncPlanetUniforms(targetAspect);
      targetRenderer.render(planetScene, quadCamera);
    };

    let animationId = 0;
    const tick = () => {
      const video = this.video;
      if (texture && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        texture.needsUpdate = true;
      }

      renderFrame(aspect, renderer);
      this.blitOutputMirror?.(renderer.domElement);

      animationId = requestAnimationFrame(tick);
    };
    tick();

    this.disposeRuntime = () => {
      this.applyFovProp = null;
      this.applyOrientationProps = null;
      this.resizeOutputMirror = null;
      this.blitOutputMirror = null;
      this.layoutExportFrame = null;
      this.exportFrameEl?.remove();
      this.exportFrameEl = null;
      this.exportWindowEl = null;
      this.outputHostResizeObserver?.disconnect();
      this.outputHostResizeObserver = null;
      cancelAnimationFrame(animationId);
      this.removeEventListener('pointerdown', onHostPointerDownCapture, true);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.domElement.removeEventListener('touchcancel', onTouchEnd);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', endDrag);
      renderer.domElement.removeEventListener('pointercancel', endDrag);
      renderer.domElement.removeEventListener('lostpointercapture', endDrag);
      resizeObserver.disconnect();
      if (texture) {
        texture.dispose();
      }
      if (this.video) {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        this.video.remove();
        this.video = null;
      }
      this.outputMirror = null;
      planetMaterial.dispose();
      renderer.dispose();
      outputMirrorWrap?.remove();
      renderer.domElement.remove();
      if (!outputMirrorWrap) {
        outputMirror.remove();
      }
    };
  }

  private onExportHandlePointerDown(event: PointerEvent, mode: ExportHandleMode): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const windowEl = this.exportWindowEl;
    if (!windowEl) {
      return;
    }
    this.userInteracting = true;
    this.exportDrag = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      originOutputW: this.outputWidth,
      originOutputH: this.outputHeight,
      originDisplayW: this.exportDisplayW,
      originDisplayH: this.exportDisplayH,
      originOffsetX: this.exportDisplayOffsetX,
      originOffsetY: this.exportDisplayOffsetY,
    };
    const target =
      mode === 'move'
        ? windowEl
        : event.target instanceof Element
          ? (event.target.closest('[data-handle]') as HTMLElement | null)
          : null;
    if (target?.setPointerCapture) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // ignore — window-level listeners still handle drag
      }
    }

    const onWindowMove = (moveEvent: PointerEvent) => {
      this.applyExportDrag(moveEvent.clientX, moveEvent.clientY);
    };
    const onWindowUp = (upEvent: PointerEvent) => {
      if (target?.hasPointerCapture?.(upEvent.pointerId)) {
        target.releasePointerCapture(upEvent.pointerId);
      }
      const drag = this.exportDrag;
      this.exportDrag = null;
      this.userInteracting = false;
      if (drag && drag.mode !== 'move') {
        this.flushPendingOutputSize();
      }
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    };
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
  }

  private referenceDimensions(): { refW: number; refH: number } {
    return {
      refW: Math.max(MIN_OUTPUT_EDGE, this.referenceOutputW),
      refH: Math.max(MIN_OUTPUT_EDGE, this.referenceOutputH),
    };
  }

  private ensureReferenceDisplay(hostWidth: number, hostHeight: number): void {
    if (this.referenceDisplayW > 0 && this.referenceDisplayH > 0) {
      return;
    }
    this.captureReferenceDisplay(hostWidth, hostHeight);
  }

  /** Record the max centered overlay for reference export pixels at full scale. */
  private captureReferenceDisplay(hostWidth: number, hostHeight: number): void {
    const { refW, refH } = this.referenceDimensions();
    const rect = maxDisplayRectForAspect(refW / refH, hostWidth, hostHeight);
    this.referenceDisplayW = rect.width;
    this.referenceDisplayH = rect.height;
  }

  /**
   * Linear map: export pixels → overlay CSS px (inverse of outputPixelsFromDisplay).
   * Same contract as flat viewport crop ↔ output, no FOV math.
   */
  private displaySizeForOutputPixels(
    outputW: number,
    outputH: number,
    hostWidth: number,
    hostHeight: number,
  ): { width: number; height: number } {
    this.ensureReferenceDisplay(hostWidth, hostHeight);
    const { refW } = this.referenceDimensions();
    const safeOutputH = Math.max(1, outputH);
    const outputAspect = outputW / safeOutputH;
    const scale = outputW / refW;
    const width = this.referenceDisplayW * scale;
    return {
      width,
      height: width / outputAspect,
    };
  }

  /**
   * Linear map: overlay CSS px → export pixels. Destination aspect must match crop
   * aspect or drawImage will stretch (MDN 9-arg form).
   */
  private outputPixelsFromDisplay(
    displayW: number,
    displayH: number,
    hostWidth: number,
    hostHeight: number,
  ): { width: number; height: number } {
    this.ensureReferenceDisplay(hostWidth, hostHeight);
    const { refW, refH } = this.referenceDimensions();
    const displayAspect = Math.max(0.01, displayW / displayH);
    const scaleW = displayW / this.referenceDisplayW;
    const scaleH = displayH / this.referenceDisplayH;
    let outW = clamp(refW * scaleW, refW * MIN_EXPORT_FRAME_SCALE, refW * MAX_EXPORT_FRAME_SCALE);
    let outH = clamp(refH * scaleH, refH * MIN_EXPORT_FRAME_SCALE, refH * MAX_EXPORT_FRAME_SCALE);
    outW = evenDimension(outW);
    outH = evenDimension(outW / displayAspect);
    return { width: outW, height: outH };
  }

  private syncExportDisplayFromOutput(): void {
    const rect = this.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const display = this.displaySizeForOutputPixels(
      this.outputWidth,
      this.outputHeight,
      rect.width,
      rect.height,
    );
    this.exportDisplayW = display.width;
    this.exportDisplayH = display.height;
  }

  private exportWindowPosition(
    hostWidth: number,
    hostHeight: number,
  ): { left: number; top: number } {
    const halfGapX = Math.max(0, (hostWidth - this.exportDisplayW) / 2);
    const halfGapY = Math.max(0, (hostHeight - this.exportDisplayH) / 2);
    this.exportDisplayOffsetX = clamp(this.exportDisplayOffsetX, -halfGapX, halfGapX);
    this.exportDisplayOffsetY = clamp(this.exportDisplayOffsetY, -halfGapY, halfGapY);
    return {
      left: halfGapX + this.exportDisplayOffsetX,
      top: halfGapY + this.exportDisplayOffsetY,
    };
  }

  /** Map export overlay (CSS px) to source canvas buffer coordinates. */
  private sourceCropFromExportDisplay(
    sourceCanvas: HTMLCanvasElement,
    hostWidth: number,
    hostHeight: number,
  ): { x: number; y: number; width: number; height: number } {
    const cssToBufferX = sourceCanvas.width / Math.max(1, hostWidth);
    const cssToBufferY = sourceCanvas.height / Math.max(1, hostHeight);
    const { left: cropX, top: cropY } = this.exportWindowPosition(hostWidth, hostHeight);
    return {
      x: cropX * cssToBufferX,
      y: cropY * cssToBufferY,
      width: this.exportDisplayW * cssToBufferX,
      height: this.exportDisplayH * cssToBufferY,
    };
  }

  /**
   * Flat-viewport-style preview: drawImage(source, sx,sy,sw,sh, 0,0,dw,dh).
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
   */
  private blitOutputMirrorFromSource(sourceCanvas: HTMLCanvasElement): void {
    const outputCanvas = this.outputMirror;
    if (!outputCanvas || this.exportDisplayW <= 1 || this.exportDisplayH <= 1) {
      return;
    }
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const hostRect = this.getBoundingClientRect();
    if (hostRect.width <= 0 || hostRect.height <= 0) {
      return;
    }

    const sourceCrop = this.sourceCropFromExportDisplay(
      sourceCanvas,
      hostRect.width,
      hostRect.height,
    );
    let outW = Math.max(2, Math.round(this.outputWidth));
    let outH = Math.max(2, Math.round(this.outputHeight));
    const cropAspect = sourceCrop.width / Math.max(1, sourceCrop.height);
    const destAspect = outW / Math.max(1, outH);
    if (
      !this.recordingLocked &&
      Math.abs(cropAspect - destAspect) / Math.max(0.01, cropAspect) > 0.01
    ) {
      outW = evenDimension(outW);
      outH = evenDimension(outW / (this.exportDisplayW / this.exportDisplayH));
      if (outputCanvas.width !== outW || outputCanvas.height !== outH) {
        outputCanvas.width = outW;
        outputCanvas.height = outH;
      }
    }

    ctx.fillStyle = '#05080a';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(
      sourceCanvas,
      sourceCrop.x,
      sourceCrop.y,
      sourceCrop.width,
      sourceCrop.height,
      0,
      0,
      outW,
      outH,
    );
  }

  private layoutExportFrameNow(): void {
    const windowEl = this.exportWindowEl;
    if (!windowEl) {
      return;
    }
    const rect = this.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    if (this.exportDisplayW <= 0 || this.exportDisplayH <= 0) {
      this.syncExportDisplayFromOutput();
    }
    const { left, top } = this.exportWindowPosition(rect.width, rect.height);
    windowEl.style.width = `${this.exportDisplayW}px`;
    windowEl.style.height = `${this.exportDisplayH}px`;
    windowEl.style.left = `${left}px`;
    windowEl.style.top = `${top}px`;
  }

  private applyExportDrag(clientX: number, clientY: number): void {
    const drag = this.exportDrag;
    if (!drag || drag.originDisplayW <= 0 || drag.originDisplayH <= 0) {
      return;
    }
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;

    if (drag.mode === 'move') {
      this.exportDisplayOffsetX = drag.originOffsetX + dx;
      this.exportDisplayOffsetY = drag.originOffsetY + dy;
      this.layoutExportFrameNow();
      return;
    }

    let nextDisplayW = drag.originDisplayW;
    let nextDisplayH = drag.originDisplayH;
    if (drag.mode.includes('e')) {
      nextDisplayW = drag.originDisplayW + dx;
    }
    if (drag.mode.includes('w')) {
      nextDisplayW = drag.originDisplayW - dx;
    }
    if (drag.mode.includes('s')) {
      nextDisplayH = drag.originDisplayH + dy;
    }
    if (drag.mode.includes('n')) {
      nextDisplayH = drag.originDisplayH - dy;
    }

    const hostRect = this.getBoundingClientRect();
    if (hostRect.width <= 0 || hostRect.height <= 0) {
      return;
    }
    const minDisplayW = hostRect.width * MIN_EXPORT_FRAME_SCALE;
    const minDisplayH = hostRect.height * MIN_EXPORT_FRAME_SCALE;
    nextDisplayW = clamp(nextDisplayW, minDisplayW, hostRect.width);
    nextDisplayH = clamp(nextDisplayH, minDisplayH, hostRect.height);

    this.exportDisplayW = nextDisplayW;
    this.exportDisplayH = nextDisplayH;
    this.layoutExportFrameNow();

    const nextPixels = this.outputPixelsFromDisplay(
      nextDisplayW,
      nextDisplayH,
      hostRect.width,
      hostRect.height,
    );
    this.emitOutputSize(nextPixels.width, nextPixels.height);
  }

  private emitOutputSize(outputWidth: number, outputHeight: number): void {
    const resizeDragActive = this.exportDrag != null && this.exportDrag.mode !== 'move';
    if (resizeDragActive) {
      this.pendingOutputWidth = outputWidth;
      this.pendingOutputHeight = outputHeight;
      this.resizeOutputMirror?.();
      return;
    }
    this.commitOutputSize(outputWidth, outputHeight);
  }

  private flushPendingOutputSize(): void {
    if (this.pendingOutputWidth == null || this.pendingOutputHeight == null) {
      return;
    }
    this.skipExportDisplaySyncOnce = true;
    this.commitOutputSize(this.pendingOutputWidth, this.pendingOutputHeight);
  }

  private commitOutputSize(outputWidth: number, outputHeight: number): void {
    const nextW = String(outputWidth);
    const nextH = String(outputHeight);
    if (this.getAttribute('output-width') === nextW && this.getAttribute('output-height') === nextH) {
      this.pendingOutputWidth = null;
      this.pendingOutputHeight = null;
      this.resizeOutputMirror?.();
      return;
    }
    this.setAttribute('output-width', nextW);
    this.setAttribute('output-height', nextH);
    this.pendingOutputWidth = null;
    this.pendingOutputHeight = null;
    this.resizeOutputMirror?.();
    this.dispatchEvent(
      new CustomEvent('output-size-change', {
        detail: { outputWidth, outputHeight },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

export function registerRdEquirectSphereViewport(): void {
  defineRosettaElement(DB_EQUIRECT_SPHERE_VIEWPORT_TAG, RdEquirectSphereViewportElement);
}
