<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FlexLayout } from '@rosettadash/vue/layout/flex';
import { DetailPanel } from '@rosettadash/vue/visual/detail';
import { GeoMap } from '@rosettadash/vue/visual/display/geo-map';
import { SelectInput } from '@rosettadash/vue/visual/input/select';
import { KpiCard } from '@rosettadash/vue/visual/kpi';
import { StatusBadge } from '@rosettadash/vue/visual/plugin/status-badge';
import { DataTable } from '@rosettadash/vue/visual/table';
import { AIRPORTS, getAirport } from './airports';
import { fetchAirportTraffic, type Aircraft, type FlightSnapshot } from './flights';
import './FlightTracker.css';

const TABLE_SLOTS = 6;
const DASH = '—';
const TRAFFIC_COLUMNS = [
  { key: 'name', header: 'Callsign' },
  { key: 'status', header: 'Origin' },
  { key: 'amount', header: 'Altitude', align: 'right' as const },
  { key: 'date', header: 'Speed', align: 'right' as const },
];
const PLACEHOLDER_ROWS = Array.from({ length: TABLE_SLOTS }, (_, index) => ({
  id: `slot-${index}`,
  name: '\u00a0',
  status: '\u00a0',
  amount: '\u00a0',
  date: '\u00a0',
}));

const props = withDefaults(
  defineProps<{
    defaultAirportId?: string;
  }>(),
  { defaultAirportId: 'jfk' },
);

const airportId = ref(getAirport(props.defaultAirportId) ? props.defaultAirportId : 'jfk');
const snapshot = ref<FlightSnapshot | null>(null);
const selectedId = ref('');
const status = ref<'loading' | 'ready' | 'error'>('loading');
const errorMessage = ref('');

const airport = computed(() => getAirport(airportId.value) ?? AIRPORTS[0]);
const selectOptions = AIRPORTS.map((entry) => ({ value: entry.id, label: entry.label }));
const aircraft = computed(() => snapshot.value?.aircraft ?? []);
const selected = computed<Aircraft | undefined>(
  () => aircraft.value.find((plane) => plane.id === selectedId.value) ?? aircraft.value[0],
);
const airborneCount = computed(() => aircraft.value.filter((plane) => !plane.onGround).length);
const rows = computed(() => {
  const filled = aircraft.value.slice(0, TABLE_SLOTS).map((plane) => ({
    id: plane.id,
    name: plane.callsign,
    status: plane.country,
    amount: `${plane.altitudeFt.toLocaleString('en-US')} ft`,
    date: `${plane.speedKts} kts`,
  }));
  return filled.length >= TABLE_SLOTS
    ? filled
    : [...filled, ...PLACEHOLDER_ROWS.slice(filled.length)];
});
const markers = computed(() =>
  aircraft.value.map((plane) => ({
    id: plane.id,
    lat: plane.lat,
    lng: plane.lng,
    label: plane.callsign,
  })),
);
const mapCenter = computed(() => {
  const focus = selected.value ?? airport.value;
  return JSON.stringify({ lat: focus.lat, lng: focus.lng });
});

const badgeText = computed(() => {
  if (status.value === 'loading') {
    return 'Scanning';
  }
  if (status.value === 'error') {
    return 'Unavailable';
  }
  return snapshot.value?.sample ? 'Sample traffic' : 'Live OpenSky';
});

const badgeTone = computed(() => {
  if (status.value === 'loading') {
    return 'neutral' as const;
  }
  if (status.value === 'error') {
    return 'error' as const;
  }
  return snapshot.value?.sample ? ('warning' as const) : ('success' as const);
});

const emptyMessage = computed(() =>
  status.value === 'error' ? errorMessage.value || 'Traffic unavailable' : 'Select an aircraft',
);

function onAirport(value: string): void {
  if (value) {
    airportId.value = value;
  }
}

function onSelect(id: string): void {
  if (id && aircraft.value.some((plane) => plane.id === id)) {
    selectedId.value = id;
  }
}

function onMarkerSelect(detail: { id: string }): void {
  onSelect(detail.id);
}

watch(
  airportId,
  (id, _previous, onCleanup) => {
    const current = getAirport(id) ?? AIRPORTS[0];
    if (!current) {
      status.value = 'error';
      errorMessage.value = 'No airports available';
      return;
    }
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    status.value = 'loading';
    errorMessage.value = '';
    fetchAirportTraffic(current, controller.signal)
      .then((next) => {
        snapshot.value = next;
        selectedId.value = next.aircraft[0]?.id ?? '';
        status.value = 'ready';
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        status.value = 'error';
        errorMessage.value = error instanceof Error ? error.message : 'Traffic request failed';
      });
  },
  { immediate: true },
);
</script>

<template>
  <FlexLayout title="Flight tracker" direction="column" :gap="10" class="rd-flight-tracker">
    <SelectInput label="Airport" :options="selectOptions" :value="airportId" @change="onAirport" />
    <GeoMap
      class="rd-flight-tracker__map"
      provider="leaflet"
      :center="mapCenter"
      :zoom="9"
      :markers="markers"
      :selected-id="selected?.id"
      @marker-select="onMarkerSelect"
    />
    <FlexLayout direction="row" :gap="8">
      <KpiCard
        :title="airport ? `${airport.id.toUpperCase()} airborne` : 'Airborne'"
        :value="snapshot ? airborneCount : DASH"
        :delta="selected ? selected.callsign : DASH"
      />
      <StatusBadge :status-text="badgeText" :tone="badgeTone" />
    </FlexLayout>
    <DataTable
      title="Nearby traffic"
      :rows="rows"
      :columns="TRAFFIC_COLUMNS"
      :selected-row-id="selected?.id"
      :on-row-select="aircraft.length ? onSelect : undefined"
    />
    <DetailPanel class="rd-flight-tracker__aircraft" title="Aircraft" :empty-message="emptyMessage">
      <dl class="rd-detail-stats rd-detail-stats--compact">
        <div>
          <dt>Callsign</dt>
          <dd>{{ selected?.callsign ?? DASH }}</dd>
        </div>
        <div>
          <dt>Country</dt>
          <dd>{{ selected?.country ?? DASH }}</dd>
        </div>
        <div>
          <dt>Altitude</dt>
          <dd>{{ selected ? `${selected.altitudeFt.toLocaleString('en-US')} ft` : DASH }}</dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>{{ selected ? `${selected.speedKts} kts` : DASH }}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{{ selected ? (selected.onGround ? 'On ground' : 'Airborne') : DASH }}</dd>
        </div>
      </dl>
    </DetailPanel>
  </FlexLayout>
</template>
