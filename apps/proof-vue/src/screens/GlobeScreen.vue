<script lang="ts">
export const GLOBE_SOURCE = `<GlobeScreen part="explorer" locale={locale} selectedId={selectedId}>
  <GeoExplorerLayout items={…} selectedId={selectedId} />
  <ThreeGeoGlobe textureUrl markers selectedId />
</GlobeScreen>`;
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { ThreeGeoGlobe } from '@rosettadash/vue/visual/display/3d-geo-globe';
import {
  DEFAULT_WORLD_EQUIRECT_URL,
  GLOBE_TEXTURE_SOURCE_OPTIONS,
  MOCK_DESTINATIONS,
  GLOBE_EQUIRECT_ATTRIBUTION,
  THREE_JS_ATTRIBUTION,
  attributionNoticeJson,
} from '@destination-atlas';
import GeoExplorerLayout, { type GeoExplorerListPlacement } from '../components/GeoExplorerLayout.vue';
import { formatRegionLabel, localizedDestinationName } from '../lib/atlas-utils';

const props = withDefaults(
  defineProps<{
    locale: string;
    selectedId: string;
    embedded?: boolean;
    part?: 'explorer' | 'footer';
    listPlacement?: GeoExplorerListPlacement;
  }>(),
  { embedded: false, listPlacement: 'right' },
);

const emit = defineEmits<{
  'update:selectedId': [string];
  focusDestinationOnMap: [string];
}>();

const markers = computed(() =>
  MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    lat: dest.lat,
    lng: dest.lng,
    label: localizedDestinationName(dest, props.locale),
  })),
);

const listItems = computed(() =>
  MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    label: localizedDestinationName(dest, props.locale),
    meta: formatRegionLabel(dest.region),
  })),
);

function markerEventId(event: unknown): string | undefined {
  if (typeof event === 'string' && event) {
    return event;
  }
  if (!event || typeof event !== 'object') {
    return undefined;
  }
  const rec = event as { id?: unknown; detail?: { id?: unknown } };
  if (typeof rec.id === 'string' && rec.id) {
    return rec.id;
  }
  if (typeof rec.detail?.id === 'string' && rec.detail.id) {
    return rec.detail.id;
  }
  return undefined;
}

function selectFromList(id: string) {
  emit('update:selectedId', id);
}

function selectFromGlobe(event: unknown) {
  const id = markerEventId(event);
  if (!id) {
    return;
  }
  emit('update:selectedId', id);
}
</script>

<template>
  <GeoExplorerLayout
    v-if="!embedded || part === 'explorer'"
    :list-placement="listPlacement"
    :items="listItems"
    :selected-id="selectedId"
    @select="selectFromList"
  >
    <div class="da-globe-stage">
      <ThreeGeoGlobe
        class="da-globe-stage__globe"
        title="Destination globe (Three.js)"
        :texture-url="DEFAULT_WORLD_EQUIRECT_URL"
        :markers="markers"
        :selected-id="selectedId"
        @marker-select="selectFromGlobe"
      />
    </div>
  </GeoExplorerLayout>

  <div v-if="embedded && part === 'footer'" class="da-maps-footer">
    <rd-attribution-notice :notice="attributionNoticeJson(GLOBE_EQUIRECT_ATTRIBUTION)" />
    <rd-attribution-notice :notice="attributionNoticeJson(THREE_JS_ATTRIBUTION)" />
    <details class="da-globe-sources">
      <summary>Future globe texture sources</summary>
      <ul>
        <li v-for="source in GLOBE_TEXTURE_SOURCE_OPTIONS" :key="source.id">
          <strong>{{ source.label }}</strong> — {{ source.license }}. {{ source.notes }}
          <span v-if="source.apiKeyRequired"> API key required.</span>
        </li>
      </ul>
    </details>
  </div>
</template>
