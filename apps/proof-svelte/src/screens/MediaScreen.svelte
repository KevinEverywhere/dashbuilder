<script module lang="ts">
  export const MEDIA_SOURCE = `<MediaScreen selectedId={selectedId}>
  <SelectInput label="Flat video (YouTube)" />
  <AngularMount component={YoutubeEmbed} tagName="rd-youtube-embed" videoId={…} />
  <VideoMetadataPanel items={…} />
</MediaScreen>`;
</script>

<script lang="ts">
  import { YoutubeEmbed } from '@rosettadash/angular/visual/media/youtube-embed';
  import { registerRdYoutubeEmbed } from '@rosettadash/web-components/visual/media/youtube-embed';
  import {
    EQUIRECT_VIDEO_DESTINATIONS,
    FLAT_VIDEO_DESTINATIONS,
    attributionNoticeJson,
    destinationHasFlatVideo,
    getDestinationById,
    isEquirectDestination,
    youtubeVideoAttribution,
  } from '@destination-atlas';
  import AngularMount from '../components/AngularMount.svelte';
  import BoundSelectInput from '../components/BoundSelectInput.svelte';
  import VideoMetadataPanel from '../components/VideoMetadataPanel.svelte';
  import { localizedDestinationName } from '../lib/atlas-utils';

  let {
    locale,
    selectedId,
    onSelectedIdChange,
    onOpenAuthoring,
  }: {
    locale: string;
    selectedId: string;
    onSelectedIdChange?: (id: string) => void;
    onOpenAuthoring?: (id: string) => void;
  } = $props();

  const selected = $derived(getDestinationById(selectedId));
  const flatSelected = $derived(
    selected && destinationHasFlatVideo(selected) ? selected : undefined,
  );
  const equirectSelected = $derived(
    selected && isEquirectDestination(selected) ? selected : undefined,
  );

  $effect(() => {
    if (equirectSelected) {
      onOpenAuthoring?.(equirectSelected.id);
    }
  });

  const metadataItems = $derived(
    flatSelected
      ? [
          { label: 'Destination', value: localizedDestinationName(flatSelected, locale) },
          { label: 'Source', value: 'YouTube embed (Angular host)' },
          { label: 'Projection', value: 'Flat / standard' },
          { label: 'Video id', value: flatSelected.youtubeId ?? '—' },
          { label: 'Region', value: flatSelected.region },
        ]
      : [],
  );

  const youtubeAttributionNotice = $derived(
    flatSelected?.youtubeId
      ? attributionNoticeJson(youtubeVideoAttribution(flatSelected.youtubeId))
      : '',
  );

  const youtubeInputs = $derived({
    videoId: flatSelected?.youtubeId,
    title: flatSelected
      ? `${localizedDestinationName(flatSelected, locale)} — destination video`
      : undefined,
    controls: true,
    className: 'rd-youtube-embed-host',
  });

  $effect(() => {
    registerRdYoutubeEmbed();
  });
</script>

<section class="da-panel">
  <h2>Media</h2>
  <p>
    Watch flat destination videos here. 360° destinations open in
    <strong>Authoring</strong> — autoloads the library clip when shipped; upload your own anytime.
  </p>
  <div class="rd-media-layout">
    <div class="rd-media-primary">
      <BoundSelectInput
        fieldLabel="Flat video (YouTube)"
        options={FLAT_VIDEO_DESTINATIONS.map((dest) => ({
          value: dest.id,
          label: localizedDestinationName(dest, locale),
        }))}
        value={flatSelected?.id ?? ''}
        onValueChange={(value) => onSelectedIdChange?.(value)}
      />
      {#if flatSelected?.youtubeId}
        <div class="da-interop-callout" role="note">
          <strong>Cross-framework showcase.</strong>
          This embed is <code>@rosettadash/angular</code> <code>YoutubeEmbed</code> mounted from
          Svelte via <code>AngularMount.svelte</code> onto <code>rd-youtube-embed</code>.
        </div>
        <AngularMount
          component={YoutubeEmbed}
          tagName="rd-youtube-embed"
          className="rd-youtube-embed-host"
          componentInputs={youtubeInputs}
        />
      {:else}
        <p class="da-note">Select a flat destination video to play the YouTube embed.</p>
      {/if}

      {#if EQUIRECT_VIDEO_DESTINATIONS.length > 0}
        <BoundSelectInput
          fieldLabel="360° video (Authoring)"
          options={EQUIRECT_VIDEO_DESTINATIONS.map((dest) => ({
            value: dest.id,
            label: `${localizedDestinationName(dest, locale)} · 360°`,
          }))}
          value={equirectSelected?.id ?? ''}
          onValueChange={(value) => onOpenAuthoring?.(value)}
        />
        <p class="da-note">
          Choosing a 360° destination switches to Authoring and autoloads the library clip when available.
        </p>
      {/if}
    </div>
    <div class="rd-media-tools">
      <VideoMetadataPanel items={metadataItems} />
      {#if youtubeAttributionNotice}
        <rd-attribution-notice notice={youtubeAttributionNotice}></rd-attribution-notice>
      {/if}
    </div>
  </div>
</section>
