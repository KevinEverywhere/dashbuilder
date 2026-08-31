import { wrapSignedDegrees } from '@rosettadash/core';
import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  viewChild,
  ElementRef,
} from '@angular/core';
import * as THREE from 'three';
import { VIEWPORT_FRAGMENT_SHADER, VIEWPORT_VERTEX_SHADER } from './planet-shader';

export interface EquirectSphereCameraChange {
  yaw: number;
  pitch: number;
  horizontalFov: number;
}

export interface EquirectSphereViewportHandle {
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
}

const SPHERE_RADIUS = 10;
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

function planetMixToSpread(planetMix: number): number {
  return THREE.MathUtils.lerp(0.35, 11, planetMix);
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

function pickRecorderMimeType(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

/**
 * Interior sphere (BackSide + flipped texture) for rectilinear POV through 125°.
 * Stereographic shader above 125° — orientation locked via shared camera matrix.
 */
@Component({
  selector: 'rd-equirect-sphere-viewport',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #host
      [attr.data-testid]="'rd-equirect-sphere-viewport'"
      [ngClass]="rootClass()"
      aria-label="Equirect sphere authoring view"
    ></div>
  `,
})
export class EquirectSphereViewport
  implements AfterViewInit, OnDestroy, EquirectSphereViewportHandle
{
  readonly videoSrc = input<string | null | undefined>(undefined);
  readonly flipInterior = input<boolean>(true);
  readonly yaw = input<number>(25);
  readonly pitch = input<number>(-8);
  readonly horizontalFov = input<number>(NORMAL_HFOV);
  readonly outputWidth = input<number>(1280);
  readonly outputHeight = input<number>(720);
  readonly minHorizontalFov = input<number>(MIN_HFOV);
  readonly maxHorizontalFov = input<number>(PLANET_MAX_HFOV);
  readonly className = input<string | undefined>(undefined);
  readonly outputPreviewElement = input<HTMLElement | null>(null);

  readonly cameraChange = output<EquirectSphereCameraChange>();

  private readonly hostRef = viewChild<ElementRef<HTMLDivElement>>('host');

  readonly rootClass = computed(() =>
    ['rd-equirect-sphere-viewport', this.className()].filter(Boolean).join(' '),
  );

  private video: HTMLVideoElement | null = null;
  private outputMirror: HTMLCanvasElement | null = null;
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private applyFovProp: (() => void) | null = null;
  private applyOrientationProps: (() => void) | null = null;
  private resizeOutputMirror: (() => void) | null = null;
  private disposeRuntime: (() => void) | null = null;
  private mounted = false;
  private userInteracting = false;
  private applyingProps = false;

  constructor() {
    effect(() => {
      this.yaw();
      this.pitch();
      this.horizontalFov();
      if (this.mounted) {
        this.applyFovProp?.();
        if (!this.userInteracting) {
          this.applyOrientationProps?.();
        }
      }
    });

    effect(() => {
      this.outputWidth();
      this.outputHeight();
      if (this.mounted) {
        this.resizeOutputMirror?.();
      }
    });

    effect(() => {
      this.videoSrc();
      this.flipInterior();
      this.outputPreviewElement();
      if (this.mounted) {
        this.remountScene();
      }
    });
  }

  ngAfterViewInit(): void {
    this.mountScene();
    this.mounted = true;
  }

  ngOnDestroy(): void {
    this.disposeRuntime?.();
    this.mounted = false;
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

  startRecording(): void {
    const canvas = this.outputMirror;
    if (!canvas || this.recorder) {
      return;
    }
    const stream = canvas.captureStream(30);
    const chunks: Blob[] = [];
    this.recordedChunks = chunks;
    const recorder = new MediaRecorder(stream, { mimeType: pickRecorderMimeType() });
    this.recorder = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.start(200);
  }

  stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const recorder = this.recorder;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const chunks = this.recordedChunks;
        this.recorder = null;
        this.recordedChunks = [];
        resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
      };
      recorder.stop();
    });
  }

  private remountScene(): void {
    this.disposeRuntime?.();
    this.mountScene();
  }

  private mountScene(): void {
    const host = this.hostRef()?.nativeElement;
    if (!host) {
      return;
    }

    const flipInterior = this.flipInterior();
    const videoSrc = this.videoSrc();
    const outputPreviewElement = this.outputPreviewElement();

    const sphereScene = new THREE.Scene();
    sphereScene.background = new THREE.Color('#05080a');

    const planetScene = new THREE.Scene();
    planetScene.background = new THREE.Color('#05080a');

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 0.01);

    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'rd-equirect-sphere-viewport__canvas';
    host.appendChild(renderer.domElement);

    const outputRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    outputRenderer.setPixelRatio(1);
    const outputMirror = outputRenderer.domElement;
    outputMirror.className = 'rd-equirect-sphere-viewport__mirror';
    outputMirror.setAttribute('aria-label', 'Output view (mirrors source)');
    if (outputPreviewElement) {
      outputPreviewElement.appendChild(outputMirror);
    } else {
      outputMirror.hidden = true;
      host.appendChild(outputMirror);
    }
    this.outputMirror = outputMirror;

    const resizeOutputMirror = () => {
      const width = Math.max(2, Math.round(this.outputWidth()));
      const height = Math.max(2, Math.round(this.outputHeight()));
      outputRenderer.setSize(width, height, false);
      outputMirror.style.width = '100%';
      outputMirror.style.height = 'auto';
      outputMirror.style.aspectRatio = `${width} / ${height}`;
    };
    this.resizeOutputMirror = resizeOutputMirror;
    resizeOutputMirror();

    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x11181e, side: THREE.BackSide });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(SPHERE_RADIUS, 64, 32), sphereMaterial);
    sphereScene.add(sphere);

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

    let displayFov = clamp(this.horizontalFov(), MIN_HFOV, PLANET_MAX_HFOV);
    let viewYaw = wrapSignedDegrees(this.yaw());
    let viewPitch = clamp(this.pitch(), MIN_PITCH, MAX_PITCH);

    const bounds = () => ({
      min: this.minHorizontalFov(),
      max: this.maxHorizontalFov(),
    });

    const usePlanetRenderer = () => displayFov > PLANET_STEREO_START;

    const applySphereCamera = (aspect: number) => {
      applyYawPitch(camera, viewYaw, viewPitch);
      setVerticalFovFromHorizontal(camera, displayFov, aspect, PLANET_STEREO_START);
    };

    const syncPlanetUniforms = (aspect: number) => {
      applyYawPitch(camera, viewYaw, viewPitch);
      setVerticalFovFromHorizontal(camera, PLANET_STEREO_START, aspect, PLANET_STEREO_START);
      camera.updateMatrixWorld(true);

      const planetMix = displayFovToPlanetMix(displayFov);
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
      planetUniforms.flipInterior.value = this.flipInterior() ? 1 : 0;
    };

    const emitCameraChange = () => {
      if (this.applyingProps) {
        return;
      }
      this.cameraChange.emit({
        yaw: viewYaw,
        pitch: viewPitch,
        horizontalFov: displayFov,
      });
    };

    const zoomDisplayFov = (delta: number) => {
      const { min, max } = bounds();
      displayFov = clamp(displayFov + delta, min, max);
      emitCameraChange();
    };

    const applyFovProp = () => {
      displayFov = clamp(this.horizontalFov(), bounds().min, bounds().max);
    };

    const applyOrientationProps = () => {
      this.applyingProps = true;
      viewYaw = wrapSignedDegrees(this.yaw());
      viewPitch = clamp(this.pitch(), MIN_PITCH, MAX_PITCH);
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
      const inPlanet = usePlanetRenderer();
      const delta = event.ctrlKey
        ? event.deltaY * (inPlanet ? 0.15 : 0.06)
        : event.deltaY > 0
          ? inPlanet
            ? 8
            : 3
          : inPlanet
            ? -8
            : -3;
      zoomDisplayFov(delta);
      window.setTimeout(() => {
        this.userInteracting = false;
      }, 150);
    };

    let pinchDistance = 0;
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        this.userInteracting = true;
        pinchDistance = touchDistance(event.touches);
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || pinchDistance <= 0) {
        return;
      }
      event.preventDefault();
      const nextDistance = touchDistance(event.touches);
      const scale = nextDistance / pinchDistance;
      if (Math.abs(scale - 1) > 0.01) {
        const inPlanet = usePlanetRenderer();
        zoomDisplayFov((1 - scale) * (inPlanet ? 40 : 18));
        pinchDistance = nextDistance;
      }
    };
    const onTouchEnd = () => {
      pinchDistance = 0;
      this.userInteracting = false;
    };

    let dragging = false;
    let dragPointerId = -1;
    let lastDragX = 0;
    let lastDragY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
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
      if (!dragging || event.pointerId !== dragPointerId) {
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
      void video.play().catch(() => undefined);

      this.video = video;

      texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      applyInteriorTextureFlip(texture, this.flipInterior());

      sphereMaterial.map = texture;
      sphereMaterial.color.set('#ffffff');
      sphereMaterial.needsUpdate = true;
      planetUniforms.map.value = texture;
    };

    if (videoSrc) {
      attachVideo(videoSrc);
    }

    let aspect = 1;
    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      aspect = width / height;
      if (usePlanetRenderer()) {
        syncPlanetUniforms(aspect);
      } else {
        applySphereCamera(aspect);
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const renderFrame = (targetAspect: number, targetRenderer: THREE.WebGLRenderer) => {
      if (usePlanetRenderer()) {
        syncPlanetUniforms(targetAspect);
        targetRenderer.render(planetScene, quadCamera);
      } else {
        applySphereCamera(targetAspect);
        targetRenderer.render(sphereScene, camera);
      }
    };

    let animationId = 0;
    const tick = () => {
      if (texture) {
        texture.needsUpdate = true;
      }

      renderFrame(aspect, renderer);

      const outputWidth = Math.max(2, Math.round(this.outputWidth()));
      const outputHeight = Math.max(2, Math.round(this.outputHeight()));
      renderFrame(outputWidth / outputHeight, outputRenderer);

      animationId = requestAnimationFrame(tick);
    };
    tick();

    this.disposeRuntime = () => {
      this.applyFovProp = null;
      this.applyOrientationProps = null;
      this.resizeOutputMirror = null;
      cancelAnimationFrame(animationId);
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
      sphere.geometry.dispose();
      sphereMaterial.dispose();
      planetMaterial.dispose();
      renderer.dispose();
      outputRenderer.dispose();
      renderer.domElement.remove();
      outputMirror.remove();
    };
  }
}
