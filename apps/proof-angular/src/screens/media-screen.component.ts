import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { YoutubeEmbed } from '@rosettadash/angular/visual/media/youtube-embed';
import {
  EQUIRECT_VIDEO_DESTINATIONS,
  FLAT_VIDEO_DESTINATIONS,
  attributionNoticeJson,
  destinationHasFlatVideo,
  getDestinationById,
  isEquirectDestination,
  youtubeVideoAttribution,
} from '@destination-atlas';
import { localizedDestinationName } from '../lib/atlas-utils';
import { AtlasStateService } from '../services/atlas-state.service';
import { DaBoundSelectInputComponent } from '../components/proof-form-fields.component';
import { VideoMetadataPanelComponent } from '../components/video-metadata-panel.component';

@Component({
  selector: 'da-media-screen',
  standalone: true,
  imports: [YoutubeEmbed, DaBoundSelectInputComponent, VideoMetadataPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="da-panel">
      <h2>Media</h2>
      <p>
        Watch flat destination videos here. 360° destinations open in
        <strong>Authoring</strong> — autoloads the library clip when shipped; upload your own anytime.
      </p>
      <div class="rd-media-layout">
        <div class="rd-media-primary">
          <da-bound-select-input
            [fieldLabel]="'Flat video (YouTube)'"
            [options]="flatOptions()"
            [value]="flatSelected()?.id ?? ''"
            (valueChange)="onFlatChange($event)"
          />
          @if (flatSelected()?.youtubeId; as videoId) {
            <rd-youtube-embed
              class="rd-youtube-embed-host"
              [videoId]="videoId"
              [title]="youtubeTitle()"
              [controls]="true"
            />
          } @else {
            <p class="da-note">Select a flat destination video to play the YouTube embed.</p>
          }

          @if (EQUIRECT_VIDEO_DESTINATIONS.length > 0) {
            <da-bound-select-input
              [fieldLabel]="'360° video (Authoring)'"
              [options]="equirectOptions()"
              [value]="equirectSelected()?.id ?? ''"
              (valueChange)="onEquirectChange($event)"
            />
            <p class="da-note">
              Choosing a 360° destination switches to Authoring and autoloads the library clip when available.
            </p>
          }
        </div>
        <div class="rd-media-tools">
          <da-video-metadata-panel [items]="metadataItems()" />
          @if (youtubeAttributionNotice(); as notice) {
            <rd-attribution-notice [attr.notice]="notice"></rd-attribution-notice>
          }
        </div>
      </div>
    </section>
  `,
})
export class MediaScreenComponent {
  readonly atlas = inject(AtlasStateService);

  readonly flatOptions = computed(() =>
    FLAT_VIDEO_DESTINATIONS.map((dest) => ({
      value: dest.id,
      label: localizedDestinationName(dest, this.atlas.locale()),
    })),
  );

  readonly equirectOptions = computed(() =>
    EQUIRECT_VIDEO_DESTINATIONS.map((dest) => ({
      value: dest.id,
      label: `${localizedDestinationName(dest, this.atlas.locale())} · 360°`,
    })),
  );

  readonly selected = computed(() => getDestinationById(this.atlas.selectedId()));

  readonly flatSelected = computed(() => {
    const selected = this.selected();
    return selected && destinationHasFlatVideo(selected) ? selected : undefined;
  });

  readonly equirectSelected = computed(() => {
    const selected = this.selected();
    return selected && isEquirectDestination(selected) ? selected : undefined;
  });

  readonly metadataItems = computed(() => {
    const flat = this.flatSelected();
    if (!flat) {
      return [];
    }
    return [
      { label: 'Destination', value: localizedDestinationName(flat, this.atlas.locale()) },
      { label: 'Source', value: 'YouTube embed' },
      { label: 'Projection', value: 'Flat / standard' },
      { label: 'Video id', value: flat.youtubeId ?? '—' },
      { label: 'Region', value: flat.region },
    ];
  });

  readonly youtubeAttributionNotice = computed(() => {
    const id = this.flatSelected()?.youtubeId;
    return id ? attributionNoticeJson(youtubeVideoAttribution(id)) : '';
  });

  readonly youtubeTitle = computed(() => {
    const flat = this.flatSelected();
    return flat ? `${localizedDestinationName(flat, this.atlas.locale())} — destination video` : '';
  });

  constructor() {
    effect(() => {
      const equirect = this.equirectSelected();
      if (equirect) {
        this.atlas.openAuthoringForDestination(equirect.id);
      }
    });
  }

  onFlatChange(destinationId: string): void {
    this.atlas.setSelectedId(destinationId);
  }

  onEquirectChange(destinationId: string): void {
    this.atlas.openAuthoringForDestination(destinationId);
  }
}
