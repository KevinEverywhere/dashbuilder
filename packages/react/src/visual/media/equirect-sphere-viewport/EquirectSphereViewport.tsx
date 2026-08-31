import { wrapSignedDegrees } from '@rosettadash/core';
import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties, type RefObject } from 'react';
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
  style?: CSSProperties;
  outputPreviewHostRef?: RefObject<HTMLElement | null>;
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
export const EquirectSphereViewport = forwardRef<EquirectSphereViewportHandle, EquirectSphereViewportProps>(
  function EquirectSphereViewport(
    {
      videoSrc,
      flipInterior = true,
      yaw = 25,
      pitch = -8,
      horizontalFov = NORMAL_HFOV,
      outputWidth = 1280,
      outputHeight = 720,
      minHorizontalFov = MIN_HFOV,
      maxHorizontalFov = PLANET_MAX_HFOV,
      className,
      style,
      outputPreviewHostRef,
      onCameraChange,
      onTimeUpdate,
      onPlaybackChange,
    },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef({
      yaw,
      pitch,
      horizontalFov,
      outputWidth,
      outputHeight,
      minHorizontalFov,
      maxHorizontalFov,
      flipInterior,
      onCameraChange,
      onTimeUpdate,
      onPlaybackChange,
    });
    propsRef.current = {
      yaw,
      pitch,
      horizontalFov,
      outputWidth,
      outputHeight,
      minHorizontalFov,
      maxHorizontalFov,
      flipInterior,
      onCameraChange,
      onTimeUpdate,
      onPlaybackChange,
    };
    const applyingPropsRef = useRef(false);
    const userInteractingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = (hostRef.current as ViewportHost | null)?.__video;
        if (!video) {
          return;
        }
        await video.play();
        propsRef.current.onPlaybackChange?.({ paused: false });
      },
      pause: () => {
        const video = (hostRef.current as ViewportHost | null)?.__video;
        video?.pause();
        propsRef.current.onPlaybackChange?.({ paused: true });
      },
      stop: () => {
        const video = (hostRef.current as ViewportHost | null)?.__video;
        if (!video) {
          return;
        }
        video.pause();
        video.currentTime = 0;
        propsRef.current.onPlaybackChange?.({ paused: true });
        propsRef.current.onTimeUpdate?.({ currentTime: 0, duration: video.duration || 0 });
      },
      seek: (time: number) => {
        const video = (hostRef.current as ViewportHost | null)?.__video;
        if (!video) {
          return;
        }
        video.currentTime = clamp(time, 0, video.duration || time);
      },
      getCurrentTime: () => (hostRef.current as ViewportHost | null)?.__video?.currentTime ?? 0,
      getDuration: () => (hostRef.current as ViewportHost | null)?.__video?.duration ?? 0,
      isPaused: () => (hostRef.current as ViewportHost | null)?.__video?.paused ?? true,
      getOutputCanvas: () => (hostRef.current as ViewportHost | null)?.__outputMirror ?? null,
      startRecording: () => {
        const host = hostRef.current as ViewportHost | null;
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
          const host = hostRef.current as ViewportHost | null;
          const recorder = host?.__recorder;
          if (!recorder || recorder.state === 'inactive') {
            resolve(null);
            return;
          }
          recorder.onstop = () => {
            const chunks = host?.__recordedChunks ?? [];
            host.__recorder = null;
            host.__recordedChunks = [];
            resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
          };
          recorder.stop();
        }),
    }));

    useEffect(() => {
      const host = hostRef.current as ViewportHost | null;
      host?.__applyFovProp?.();
      if (!userInteractingRef.current) {
        host?.__applyOrientationProps?.();
      }
    }, [yaw, pitch, horizontalFov]);

    useEffect(() => {
      (hostRef.current as ViewportHost | null)?.__resizeOutputMirror?.();
    }, [outputWidth, outputHeight]);

    useEffect(() => {
      const host = hostRef.current;
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
      const outputHost = outputPreviewHostRef?.current;
      if (outputHost) {
        outputHost.appendChild(outputMirror);
      } else {
        outputMirror.hidden = true;
        host.appendChild(outputMirror);
      }
      (host as ViewportHost).__outputMirror = outputMirror;

      const resizeOutputMirror = () => {
        const width = Math.max(2, Math.round(propsRef.current.outputWidth));
        const height = Math.max(2, Math.round(propsRef.current.outputHeight));
        outputRenderer.setSize(width, height, false);
        outputMirror.style.width = '100%';
        outputMirror.style.height = 'auto';
        outputMirror.style.aspectRatio = `${width} / ${height}`;
      };
      (host as ViewportHost).__resizeOutputMirror = resizeOutputMirror;
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

      let displayFov = clamp(propsRef.current.horizontalFov, MIN_HFOV, PLANET_MAX_HFOV);
      let viewYaw = wrapSignedDegrees(propsRef.current.yaw);
      let viewPitch = clamp(propsRef.current.pitch, MIN_PITCH, MAX_PITCH);

      const bounds = () => ({
        min: propsRef.current.minHorizontalFov,
        max: propsRef.current.maxHorizontalFov,
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
        planetUniforms.flipInterior.value = propsRef.current.flipInterior ? 1 : 0;
      };

      const emitCameraChange = () => {
        if (applyingPropsRef.current) {
          return;
        }
        propsRef.current.onCameraChange?.({
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
        displayFov = clamp(propsRef.current.horizontalFov, bounds().min, bounds().max);
      };

      const applyOrientationProps = () => {
        applyingPropsRef.current = true;
        viewYaw = wrapSignedDegrees(propsRef.current.yaw);
        viewPitch = clamp(propsRef.current.pitch, MIN_PITCH, MAX_PITCH);
        applyingPropsRef.current = false;
      };

      const applyCameraProps = () => {
        applyOrientationProps();
        applyFovProp();
      };
      (host as ViewportHost).__applyFovProp = applyFovProp;
      (host as ViewportHost).__applyOrientationProps = applyOrientationProps;
      (host as ViewportHost).__applyCameraProps = applyCameraProps;
      applyCameraProps();

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        userInteractingRef.current = true;
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
          userInteractingRef.current = false;
        }, 150);
      };

      let pinchDistance = 0;
      const onTouchStart = (event: TouchEvent) => {
        if (event.touches.length === 2) {
          userInteractingRef.current = true;
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
        userInteractingRef.current = false;
      };

      let dragging = false;
      let dragPointerId = -1;
      let lastDragX = 0;
      let lastDragY = 0;

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) {
          return;
        }
        userInteractingRef.current = true;
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
        userInteractingRef.current = false;
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
        propsRef.current.onTimeUpdate?.({
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
        video.addEventListener('play', () => propsRef.current.onPlaybackChange?.({ paused: false }));
        video.addEventListener('pause', () => propsRef.current.onPlaybackChange?.({ paused: true }));
        void video.play().catch(() => undefined);

        (host as ViewportHost).__video = video;

        texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        applyInteriorTextureFlip(texture, propsRef.current.flipInterior);

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

        const outputWidth = Math.max(2, Math.round(propsRef.current.outputWidth));
        const outputHeight = Math.max(2, Math.round(propsRef.current.outputHeight));
        renderFrame(outputWidth / outputHeight, outputRenderer);

        animationId = requestAnimationFrame(tick);
      };
      tick();

      return () => {
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
        (host as ViewportHost).__video = null;
        (host as ViewportHost).__outputMirror = null;
        sphere.geometry.dispose();
        sphereMaterial.dispose();
        planetMaterial.dispose();
        renderer.dispose();
        outputRenderer.dispose();
        renderer.domElement.remove();
        outputMirror.remove();
      };
    }, [videoSrc, flipInterior, outputPreviewHostRef]);

    const rootClass = ['rd-equirect-sphere-viewport', className].filter(Boolean).join(' ');

    return (
      <div
        ref={(node) => {
          hostRef.current = node;
        }}
        className={rootClass}
        style={style}
        data-testid="rd-equirect-sphere-viewport"
        aria-label="Equirect sphere authoring view"
      />
    );
  },
);

function pickRecorderMimeType(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}
