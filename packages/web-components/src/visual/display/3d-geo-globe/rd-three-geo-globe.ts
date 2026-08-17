import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

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

const GLOBE_RADIUS = 1.6;

function latLngToGlobePosition(lat: number, lng: number, radius: number): { x: number; y: number; z: number } {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const surfaceRadius = radius + 0.04;
  return {
    x: -surfaceRadius * Math.sin(phi) * Math.cos(theta),
    y: surfaceRadius * Math.cos(phi),
    z: surfaceRadius * Math.sin(phi) * Math.sin(theta),
  };
}

/** @rosettadash/web-components/visual/display/3d-geo-globe — visual.display.3d-geo-globe */
export class RdThreeGeoGlobeElement extends RosettaAtomElement {
  static readonly tagName = RD_THREE_GEO_GLOBE_TAG;

  private sceneDispose: (() => void) | null = null;
  private markersValue: GlobeMarker[] = [];
  private selectedIdValue = '';

  static get observedAttributes(): string[] {
    return ['title', 'texture-url', 'markers', 'selected-id', 'min-height'];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    void this.mountThreeScene();
  }

  disconnectedCallback(): void {
    this.sceneDispose?.();
    this.sceneDispose = null;
  }

  override attributeChangedCallback(name: string): void {
    if (name === 'markers') {
      this.markersValue = this.parseJsonAttr<GlobeMarker[]>('markers', []);
    }
    if (name === 'selected-id') {
      this.selectedIdValue = this.readAttr('selected-id');
    }
    super.attributeChangedCallback(name);
    if (this.isConnected && (name === 'markers' || name === 'selected-id' || name === 'texture-url')) {
      void this.mountThreeScene();
    }
  }

  override setProperty(name: string, value: unknown): void {
    super.setProperty(name, value);
    if (name === 'markers' && Array.isArray(value)) {
      this.markersValue = value as GlobeMarker[];
    }
    if (name === 'selectedId') {
      this.selectedIdValue = String(value ?? '');
      this.setAttribute('selected-id', this.selectedIdValue);
    }
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

  private async mountThreeScene(): Promise<void> {
    this.sceneDispose?.();
    this.sceneDispose = null;

    const host = this.querySelector('[data-ref="canvas-host"]') as HTMLElement | null;
    if (!host) {
      return;
    }
    host.innerHTML = '';

    try {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0b1220');

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0.4, 4.8);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      host.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.72));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
      keyLight.position.set(4, 6, 5);
      scene.add(keyLight);

      const globeMaterial = new THREE.MeshStandardMaterial({ color: '#1d4ed8' });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64), globeMaterial);
      scene.add(globe);

      const textureUrl = this.readAttr('texture-url');
      if (textureUrl) {
        new THREE.TextureLoader().load(textureUrl, (texture) => {
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
      const markers = this.markersValue.length
        ? this.markersValue
        : this.parseJsonAttr<GlobeMarker[]>('markers', []);
      const selectedId = this.selectedIdValue || this.readAttr('selected-id');

      for (const marker of markers) {
        const mesh = new THREE.Mesh(
          markerGeometry,
          new THREE.MeshStandardMaterial({ color: '#f87171' }),
        );
        mesh.userData['id'] = marker.id;
        const pos = latLngToGlobePosition(marker.lat, marker.lng, GLOBE_RADIUS);
        mesh.position.set(pos.x, pos.y, pos.z);
        const selected = marker.id === selectedId;
        const material = mesh.material as import('three').MeshStandardMaterial;
        material.color.set(selected ? '#fbbf24' : '#f87171');
        material.emissive.set(selected ? '#92400e' : '#000000');
        material.emissiveIntensity = selected ? 0.35 : 0;
        scene.add(mesh);
        markerMeshes.set(marker.id, mesh);
      }

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

      const onPointerDown = (event: PointerEvent): void => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects([...markerMeshes.values()]);
        const hit = hits[0]?.object as import('three').Mesh | undefined;
        const id = hit?.userData?.['id'] as string | undefined;
        if (id) {
          this.dispatchDetail('marker-select', { id });
        }
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);

      this.sceneDispose = (): void => {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
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
        globe.material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    } catch {
      host.innerHTML =
        '<p class="da-note">Three.js unavailable — install <code>three</code> as a peer dependency for the interactive globe.</p>';
    }
  }
}

export function registerRdThreeGeoGlobe(): void {
  defineRosettaElement(RD_THREE_GEO_GLOBE_TAG, RdThreeGeoGlobeElement);
}
