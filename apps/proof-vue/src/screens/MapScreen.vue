<script lang="ts">
export const MAP_SOURCE = `<MapScreen part="toolbar|explorer" mapProvider={mapProvider} selectedId={selectedId}>
  <GeoMap provider={mapProvider} markers={…} />
</MapScreen>`;
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { GeoMap } from '@rosettadash/vue/visual/display/geo-map';
import { GEO_MAP_PROVIDERS, MOCK_DESTINATIONS, getDestinationById, type GeoMapProvider } from '@destination-atlas';
import GeoExplorerLayout, { type GeoExplorerListPlacement } from '../components/GeoExplorerLayout.vue';
import BoundSelectInput from '../components/BoundSelectInput.vue';
import BoundTextInput from '../components/BoundTextInput.vue';
import { useConsumerSecrets } from '../composables/use-consumer-secrets';
import { formatRegionLabel, localizedDestinationName } from '../lib/atlas-utils';
import { destinationMapView, resolveMapLocationQuery } from '../lib/map-location';

const props = withDefaults(
  defineProps<{
    locale: string;
    selectedId: string;
    mapProvider: GeoMapProvider;
    mapLocationQuery: string;
    mapViewOverride: { lat: number; lng: number; zoom: number; label: string } | null;
    embedded?: boolean;
    part?: 'toolbar' | 'explorer';
    listPlacement?: GeoExplorerListPlacement;
  }>(),
  { embedded: false, listPlacement: 'right' },
);

const emit = defineEmits<{
  'update:selectedId': [string];
  'update:mapProvider': [GeoMapProvider];
  'update:mapLocationQuery': [string];
  focusDestinationOnMap: [string];
  goToMapView: [{ lat: number; lng: number; zoom: number; label: string }];
  openSettings: [];
}>();

const secrets = useConsumerSecrets();
const locationError = ref('');

const showToolbar = computed(() => !props.embedded || props.part === 'toolbar');
const showExplorer = computed(() => !props.embedded || props.part === 'explorer');

const view = computed(() => {
  if (props.mapViewOverride) {
    return props.mapViewOverride;
  }
  const selected = getDestinationById(props.selectedId);
  return selected
    ? destinationMapView(selected, props.locale)
    : { lat: 20, lng: 0, zoom: 2, label: 'World' };
});

const centerJson = computed(() => JSON.stringify({ lat: view.value.lat, lng: view.value.lng }));

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

const activeProvider = computed(() => GEO_MAP_PROVIDERS.find((entry) => entry.id === props.mapProvider));

function submitLocation() {
  const resolved = resolveMapLocationQuery(props.mapLocationQuery, props.locale);
  if (!resolved) {
    locationError.value =
      'No match — try a dataset destination (Tokyo, Paris, New York City…) or lat, lng (40.71, -74.01).';
    return;
  }
  locationError.value = '';
  const matched = MOCK_DESTINATIONS.find(
    (dest) => localizedDestinationName(dest, props.locale).toLowerCase() === resolved.label.toLowerCase(),
  );
  if (matched) {
    emit('focusDestinationOnMap', matched.id);
    return;
  }
  emit('goToMapView', resolved);
}

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

function selectDestination(event: unknown) {
  const id = typeof event === 'string' ? event : markerEventId(event);
  if (!id) {
    return;
  }
  emit('update:selectedId', id);
}
</script>

<template>
  <div v-if="showToolbar" class="da-maps-toolbar__map-fields">
    <div class="rd-map-location">
      <BoundTextInput
        field-label="Request location"
        placeholder="Destination name or lat, lng…"
        :value="mapLocationQuery"
        @update:value="emit('update:mapLocationQuery', $event)"
      />
      <button type="button" class="rd-button" @click="submitLocation">Go to location</button>
    </div>
    <p v-if="locationError" class="da-map-location-error">{{ locationError }}</p>
    <p v-if="view.label" class="da-note da-maps-toolbar__view-label">
      Map view: <strong>{{ view.label }}</strong>
      <span v-if="mapViewOverride"> (custom coordinates)</span>
    </p>

    <BoundSelectInput
      field-label="Map provider"
      :options="GEO_MAP_PROVIDERS.map((entry) => ({ value: entry.id, label: entry.label }))"
      :value="mapProvider"
      @update:value="emit('update:mapProvider', $event as GeoMapProvider)"
    />
    <dl v-if="activeProvider" class="da-provider-meta">
      <dt>Cost</dt>
      <dd>{{ activeProvider.costSummary }}</dd>
      <dt>API key</dt>
      <dd>{{ activeProvider.apiKeyRequired ? 'Required' : 'Optional' }}</dd>
      <dt>Notes</dt>
      <dd>{{ activeProvider.notes }}</dd>
    </dl>
    <p v-if="mapProvider === 'google-maps' && !secrets.googleMapsApiKey" class="da-note da-byok-cta">
      Google Maps requires an API key.
      <button type="button" class="da-locale-link" @click="emit('openSettings')">
        Configure in Settings → Integrations
      </button>
    </p>
  </div>

  <GeoExplorerLayout
    v-if="showExplorer"
    :list-placement="listPlacement"
    :items="listItems"
    :selected-id="selectedId"
    @select="selectDestination"
  >
    <div class="da-map-stage">
      <GeoMap
        class="da-map-stage__map"
        :provider="mapProvider"
        :center="centerJson"
        :zoom="view.zoom"
        :markers="markers"
        :selected-id="selectedId"
        :api-key="mapProvider === 'google-maps' ? secrets.googleMapsApiKey : undefined"
        :tile-url="mapProvider === 'maplibre' ? secrets.maplibreTileUrl : undefined"
        @marker-select="selectDestination"
      />
    </div>
  </GeoExplorerLayout>
</template>
