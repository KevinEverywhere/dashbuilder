import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { GeoMap } from '@rosettadash/angular/visual/display/geo-map';
import {
  GEO_MAP_PROVIDERS,
  MOCK_DESTINATIONS,
  getDestinationById,
  type GeoMapProvider,
} from '@destination-atlas';
import { formatRegionLabel, localizedDestinationName } from '../lib/atlas-utils';
import { destinationMapView, resolveMapLocationQuery } from '../lib/map-location';
import { AtlasStateService } from '../services/atlas-state.service';
import { ConsumerSecretsService } from '../services/consumer-secrets.service';
import {
  DaBoundSelectInputComponent,
  DaBoundTextInputComponent,
} from '../components/proof-form-fields.component';
import {
  GeoExplorerLayoutComponent,
  type GeoExplorerListPlacement,
} from '../components/geo-explorer-layout.component';

export type MapScreenPart = 'toolbar' | 'explorer';

@Component({
  selector: 'da-map-screen',
  standalone: true,
  imports: [
    GeoMap,
    DaBoundTextInputComponent,
    DaBoundSelectInputComponent,
    GeoExplorerLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showToolbar()) {
      <div class="da-maps-toolbar__map-fields">
        <div class="rd-map-location">
          <da-bound-text-input
            [fieldLabel]="'Request location'"
            placeholder="Destination name or lat, lng…"
            [value]="atlas.mapLocationQuery()"
            (valueChange)="onLocationQueryChange($event)"
          />
          <button type="button" class="rd-button" (click)="submitLocation()">Go to location</button>
        </div>
        @if (locationError()) {
          <p class="da-map-location-error">{{ locationError() }}</p>
        }
        @if (view().label) {
          <p class="da-note da-maps-toolbar__view-label">
            Map view: <strong>{{ view().label }}</strong>
            @if (atlas.mapViewOverride()) {
              (custom coordinates)
            }
          </p>
        }

        <da-bound-select-input
          [fieldLabel]="'Map provider'"
          [options]="mapProviderOptions()"
          [value]="atlas.mapProvider()"
          (valueChange)="onMapProviderChange($event)"
        />
        @if (activeProvider(); as provider) {
          <dl class="da-provider-meta">
            <dt>Cost</dt>
            <dd>{{ provider.costSummary }}</dd>
            <dt>API key</dt>
            <dd>{{ provider.apiKeyRequired ? 'Required' : 'Optional' }}</dd>
            <dt>Notes</dt>
            <dd>{{ provider.notes }}</dd>
          </dl>
        }
        @if (atlas.mapProvider() === 'google-maps' && !secrets.googleMapsApiKey()) {
          <p class="da-note da-byok-cta">
            Google Maps requires an API key.
            <button type="button" class="da-locale-link" (click)="openIntegrationsSettings()">
              Configure in Settings → Integrations
            </button>
            or set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.
          </p>
        }
        @if (atlas.mapProvider() === 'maplibre' && !secrets.maplibreTileUrl()) {
          <p class="da-note">
            Using demo MapLibre tiles. Add a MapTiler key in
            <button type="button" class="da-locale-link" (click)="openIntegrationsSettings()">
              Settings → Integrations
            </button>
            for hosted vector tiles.
          </p>
        }
      </div>
    }

    @if (showExplorer()) {
      <da-geo-explorer-layout
        [listPlacement]="listPlacement()"
        [items]="listItems()"
        [selectedId]="atlas.selectedId()"
        (select)="selectDestination($event)"
      >
        <div class="da-map-stage">
          <rd-geo-map
            class="da-map-stage__map"
            [provider]="atlas.mapProvider()"
            [center]="centerJson()"
            [zoom]="view().zoom"
            [markers]="markers()"
            [selectedId]="atlas.selectedId()"
            [apiKey]="atlas.mapProvider() === 'google-maps' ? secrets.googleMapsApiKey() : undefined"
            [tileUrl]="atlas.mapProvider() === 'maplibre' ? secrets.maplibreTileUrl() : undefined"
            (markerSelect)="selectDestination($event.id)"
          />
        </div>
      </da-geo-explorer-layout>
    }
  `,
})
export class MapScreenComponent {
  readonly screenPart = input<MapScreenPart>();
  readonly embedded = input(false);
  readonly listPlacement = input<GeoExplorerListPlacement>('right');

  readonly atlas = inject(AtlasStateService);
  readonly secrets = inject(ConsumerSecretsService);

  readonly locationError = signal('');

  readonly view = computed(() => {
    const override = this.atlas.mapViewOverride();
    if (override) {
      return override;
    }
    const selected = getDestinationById(this.atlas.selectedId());
    return selected
      ? destinationMapView(selected, this.atlas.locale())
      : { lat: 20, lng: 0, zoom: 2, label: 'World' };
  });

  readonly centerJson = computed(() => JSON.stringify({ lat: this.view().lat, lng: this.view().lng }));

  readonly markers = computed(() =>
    MOCK_DESTINATIONS.map((dest) => ({
      id: dest.id,
      lat: dest.lat,
      lng: dest.lng,
      label: localizedDestinationName(dest, this.atlas.locale()),
    })),
  );

  readonly listItems = computed(() =>
    MOCK_DESTINATIONS.map((dest) => ({
      id: dest.id,
      label: localizedDestinationName(dest, this.atlas.locale()),
      meta: formatRegionLabel(dest.region),
    })),
  );

  readonly mapProviderOptions = computed(() =>
    GEO_MAP_PROVIDERS.map((entry) => ({ value: entry.id, label: entry.label })),
  );

  readonly activeProvider = computed(() =>
    GEO_MAP_PROVIDERS.find((entry) => entry.id === this.atlas.mapProvider()),
  );

  showToolbar(): boolean {
    const part = this.screenPart();
    return !this.embedded() ? true : part === 'toolbar' || part === undefined;
  }

  showExplorer(): boolean {
    const part = this.screenPart();
    return !this.embedded() ? true : part === 'explorer' || part === undefined;
  }

  onLocationQueryChange(value: string): void {
    this.atlas.mapLocationQuery.set(value);
    if (this.locationError()) {
      this.locationError.set('');
    }
  }

  submitLocation(): void {
    const resolved = resolveMapLocationQuery(this.atlas.mapLocationQuery(), this.atlas.locale());
    if (!resolved) {
      this.locationError.set(
        'No match — try a dataset destination (Tokyo, Paris, New York City…) or lat, lng (40.71, -74.01).',
      );
      return;
    }
    this.locationError.set('');
    const matchedDest = MOCK_DESTINATIONS.find(
      (dest) =>
        localizedDestinationName(dest, this.atlas.locale()).toLowerCase() === resolved.label.toLowerCase(),
    );
    if (matchedDest) {
      this.atlas.focusDestinationOnMap(matchedDest.id);
      return;
    }
    this.atlas.goToMapView(resolved);
  }

  selectDestination(id: string): void {
    this.atlas.setSelectedId(id);
  }

  openIntegrationsSettings(): void {
    this.atlas.setHighlightTarget('integrations');
    this.atlas.setScreen('settings');
  }

  onMapProviderChange(value: string): void {
    this.atlas.setMapProvider(value as GeoMapProvider);
  }
}
