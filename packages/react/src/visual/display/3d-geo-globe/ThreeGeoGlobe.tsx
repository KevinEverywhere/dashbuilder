import { forwardRef, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  cameraPositionFacingLatLng,
  GLOBE_CAMERA_DISTANCE,
  GLOBE_FLY_DURATION_MS,
  GLOBE_HEIGHT_SEGMENTS,
  GLOBE_RADIUS,
  GLOBE_WIDTH_SEGMENTS,
  latLngToGlobePosition,
  patchEquirectGlobeMaterial,
  prepareEquirectGlobeTexture,
} from '@rosettadash/web-components/visual/display/3d-geo-globe';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface GlobeMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

export interface ThreeGeoGlobeProps {
  title?: string;
  textureUrl?: string;
  markers?: GlobeMarker[];
  selectedId?: string;
  onMarkerSelect?: (id: string) => void;
  minHeight?: string | number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function toVector3(point: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(point.x, point.y, point.z);
}

/** @rosettadash/react/visual/display/3d-geo-globe — Three.js globe with destination markers */
export const ThreeGeoGlobe = forwardRef<HTMLElement, ThreeGeoGlobeProps>(function ThreeGeoGlobe(
  {
    title,
    textureUrl,
    markers = [],
    selectedId,
    onMarkerSelect,
    minHeight = '28rem',
    className,
    style,
    children,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const markerMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const syncMarkersRef = useRef<(() => void) | null>(null);
  const flyToLatLngRef = useRef<((lat: number, lng: number, immediate?: boolean) => void) | null>(
    null,
  );
  const hasFacedSelectionRef = useRef(false);
  const propsRef = useRef({ markers, selectedId, onMarkerSelect });
  propsRef.current = { markers, selectedId, onMarkerSelect };

  const rootClass = ['rd-display-3d-geo-globe', className].filter(Boolean).join(' ');
  const hostStyle: CSSProperties = {
    ...style,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1220');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.4, GLOBE_CAMERA_DISTANCE);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const globeMaterial = new THREE.MeshStandardMaterial({ color: '#1d4ed8' });
    patchEquirectGlobeMaterial(globeMaterial);
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, GLOBE_WIDTH_SEGMENTS, GLOBE_HEIGHT_SEGMENTS),
      globeMaterial,
    );
    scene.add(globe);

    let textureLoadId = 0;
    if (textureUrl) {
      const loadId = ++textureLoadId;
      new THREE.TextureLoader().load(textureUrl, (texture) => {
        if (loadId !== textureLoadId) {
          texture.dispose();
          return;
        }
        prepareEquirectGlobeTexture(texture, {
          colorSpace: THREE.SRGBColorSpace,
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          anisotropy: Math.min(16, renderer.capabilities.getMaxAnisotropy()),
        });
        globeMaterial.map = texture;
        globeMaterial.color.set('#ffffff');
        globeMaterial.needsUpdate = true;
      });
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.8;
    controls.maxDistance = 8;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    const markerGeometry = new THREE.SphereGeometry(0.06, 12, 12);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const syncMarkers = () => {
      const { markers: nextMarkers, selectedId: nextSelected } = propsRef.current;
      const meshes = markerMeshesRef.current;

      for (const id of [...meshes.keys()]) {
        if (!nextMarkers.some((marker) => marker.id === id)) {
          const mesh = meshes.get(id);
          if (mesh) {
            (mesh.material as THREE.Material).dispose();
            mesh.removeFromParent();
          }
          meshes.delete(id);
        }
      }

      for (const marker of nextMarkers) {
        let mesh = meshes.get(marker.id);
        if (!mesh) {
          mesh = new THREE.Mesh(markerGeometry, new THREE.MeshStandardMaterial({ color: '#f87171' }));
          mesh.userData['id'] = marker.id;
          scene.add(mesh);
          meshes.set(marker.id, mesh);
        }
        mesh.position.copy(toVector3(latLngToGlobePosition(marker.lat, marker.lng, GLOBE_RADIUS)));
        const material = mesh.material as THREE.MeshStandardMaterial;
        const selected = marker.id === nextSelected;
        material.color.set(selected ? '#fbbf24' : '#f87171');
        material.emissive.set(selected ? '#92400e' : '#000000');
        material.emissiveIntensity = selected ? 0.35 : 0;
      }
    };

    syncMarkers();
    syncMarkersRef.current = syncMarkers;

    let flyFrameId = 0;
    flyToLatLngRef.current = (lat: number, lng: number, immediate = false) => {
      cancelAnimationFrame(flyFrameId);
      const distance = camera.position.length() || GLOBE_CAMERA_DISTANCE;
      const endPos = toVector3(cameraPositionFacingLatLng(lat, lng, distance));
      if (immediate) {
        camera.position.copy(endPos);
        controls.update();
        return;
      }
      controls.autoRotate = false;
      const startPos = camera.position.clone();
      const flyStart = performance.now();

      const animateFly = (now: number) => {
        const t = Math.min((now - flyStart) / GLOBE_FLY_DURATION_MS, 1);
        const eased = 1 - (1 - t) ** 3;
        camera.position.lerpVectors(startPos, endPos, eased);
        controls.update();
        if (t < 1) {
          flyFrameId = requestAnimationFrame(animateFly);
        } else {
          controls.autoRotate = true;
        }
      };

      flyFrameId = requestAnimationFrame(animateFly);
    };

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let animationId = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(tick);
    };
    tick();

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...markerMeshesRef.current.values()]);
      const hit = hits[0]?.object as THREE.Mesh | undefined;
      const id = hit?.userData?.['id'] as string | undefined;
      if (id) {
        propsRef.current.onMarkerSelect?.(id);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    return () => {
      syncMarkersRef.current = null;
      flyToLatLngRef.current = null;
      hasFacedSelectionRef.current = false;
      cancelAnimationFrame(flyFrameId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      controls.dispose();
      markerMeshesRef.current.forEach((mesh) => {
        (mesh.material as THREE.Material).dispose();
        mesh.removeFromParent();
      });
      markerMeshesRef.current.clear();
      globeGeometryDispose(globe);
      markerGeometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      textureLoadId += 1;
    };
  }, [textureUrl]);

  useEffect(() => {
    syncMarkersRef.current?.();
  }, [markers, selectedId]);

  const selectedMarker = markers.find((entry) => entry.id === selectedId);

  useEffect(() => {
    if (!selectedMarker) {
      return;
    }
    const immediate = !hasFacedSelectionRef.current;
    hasFacedSelectionRef.current = true;
    flyToLatLngRef.current?.(selectedMarker.lat, selectedMarker.lng, immediate);
  }, [selectedId, selectedMarker?.lat, selectedMarker?.lng]);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={rootClass}
      style={hostStyle}
      data-testid="rd-display-3d-geo-globe"
      aria-label={title ?? '3D destination globe'}
    >
      {title ? <header className="rd-display-3d-geo-globe__header">{title}</header> : null}
      <div ref={hostRef} className="rd-display-3d-geo-globe__canvas-host" />
      {children}
    </section>
  );
});

function globeGeometryDispose(globe: THREE.Mesh): void {
  globe.geometry.dispose();
  const material = globe.material;
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
  } else {
    material.dispose();
    if (material instanceof THREE.MeshStandardMaterial && material.map) {
      material.map.dispose();
    }
  }
}
