<script lang="ts">
export const DESTINATIONS_SOURCE = `<DestinationsScreen …>
  <FilterGrid>…</FilterGrid>
  <DataTable rows={rows} />
  <DetailPanel>…</DetailPanel>
</DestinationsScreen>`;
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { TimePreset } from '@rosettadash/vue/domain/time-preset';
import { FlexLayout } from '@rosettadash/vue/layout/flex';
import { DateRangeFilter } from '@rosettadash/vue/visual/input/date-range';
import { DetailPanel } from '@rosettadash/vue/visual/detail';
import { DataTable } from '@rosettadash/vue/visual/table';
import type { DataTableRow } from '@rosettadash/vue/visual/table/data-table';
import { MOCK_DESTINATIONS, formatVisitorCount, getDestinationById } from '@destination-atlas';
import BoundSelectInput from '../components/BoundSelectInput.vue';
import BoundTextInput from '../components/BoundTextInput.vue';
import FilterSummary from '../components/FilterSummary.vue';
import RoleGatePanel from '../components/RoleGatePanel.vue';
import type { AtlasUserRole } from '../lib/roles';
import {
  filterHistoricByPreset,
  formatRegionLabel,
  formatVisitPeriod,
  historicWindowLabel,
  localizedDestinationName,
  periodColumnLabel,
  REGION_OPTIONS,
} from '../lib/atlas-utils';

const props = defineProps<{
  locale: string;
  userRole: AtlasUserRole;
  selectedId: string;
  destSearch: string;
  destRegion: string;
  timePreset: string;
  visitPeriodStart: string;
  visitPeriodEnd: string;
}>();

const emit = defineEmits<{
  'update:selectedId': [string];
  'update:destSearch': [string];
  'update:destRegion': [string];
  'update:timePreset': [string];
  'update:visitPeriod': [{ startDate: string; endDate: string }];
  focusDestinationOnMap: [string];
}>();

const filtered = computed(() =>
  MOCK_DESTINATIONS.filter((dest) => {
    const name = localizedDestinationName(dest, props.locale).toLowerCase();
    const matchesSearch = !props.destSearch || name.includes(props.destSearch.toLowerCase());
    const matchesRegion = !props.destRegion || dest.region === props.destRegion;
    return matchesSearch && matchesRegion;
  }),
);

const periodLabel = computed(() => periodColumnLabel(props.timePreset));

const rows = computed<DataTableRow[]>(() =>
  filtered.value.map((dest) => ({
    id: dest.id,
    name: localizedDestinationName(dest, props.locale),
    status: dest.region,
    amount: formatVisitorCount(dest.visitorsCurrent),
    date: periodLabel.value,
  })),
);

const selected = computed(() => getDestinationById(props.selectedId));
const selectedHistoric = computed(() =>
  selected.value ? filterHistoricByPreset(selected.value, props.timePreset) : [],
);

const filterChips = computed(() => [
  ...(props.destSearch ? [{ label: 'Search', value: props.destSearch }] : []),
  ...(props.destRegion ? [{ label: 'Region', value: formatRegionLabel(props.destRegion) }] : []),
  { label: 'Visit period', value: formatVisitPeriod(props.visitPeriodStart, props.visitPeriodEnd) },
  { label: 'Historic window', value: historicWindowLabel(props.timePreset) },
]);

function selectDestination(id: string) {
  if (props.userRole === 'viewer') {
    return;
  }
  emit('update:selectedId', id);
}
</script>

<template>
  <section class="da-panel">
    <h2>Destinations</h2>
    <p>Browse and filter mock destination records.</p>
    <div class="da-stack">
      <RoleGatePanel
        gate-label="Destination filters"
        :current-role="userRole"
        :allowed-roles="['editor', 'admin']"
        status-text="Editor filters active"
        hidden-status-text="Filters are available to Editor and Admin roles. Viewer sees the full list."
      >
        <div class="da-stack da-stack--2">
          <div class="rd-filter-grid">
            <BoundTextInput
              field-label="Search"
              placeholder="Destination name…"
              :value="destSearch"
              @update:value="emit('update:destSearch', $event)"
            />
            <BoundSelectInput
              field-label="Region"
              placeholder="All regions"
              :options="REGION_OPTIONS"
              :value="destRegion"
              @update:value="emit('update:destRegion', $event)"
            />
            <DateRangeFilter
              label="Visit period"
              granularity="month"
              :start-date="visitPeriodStart"
              :end-date="visitPeriodEnd"
              @change="emit('update:visitPeriod', $event)"
            />
            <TimePreset
              label="Historic window"
              :presets="[
                { id: '1y', label: '1 year' },
                { id: '5y', label: '5 years' },
                { id: 'all', label: 'All' },
              ]"
              :active-preset-id="timePreset"
              @preset-change="emit('update:timePreset', $event)"
            />
          </div>
        </div>
      </RoleGatePanel>

      <FilterSummary
        :count="filtered.length"
        count-noun="destination"
        :chips="filterChips"
        :hint="`Historic window: ${historicWindowLabel(timePreset)} (${periodLabel}).`"
      />

      <FlexLayout direction="row" :gap="16" title="Browse destinations">
        <DataTable
          title="Destinations"
          :rows="rows"
          :selected-row-id="selectedId"
          @row-select="selectDestination"
        />
        <DetailPanel title="Destination detail">
          <p v-if="userRole === 'viewer'" class="da-detail-body">
            Switch to Editor or Admin to select rows and view destination details.
          </p>
          <div v-else-if="selected">
            <p class="rd-detail-card__title">{{ localizedDestinationName(selected, locale) }}</p>
            <p class="rd-detail-card__meta">{{ formatRegionLabel(selected.region) }}</p>
            <dl class="rd-detail-stats rd-detail-stats--compact">
              <div>
                <dt>Current visitors</dt>
                <dd>{{ formatVisitorCount(selected.visitorsCurrent) }} (2024)</dd>
              </div>
              <div>
                <dt>Coordinates</dt>
                <dd>{{ selected.lat.toFixed(4) }}, {{ selected.lng.toFixed(4) }}</dd>
              </div>
            </dl>
            <section class="rd-detail-historic rd-detail-historic--compact">
              <h4>Historic visitors ({{ historicWindowLabel(timePreset) }})</h4>
              <ul>
                <li v-for="row in selectedHistoric" :key="row.year">
                  <span>{{ row.year }}</span>
                  <strong>{{ formatVisitorCount(row.visitors) }}</strong>
                </li>
              </ul>
            </section>
            <p class="da-detail-actions">
              <button type="button" class="rd-button" @click="emit('focusDestinationOnMap', selected.id)">
                View on map
              </button>
            </p>
          </div>
          <p v-else class="da-detail-body">Select a destination row to view details.</p>
        </DetailPanel>
      </FlexLayout>
    </div>
  </section>
</template>
