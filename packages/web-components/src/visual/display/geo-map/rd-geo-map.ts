import { defineRosettaElement, readNumber, readString } from '../../../lib/element-utils.js';
import { applyShadowMount, ensureShadowBase } from '../../../lib/shadow-base.js';
import { geoMapShadowCss, geoMapShadowHtml } from './rd-geo-map.shadow.js';
import { createGeoMapAdapter } from './providers/create-adapter.js';
import { parseGeoMapCenter } from './parse-center.js';
import { parseGeoMapMarkers } from './parse-markers.js';
import {
  DEFAULT_GEO_MAP_VIEW,
  normalizeGeoMapProvider,
  type GeoMapAdapter,
  type GeoMapMarker,
  type GeoMapProvider,
  type GeoMapView,
} from './geo-map-types.js';

export const DB_GEO_MAP_TAG = 'rd-geo-map';

/** Public props contract for visual/display/geo-map (all runtimes share this shape). */
export interface GeoMapProps {
  provider?: GeoMapProvider;
  tileUrl?: string;
  apiKey?: string;
  center?: string;
  zoom?: number;
  markers?: GeoMapMarker[];
  selectedId?: string;
  className?: string;
}

export type { GeoMapMarker, GeoMapProvider };

export class RdGeoMapElement extends HTMLElement {
  static readonly tagName = DB_GEO_MAP_TAG;

  private adapter: GeoMapAdapter | null = null;
  private markersValue: GeoMapMarker[] = [];
  private resourcesReady: Promise<void> | null = null;
  private mapInit: Promise<void> | null = null;

  static get observedAttributes(): string[] {
    return [
      'provider',
      'tile-url',
      'api-key',
      'center',
      'zoom',
      'markers',
      'selected-id',
    ];
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    this.syncMarkersFromAttribute();
    this.resourcesReady = this.mountShadow();
    void this.resourcesReady
      .then(() => this.ensureMap())
      .catch((error) => {
        console.error('[rd-geo-map] shadow mount failed', error);
        this.showMountError();
      });
  }

  disconnectedCallback(): void {
    this.adapter?.destroy();
    this.adapter = null;
    this.mapInit = null;
  }

  attributeChangedCallback(name: string): void {
    if (name === 'markers') {
      this.syncMarkersFromAttribute();
    }
    if (this.shadowRoot && this.resourcesReady) {
      void this.resourcesReady.then(() => this.syncMapState(name));
    }
  }

  setProperty(name: string, value: unknown): void {
    (this as Record<string, unknown>)[name] = value;
    if (name === 'markers' && Array.isArray(value)) {
      this.markersValue = value as GeoMapMarker[];
      this.setAttribute('markers', JSON.stringify(this.markersValue));
    }
    if (this.resourcesReady) {
      void this.resourcesReady.then(() => this.syncMapState(name));
    }
  }

  whenReady(): Promise<void> {
    return this.resourcesReady ?? Promise.resolve();
  }

  whenMapReady(): Promise<void> {
    if (this.mapInit) {
      return this.mapInit;
    }
    if (this.resourcesReady) {
      return this.resourcesReady.then(async () => {
        await this.ensureMap();
      });
    }
    return Promise.resolve();
  }

  get provider(): GeoMapProvider {
    return normalizeGeoMapProvider(this.getAttribute('provider'));
  }

  set provider(value: GeoMapProvider) {
    this.setAttribute('provider', value);
  }

  get tileUrl(): string {
    return readString(this.getAttribute('tile-url'), '');
  }

  get apiKey(): string {
    return readString(this.getAttribute('api-key'), '');
  }

  get center(): string {
    return readString(this.getAttribute('center'), '');
  }

  get zoom(): number {
    return readNumber(this.getAttribute('zoom'), DEFAULT_GEO_MAP_VIEW.zoom);
  }

  get markers(): GeoMapMarker[] {
    return this.markersValue;
  }

  set markers(value: GeoMapMarker[]) {
    this.markersValue = Array.isArray(value) ? value : [];
    this.setAttribute('markers', JSON.stringify(this.markersValue));
  }

  get selectedId(): string {
    return readString(this.getAttribute('selected-id'), '');
  }

  set selectedId(value: string) {
    if (value) {
      this.setAttribute('selected-id', value);
    } else {
      this.removeAttribute('selected-id');
    }
  }

  private syncMarkersFromAttribute(): void {
    this.markersValue = parseGeoMapMarkers(this.getAttribute('markers'));
  }

  private resolveView(): GeoMapView {
    const center = parseGeoMapCenter(this.center);
    return {
      lat: center.lat,
      lng: center.lng,
      zoom: this.zoom,
    };
  }

  private mountShadow(): Promise<void> {
    const root = this.shadowRoot;
    if (!root || root.querySelector('[data-ref="canvas"]')) {
      return Promise.resolve();
    }
    applyShadowMount(root, { html: geoMapShadowHtml, css: geoMapShadowCss });
    return Promise.resolve();
  }

  private showMountError(): void {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }
    root.innerHTML =
      '<p class="rd-geo-map__mount-error">Map UI failed to load. Refresh the page.</p>';
  }

  private showError(message: string): void {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }
    const error = root.querySelector<HTMLElement>('[data-ref="error"]');
    const canvas = root.querySelector<HTMLElement>('[data-ref="canvas"]');
    if (!error || !canvas) {
      return;
    }
    error.textContent = message;
    error.hidden = false;
    canvas.hidden = true;
  }

  private clearError(): void {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }
    const error = root.querySelector<HTMLElement>('[data-ref="error"]');
    const canvas = root.querySelector<HTMLElement>('[data-ref="canvas"]');
    if (!error || !canvas) {
      return;
    }
    error.textContent = '';
    error.hidden = true;
    canvas.hidden = false;
  }

  private handleMarkerSelect(marker: GeoMapMarker): void {
    this.selectedId = marker.id;
    this.adapter?.setMarkers(this.markersValue, marker.id);
    this.dispatchEvent(
      new CustomEvent('marker-select', {
        detail: { id: marker.id, lat: marker.lat, lng: marker.lng },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async ensureMap(force = false): Promise<void> {
    if (this.mapInit && !force) {
      await this.mapInit;
      return;
    }

    this.mapInit = this.initMap(force);
    await this.mapInit;
  }

  private async initMap(force: boolean): Promise<void> {
    const root = this.shadowRoot;
    const canvas = root?.querySelector<HTMLElement>('[data-ref="canvas"]');
    if (!canvas) {
      return;
    }

    if (force) {
      this.adapter?.destroy();
      this.adapter = null;
      canvas.replaceChildren();
      delete (canvas as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    }

    this.clearError();

    this.adapter = await createGeoMapAdapter({
      container: canvas,
      provider: this.provider,
      view: this.resolveView(),
      markers: this.markersValue,
      selectedId: this.selectedId || undefined,
      tileUrl: this.tileUrl || undefined,
      apiKey: this.apiKey || undefined,
      onMarkerSelect: (marker) => this.handleMarkerSelect(marker),
      onError: (message) => this.showError(message),
    });
  }

  private async syncMapState(changed: string): Promise<void> {
    if (changed === 'provider') {
      await this.ensureMap(true);
      return;
    }

    if (!this.adapter) {
      await this.ensureMap();
      return;
    }

    if (changed === 'markers' || changed === 'selected-id') {
      this.adapter.setMarkers(this.markersValue, this.selectedId || undefined);
    }

    if (changed === 'center' || changed === 'zoom') {
      this.adapter.setView(this.resolveView());
    }

    if (changed === 'tile-url' || changed === 'api-key') {
      await this.ensureMap(true);
    }
  }
}

export function registerRdGeoMap(): void {
  ensureShadowBase(DB_GEO_MAP_TAG);
  defineRosettaElement(DB_GEO_MAP_TAG, RdGeoMapElement);
}
