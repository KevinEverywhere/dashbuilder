import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';
import {
  cameraPositionFacingLatLng,
  GLOBE_CAMERA_DISTANCE,
  GLOBE_FLY_DURATION_MS,
  GLOBE_HEIGHT_SEGMENTS,
  GLOBE_RADIUS,
  GLOBE_WIDTH_SEGMENTS,
  latLngToGlobePosition,
  parseGlobeMarkersJson,
  patchEquirectGlobeMaterial,
  prepareEquirectGlobeTexture,
  isGlobePointerClick,
  resolveGlobePickId,
} from './globe-view.js';

export const RD_THREE_GEO_GLOBE_TAG = 'rd-three-geo-globe';

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
  minHeight?: string | number;
  className?: string;
}

interface GlobeRuntime {
  syncMarkers: () => void;
  faceSelection: (immediate: boolean) => void;
  dispose: () => void;
}

/** @rosettadash/web-components/visual/display/3d-geo-globe — visual.display.3d-geo-globe */
export class RdThreeGeoGlobeElement extends RosettaAtomElement {
  static readonly tagName = RD_THREE_GEO_GLOBE_TAG;

  private runtime: GlobeRuntime | null = null;
  private markersValue: GlobeMarker[] = [];
  private selectedIdValue = '';
  private hasFacedSelection = false;
  private mountGeneration = 0;

  static get observedAttributes(): string[] {
    return ['title', 'texture-url', 'markers', 'selected-id', 'min-height'];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    void this.mountThreeScene();
  }

  disconnectedCallback(): void {
    this.mountGeneration += 1;
    this.runtime?.dispose();
    this.runtime = null;
    this.hasFacedSelection = false;
  }

  override attributeChangedCallback(name: string): void {
    if (name === 'markers') {
      const parsed = parseGlobeMarkersJson(this.getAttribute('markers'));
      if (parsed !== null) {
        this.markersValue = parsed as GlobeMarker[];
      }
      this.syncRuntime();
      return;
    }
    if (name === 'selected-id') {
      this.selectedIdValue = this.readAttr('selected-id');
      this.syncRuntime();
      return;
    }
    if (name === 'texture-url' || name === 'title' || name === 'min-height') {
      this.runtime?.dispose();
      this.runtime = null;
    }
    super.attributeChangedCallback(name);
    if (this.isConnected && (name === 'texture-url' || name === 'title' || name === 'min-height')) {
      void this.mountThreeScene();
    }
  }

  override setProperty(name: string, value: unknown): void {
    if (name === 'markers' && Array.isArray(value)) {
      this.markersValue = value as GlobeMarker[];
      this.syncRuntime();
      return;
    }
    if (name === 'selectedId') {
      this.selectedIdValue = String(value ?? '');
      this.setAttribute('selected-id', this.selectedIdValue);
      return;
    }
    super.setProperty(name, value);
    if (this.isConnected) {
      void this.mountThreeScene();
    }
  }

  protected override buildMarkup(): string {
    const title = this.readAttr('title');
    const minHeight = this.readAttr('min-height', '28rem');
    return `
      <section class="rd-display-3d-geo-globe" data-testid="rd-display-3d-geo-globe" style="min-height:${minHeight}" aria-label="${this.esc(title || '3D destination globe')}">
        ${title ? `<header class="rd-display-3d-geo-globe__header">${this.esc(title)}</header>` : ''}
        <div class="rd-display-3d-geo-globe__canvas-host" data-ref="canvas-host"></div>
        <div data-ref="slot"></div>
      </section>`;
  }

  private currentMarkers(): GlobeMarker[] {
    if (this.markersValue.length) {
      return this.markersValue;
    }
    const parsed = parseGlobeMarkersJson(this.getAttribute('markers'));
    return parsed !== null ? (parsed as GlobeMarker[]) : [];
  }

  private currentSelectedId(): string {
    return this.selectedIdValue || this.readAttr('selected-id');
  }

  private syncRuntime(): void {
    if (!this.runtime) {
      return;
    }
    this.runtime.syncMarkers();
    this.runtime.faceSelection(!this.hasFacedSelection);
  }

  private async mountThreeScene(): Promise<void> {
    const generation = ++this.mountGeneration;
    this.runtime?.dispose();
    this.runtime = null;
    this.hasFacedSelection = false;

    const host = this.querySelector('[data-ref="canvas-host"]') as HTMLElement | null;
    if (!host) {
      return;
    }
    host.innerHTML = '';

    try {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      if (generation !== this.mountGeneration || !this.isConnected) {
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

      const textureUrl = this.readAttr('texture-url');
      if (textureUrl) {
        new THREE.TextureLoader().load(textureUrl, (texture) => {
          if (generation !== this.mountGeneration) {
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

      const markerMeshes = new Map<string, import('three').Mesh>();
      const markerGeometry = new THREE.SphereGeometry(0.06, 12, 12);

      const syncMarkers = (): void => {
        const nextMarkers = this.currentMarkers();
        const nextSelected = this.currentSelectedId();

        for (const id of [...markerMeshes.keys()]) {
          if (!nextMarkers.some((marker) => marker.id === id)) {
            const mesh = markerMeshes.get(id);
            if (mesh) {
              (mesh.material as import('three').Material).dispose();
              mesh.removeFromParent();
            }
            markerMeshes.delete(id);
          }
        }

        for (const marker of nextMarkers) {
          let mesh = markerMeshes.get(marker.id);
          if (!mesh) {
            mesh = new THREE.Mesh(
              markerGeometry,
              new THREE.MeshStandardMaterial({ color: '#f87171' }),
            );
            mesh.userData['id'] = marker.id;
            scene.add(mesh);
            markerMeshes.set(marker.id, mesh);
          }
          const pos = latLngToGlobePosition(marker.lat, marker.lng, GLOBE_RADIUS);
          mesh.position.set(pos.x, pos.y, pos.z);
          const material = mesh.material as import('three').MeshStandardMaterial;
          const selected = marker.id === nextSelected;
          material.color.set(selected ? '#fbbf24' : '#f87171');
          material.emissive.set(selected ? '#92400e' : '#000000');
          material.emissiveIntensity = selected ? 0.35 : 0;
        }
      };

      let flyFrameId = 0;
      const faceLatLng = (lat: number, lng: number, immediate: boolean): void => {
        cancelAnimationFrame(flyFrameId);
        const distance = camera.position.length() || GLOBE_CAMERA_DISTANCE;
        const end = cameraPositionFacingLatLng(lat, lng, distance);
        if (immediate) {
          camera.position.set(end.x, end.y, end.z);
          controls.update();
          return;
        }
        controls.autoRotate = false;
        const startPos = camera.position.clone();
        const endPos = new THREE.Vector3(end.x, end.y, end.z);
        const flyStart = performance.now();
        const animateFly = (now: number): void => {
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

      const faceSelection = (immediate: boolean): void => {
        const selectedId = this.currentSelectedId();
        if (!selectedId) {
          return;
        }
        const marker = this.currentMarkers().find((entry) => entry.id === selectedId);
        if (!marker) {
          return;
        }
        faceLatLng(marker.lat, marker.lng, immediate);
        this.hasFacedSelection = true;
      };

      const resize = (): void => {
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
      const tick = (): void => {
        controls.update();
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(tick);
      };
      tick();

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerDown: { x: number; y: number } | null = null;

      const pickFromPointer = (event: PointerEvent): void => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects([globe, ...markerMeshes.values()]);
        const first = hits[0];
        const firstMesh = first?.object as import('three').Mesh | undefined;
        const markerHitId =
          firstMesh && firstMesh !== globe
            ? (firstMesh.userData?.['id'] as string | undefined)
            : undefined;
        const globeHit = firstMesh === globe ? first : undefined;
        const id = resolveGlobePickId(
          this.currentMarkers(),
          markerHitId,
          globeHit
            ? { x: globeHit.point.x, y: globeHit.point.y, z: globeHit.point.z }
            : undefined,
        );
        if (id) {
          this.dispatchDetail('marker-select', { id });
        }
      };

      const onPointerDown = (event: PointerEvent): void => {
        if (event.button !== 0) {
          return;
        }
        pointerDown = { x: event.clientX, y: event.clientY };
      };

      const onPointerUp = (event: PointerEvent): void => {
        if (event.button !== 0) {
          return;
        }
        const start = pointerDown;
        pointerDown = null;
        if (!isGlobePointerClick(start, event.clientX, event.clientY)) {
          return;
        }
        pickFromPointer(event);
      };

      const onPointerCancel = (): void => {
        pointerDown = null;
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointercancel', onPointerCancel);

      const dispose = (): void => {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointercancel', onPointerCancel);
        cancelAnimationFrame(flyFrameId);
        cancelAnimationFrame(animationId);
        resizeObserver.disconnect();
        controls.dispose();
        markerMeshes.forEach((mesh) => {
          (mesh.material as import('three').Material).dispose();
          mesh.removeFromParent();
        });
        markerMeshes.clear();
        globe.geometry.dispose();
        markerGeometry.dispose();
        if (globeMaterial.map) {
          globeMaterial.map.dispose();
        }
        globeMaterial.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };

      if (generation !== this.mountGeneration || !this.isConnected) {
        dispose();
        return;
      }

      syncMarkers();
      this.runtime = { syncMarkers, faceSelection, dispose };
      faceSelection(true);
    } catch {
      if (generation !== this.mountGeneration) {
        return;
      }
      host.innerHTML =
        '<p class="da-note">Three.js unavailable — install <code>three</code> as a peer dependency for the interactive globe.</p>';
    }
  }
}

export function registerRdThreeGeoGlobe(): void {
  defineRosettaElement(RD_THREE_GEO_GLOBE_TAG, RdThreeGeoGlobeElement);
}
