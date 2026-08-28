import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ThreeGeoGlobe } from '@rosettadash/angular/visual/display/3d-geo-globe';
import {
  DEFAULT_WORLD_EQUIRECT_ATTRIBUTION,
  DEFAULT_WORLD_EQUIRECT_URL,
  GLOBE_TEXTURE_SOURCE_OPTIONS,
  MOCK_DESTINATIONS,
} from '@destination-atlas';
import { formatRegionLabel, localizedDestinationName } from '../lib/atlas-utils';
import { AtlasStateService } from '../services/atlas-state.service';
import {
  GeoExplorerLayoutComponent,
  type GeoExplorerListPlacement,
} from '../components/geo-explorer-layout.component';

export type GlobeScreenPart = 'explorer' | 'footer';

@Component({
  selector: 'da-globe-screen',
  standalone: true,
  imports: [ThreeGeoGlobe, GeoExplorerLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showExplorer()) {
      <da-geo-explorer-layout
        [listPlacement]="listPlacement()"
        [items]="listItems()"
        [selectedId]="atlas.selectedId()"
        (select)="selectFromList($event)"
      >
        <div class="da-globe-stage">
          <rd-display-3d-geo-globe
            title="Destination globe (Three.js)"
            [textureUrl]="textureUrl"
            [markers]="markers()"
            [selectedId]="atlas.selectedId()"
            (markerSelect)="selectFromGlobe($event)"
          />
        </div>
      </da-geo-explorer-layout>
    }

    @if (showFooter()) {
      <div class="da-maps-footer">
        <p class="da-note">{{ attribution }}</p>
        <details class="da-globe-sources">
          <summary>Future globe texture sources</summary>
          <ul>
            @for (source of textureSources; track source.id) {
              <li>
                <strong>{{ source.label }}</strong> — {{ source.license }}. {{ source.notes }}
                @if (source.apiKeyRequired) {
                  API key required.
                }
              </li>
            }
          </ul>
        </details>
      </div>
    }
  `,
})
export class GlobeScreenComponent {
  readonly screenPart = input<GlobeScreenPart>();
  readonly embedded = input(false);
  readonly listPlacement = input<GeoExplorerListPlacement>('right');

  readonly atlas = inject(AtlasStateService);

  readonly textureUrl = DEFAULT_WORLD_EQUIRECT_URL;
  readonly attribution = DEFAULT_WORLD_EQUIRECT_ATTRIBUTION;
  readonly textureSources = GLOBE_TEXTURE_SOURCE_OPTIONS;

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

  showExplorer(): boolean {
    const part = this.screenPart();
    if (this.embedded()) {
      return part === 'explorer' || part === undefined;
    }
    return true;
  }

  showFooter(): boolean {
    const part = this.screenPart();
    if (this.embedded()) {
      return part === 'footer';
    }
    return true;
  }

  selectFromList(id: string): void {
    this.atlas.setSelectedId(id);
  }

  selectFromGlobe(id: string): void {
    if (!id) {
      return;
    }
    this.atlas.setSelectedId(id);
  }
}
