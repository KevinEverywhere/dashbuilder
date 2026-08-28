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
  onCameraChange?: (detail: EquirectSphereCameraChange) => void;
  onTimeUpdate?: (detail: { currentTime: number; duration: number }) => void;
  onPlaybackChange?: (detail: { paused: boolean }) => void;
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

type ViewportHost = HTMLDivElement & {
  __applyCameraProps?: () => void;
  __applyFovProp?: () => void;
  __applyOrientationProps?: () => void;
  __resizeOutputMirror?: () => void;
  __video?: HTMLVideoElement | null;
  __outputMirror?: HTMLCanvasElement | null;
  __recorder?: MediaRecorder | null;
  __recordedChunks?: Blob[];
};

/**
 * Interior sphere (BackSide + flipped texture) for rectilinear POV through 125°.
 * Stereographic shader above 125° — orientation locked via shared camera matrix.
 */
export const EquirectSphereViewport = defineComponent({
  name: 'RdEquirectSphereViewport',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    style: { type: [String, Object, Array] as PropType<StyleValue | undefined>, default: undefined },
    videoSrc: { type: String as PropType<string | null | undefined>, default: undefined },
    flipInterior: { type: Boolean as PropType<boolean | undefined>, default: true },
    yaw: { type: Number as PropType<number | undefined>, default: 25 },
    pitch: { type: Number as PropType<number | undefined>, default: -8 },
    horizontalFov: { type: Number as PropType<number | undefined>, default: NORMAL_HFOV },
    outputWidth: { type: Number as PropType<number | undefined>, default: 1280 },
    outputHeight: { type: Number as PropType<number | undefined>, default: 720 },
    minHorizontalFov: { type: Number as PropType<number | undefined>, default: MIN_HFOV },
    maxHorizontalFov: { type: Number as PropType<number | undefined>, default: PLANET_MAX_HFOV },
    outputPreviewHost: { type: Object as PropType<HTMLElement | null | undefined>, default: undefined },
    onCameraChange: {
      type: Function as PropType<((detail: EquirectSphereCameraChange) => void) | undefined>,
      default: undefined,
    },
    onTimeUpdate: {
      type: Function as PropType<((detail: { currentTime: number; duration: number }) => void) | undefined>,
      default: undefined,
    },
    onPlaybackChange: {
      type: Function as PropType<((detail: { paused: boolean }) => void) | undefined>,
      default: undefined,
    },
  },
  emits: ['cameraChange', 'timeUpdate', 'playbackChange'],
  setup(props, { emit, expose, attrs }) {
    const hostRef = ref<HTMLDivElement | null>(null);
    let userInteracting = false;
    let applyingProps = false;
    let disposeScene: (() => void) | null = null;

    const emitCamera = (detail: EquirectSphereCameraChange) => {
      props.onCameraChange?.(detail);
      emit('cameraChange', detail);
    };
    const emitTime = (detail: { currentTime: number; duration: number }) => {
      props.onTimeUpdate?.(detail);
      emit('timeUpdate', detail);
    };
    const emitPlayback = (detail: { paused: boolean }) => {
      props.onPlaybackChange?.(detail);
      emit('playbackChange', detail);
    };

    const handle: EquirectSphereViewportHandle = {
      play: async () => {
        const video = (hostRef.value as ViewportHost | null)?.__video;
        if (!video) {
          return;
        }
        await video.play();
        emitPlayback({ paused: false });
      },
      pause: () => {
        const video = (hostRef.value as ViewportHost | null)?.__video;
        video?.pause();
        emitPlayback({ paused: true });
      },
      stop: () => {
        const video = (hostRef.value as ViewportHost | null)?.__video;
        if (!video) {
          return;
        }
        video.pause();
        video.currentTime = 0;
        emitPlayback({ paused: true });
        emitTime({ currentTime: 0, duration: video.duration || 0 });
      },
      seek: (time: number) => {
        const video = (hostRef.value as ViewportHost | null)?.__video;
        if (!video) {
          return;
        }
        video.currentTime = clamp(time, 0, video.duration || time);
      },
      getCurrentTime: () => (hostRef.value as ViewportHost | null)?.__video?.currentTime ?? 0,
      getDuration: () => (hostRef.value as ViewportHost | null)?.__video?.duration ?? 0,
      isPaused: () => (hostRef.value as ViewportHost | null)?.__video?.paused ?? true,
      getOutputCanvas: () => (hostRef.value as ViewportHost | null)?.__outputMirror ?? null,
      startRecording: () => {
        const host = hostRef.value as ViewportHost | null;
        const canvas = host?.__outputMirror;
        if (!canvas || host?.__recorder) {
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
          const host = hostRef.value as ViewportHost | null;
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

    function mountScene(): void {
      disposeScene?.();
      disposeScene = null;
      const host = hostRef.value as ViewportHost | null;
      if (!host) {
        return;
      }

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
      const outputHost = props.outputPreviewHost;
      if (outputHost) {
        outputHost.appendChild(outputMirror);
      } else {
        outputMirror.hidden = true;
        host.appendChild(outputMirror);
      }
      host.__outputMirror = outputMirror;

      const resizeOutputMirror = () => {
        const width = Math.max(2, Math.round(props.outputWidth ?? 1280));
        const height = Math.max(2, Math.round(props.outputHeight ?? 720));
        outputRenderer.setSize(width, height, false);
        outputMirror.style.width = '100%';
        outputMirror.style.height = 'auto';
        outputMirror.style.aspectRatio = `${width} / ${height}`;
      };
      host.__resizeOutputMirror = resizeOutputMirror;
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
        flipInterior: { value: props.flipInterior === false ? 0 : 1 },
      };

      const planetMaterial = new THREE.ShaderMaterial({
        uniforms: planetUniforms,
        vertexShader: VIEWPORT_VERTEX_SHADER,
        fragmentShader: VIEWPORT_FRAGMENT_SHADER,
      });
      planetScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), planetMaterial));

      let displayFov = clamp(props.horizontalFov ?? NORMAL_HFOV, MIN_HFOV, PLANET_MAX_HFOV);
      let viewYaw = props.yaw ?? 25;
      let viewPitch = clamp(props.pitch ?? -8, MIN_PITCH, MAX_PITCH);

      const bounds = () => ({
        min: props.minHorizontalFov ?? MIN_HFOV,
        max: props.maxHorizontalFov ?? PLANET_MAX_HFOV,
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
        planetUniforms.flipInterior.value = props.flipInterior === false ? 0 : 1;
      };

      const emitCameraChange = () => {
        if (applyingProps) {
          return;
        }
        emitCamera({
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
        displayFov = clamp(props.horizontalFov ?? NORMAL_HFOV, bounds().min, bounds().max);
      };

      const applyOrientationProps = () => {
        applyingProps = true;
        viewYaw = props.yaw ?? 25;
        viewPitch = clamp(props.pitch ?? -8, MIN_PITCH, MAX_PITCH);
        applyingProps = false;
      };

      const applyCameraProps = () => {
        applyOrientationProps();
        applyFovProp();
      };
      host.__applyFovProp = applyFovProp;
      host.__applyOrientationProps = applyOrientationProps;
      host.__applyCameraProps = applyCameraProps;
      applyCameraProps();

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        userInteracting = true;
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
          userInteracting = false;
        }, 150);
      };

      let pinchDistance = 0;
      const onTouchStart = (event: TouchEvent) => {
        if (event.touches.length === 2) {
          userInteracting = true;
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
        userInteracting = false;
      };

      let dragging = false;
      let dragPointerId = -1;
      let lastDragX = 0;
      let lastDragY = 0;

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) {
          return;
        }
        userInteracting = true;
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

        viewYaw -= deltaX * DRAG_SENSITIVITY;
        viewPitch = clamp(viewPitch - deltaY * DRAG_SENSITIVITY, MIN_PITCH, MAX_PITCH);
        emitCameraChange();
      };

      const endDrag = (event: PointerEvent) => {
        if (event.pointerId !== dragPointerId) {
          return;
        }
        dragging = false;
        dragPointerId = -1;
        userInteracting = false;
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

      let video: HTMLVideoElement | null = null;
      let texture: THREE.VideoTexture | null = null;

      const notifyTime = () => {
        if (!video) {
          return;
        }
        emitTime({
          currentTime: video.currentTime,
          duration: Number.isFinite(video.duration) ? video.duration : 0,
        });
      };

      const attachVideo = (src: string) => {
        if (texture) {
          texture.dispose();
          texture = null;
        }
        if (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
          video.remove();
          video = null;
        }

        video = document.createElement('video');
        video.src = src;
        video.crossOrigin = 'anonymous';
        video.loop = false;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.addEventListener('loadedmetadata', notifyTime);
        video.addEventListener('timeupdate', notifyTime);
        video.addEventListener('play', () => emitPlayback({ paused: false }));
        video.addEventListener('pause', () => emitPlayback({ paused: true }));
        void video.play().catch(() => undefined);

        host.__video = video;

        texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        applyInteriorTextureFlip(texture, props.flipInterior !== false);

        sphereMaterial.map = texture;
        sphereMaterial.color.set('#ffffff');
        sphereMaterial.needsUpdate = true;
        planetUniforms.map.value = texture;
      };

      if (props.videoSrc) {
        attachVideo(props.videoSrc);
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

        const outputWidth = Math.max(2, Math.round(props.outputWidth ?? 1280));
        const outputHeight = Math.max(2, Math.round(props.outputHeight ?? 720));
        renderFrame(outputWidth / outputHeight, outputRenderer);

        animationId = requestAnimationFrame(tick);
      };
      tick();

      disposeScene = () => {
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
        if (video) {
          video.removeEventListener('loadedmetadata', notifyTime);
          video.removeEventListener('timeupdate', notifyTime);
          video.pause();
          video.removeAttribute('src');
          video.load();
          video.remove();
        }
        host.__video = null;
        host.__outputMirror = null;
        sphere.geometry.dispose();
        sphereMaterial.dispose();
        planetMaterial.dispose();
        renderer.dispose();
        outputRenderer.dispose();
        renderer.domElement.remove();
        outputMirror.remove();
      };
    }

    onMounted(() => {
      watch(
        () => [props.videoSrc, props.flipInterior, props.outputPreviewHost],
        () => mountScene(),
        { immediate: true, flush: 'post' },
      );
      watch(
        () => [props.yaw, props.pitch, props.horizontalFov],
        () => {
          const host = hostRef.value as ViewportHost | null;
          host?.__applyFovProp?.();
          if (!userInteracting) {
            host?.__applyOrientationProps?.();
          }
        },
      );
      watch(
        () => [props.outputWidth, props.outputHeight],
        () => {
          (hostRef.value as ViewportHost | null)?.__resizeOutputMirror?.();
        },
      );
    });

    onBeforeUnmount(() => {
      disposeScene?.();
      disposeScene = null;
    });

    return () => {
      const rootClass = [
        'rd-equirect-sphere-viewport',
        props.className,
        typeof attrs.class === 'string' ? attrs.class : '',
      ]
        .filter(Boolean)
        .join(' ');
      return h('div', {
        ref: hostRef,
        class: rootClass,
        style: props.style,
        'data-testid': 'rd-equirect-sphere-viewport',
        'aria-label': 'Equirect sphere authoring view',
      });
    };
  },
});

export type EquirectSphereViewportComponent = typeof EquirectSphereViewport;
