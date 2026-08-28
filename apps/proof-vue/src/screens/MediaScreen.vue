<script lang="ts">
export const MEDIA_SOURCE = `<MediaScreen selectedId={selectedId}>
  <SelectInput label="Flat video (YouTube)" />
  <SelectInput label="360° video (Authoring)" />
  <YoutubeEmbed videoId={…} controls />
  <VideoMetadataPanel items={…} />
</MediaScreen>`;
</script>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { YoutubeEmbed } from '@rosettadash/vue/visual/media/youtube-embed';
import {
  EQUIRECT_VIDEO_DESTINATIONS,
  FLAT_VIDEO_DESTINATIONS,
  destinationHasFlatVideo,
  getDestinationById,
  isEquirectDestination,
} from '@destination-atlas';
import BoundSelectInput from '../components/BoundSelectInput.vue';
import VideoMetadataPanel from '../components/VideoMetadataPanel.vue';
import { localizedDestinationName } from '../lib/atlas-utils';

const props = defineProps<{ locale: string; selectedId: string }>();
const emit = defineEmits<{
  'update:selectedId': [string];
  openAuthoring: [string];
}>();

const selected = computed(() => getDestinationById(props.selectedId));
const flatSelected = computed(() => {
  const dest = selected.value;
  return dest && destinationHasFlatVideo(dest) ? dest : undefined;
});
const equirectSelected = computed(() => {
  const dest = selected.value;
  return dest && isEquirectDestination(dest) ? dest : undefined;
});

watch(equirectSelected, (dest) => {
  if (dest) {
    emit('openAuthoring', dest.id);
  }
});

const metadataItems = computed(() =>
  flatSelected.value
    ? [
        { label: 'Destination', value: localizedDestinationName(flatSelected.value, props.locale) },
        { label: 'Source', value: 'YouTube embed' },
        { label: 'Projection', value: 'Flat / standard' },
        { label: 'Video id', value: flatSelected.value.youtubeId ?? '—' },
        { label: 'Region', value: flatSelected.value.region },
      ]
    : [],
);
</script>

<template>
  <section class="da-panel">
    <h2>Media</h2>
    <p>
      Watch flat destination videos here. 360° equirectangular locations open in
      <strong>Authoring</strong> — upload your source and frame the export there.
    </p>
    <div class="rd-media-layout">
      <div class="rd-media-primary">
        <BoundSelectInput
          field-label="Flat video (YouTube)"
          :options="
            FLAT_VIDEO_DESTINATIONS.map((dest) => ({
              value: dest.id,
              label: localizedDestinationName(dest, locale),
            }))
          "
          :value="flatSelected?.id ?? ''"
          @update:value="emit('update:selectedId', $event)"
        />
        <YoutubeEmbed
          v-if="flatSelected?.youtubeId"
          class="rd-youtube-embed-host"
          :video-id="flatSelected.youtubeId"
          :title="`${localizedDestinationName(flatSelected, locale)} — destination video`"
          controls
        />
        <p v-else class="da-note">Select a flat destination video to play the YouTube embed.</p>

        <template v-if="EQUIRECT_VIDEO_DESTINATIONS.length > 0">
          <BoundSelectInput
            field-label="360° video (Authoring)"
            :options="
              EQUIRECT_VIDEO_DESTINATIONS.map((dest) => ({
                value: dest.id,
                label: `${localizedDestinationName(dest, locale)} · 360°`,
              }))
            "
            :value="equirectSelected?.id ?? ''"
            @update:value="emit('openAuthoring', $event)"
          />
          <p class="da-note">
            Choosing a 360° destination switches to the Authoring tab to upload and frame your equirect source.
          </p>
        </template>
        <p v-else class="da-note">
          Open <strong>Authoring</strong> to upload your own 360° or flat source. Nothing ships in
          the destination library.
        </p>
      </div>
      <div class="rd-media-tools">
        <VideoMetadataPanel :items="metadataItems" />
      </div>
    </div>
  </section>
</template>
