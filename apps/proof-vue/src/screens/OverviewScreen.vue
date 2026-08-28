<script lang="ts">
export const OVERVIEW_SOURCE = `<OverviewScreen locale={locale} userRole={userRole}>
  <GridLayout columns={3} gap={12} title="Destination KPIs">
    {MOCK_DESTINATIONS.map((dest) => (
      <KpiCard title={...} value={...} delta={...} />
    ))}
  </GridLayout>
  <LineChart points={aggregateVisitorTrend()} xAxisLabel="Year" yAxisLabel="Total visitors" />
  <BarChart bars={destinationBarSeries(locale)} yAxisLabel="Visitors" />
  <RoleGate currentRole={userRole} allowedRoles={['admin']} label="Operations metrics">
    <MetricChip chipLabel="Avg. stay" chipValue="4.2 nights" />
    <StatusBadge statusText="Data freshness: current" tone="success" />
  </RoleGate>
</OverviewScreen>`;
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { BarChart } from '@rosettadash/vue/visual/chart/bar';
import { LineChart } from '@rosettadash/vue/visual/chart/line';
import { GridLayout } from '@rosettadash/vue/layout/grid';
import { RoleGate } from '@rosettadash/vue/domain/role-gate';
import { KpiCard } from '@rosettadash/vue/visual/kpi';
import { MetricChip } from '@rosettadash/vue/visual/plugin/metric-chip';
import { StatusBadge } from '@rosettadash/vue/visual/plugin/status-badge';
import { MOCK_DESTINATIONS, formatVisitorCount } from '@destination-atlas';
import type { AtlasUserRole } from '../lib/roles';
import {
  aggregateVisitorTrend,
  computeVisitorDelta,
  destinationBarSeries,
  localizedDestinationName,
} from '../lib/atlas-utils';

const props = defineProps<{ locale: string; userRole: AtlasUserRole }>();

const trend = aggregateVisitorTrend();
const bars = computed(() => destinationBarSeries(props.locale, localizedDestinationName));
</script>

<template>
  <section class="da-panel">
    <h2>Overview</h2>
    <p>Current visitor KPIs and historic trends across sample destinations.</p>
    <div class="da-stack">
      <GridLayout :columns="3" :gap="12" title="Destination KPIs">
        <KpiCard
          v-for="dest in MOCK_DESTINATIONS"
          :key="dest.id"
          :title="localizedDestinationName(dest, locale)"
          :value="formatVisitorCount(dest.visitorsCurrent)"
          :delta="computeVisitorDelta(dest)"
          format="number"
        />
      </GridLayout>
      <div class="da-stack da-stack--2">
        <LineChart
          title="Visitors over time (aggregate trend)"
          :points="trend"
          x-axis-label="Year"
          y-axis-label="Total visitors"
          :value-format="formatVisitorCount"
        />
        <BarChart
          title="2024 visitors by destination"
          :bars="bars"
          y-axis-label="Visitors"
          :value-format="formatVisitorCount"
        />
      </div>
      <RoleGate
        label="Operations metrics"
        :current-role="userRole"
        :allowed-roles="['admin']"
        status-text="Admin operations panel"
        hidden-status-text="Operations metrics are hidden for Viewer and Editor roles."
      >
        <div class="da-stack da-stack--2 da-stack--metrics">
          <MetricChip chip-label="Avg. stay" chip-value="4.2 nights" />
          <StatusBadge status-text="Data freshness: current" tone="success" />
        </div>
      </RoleGate>
    </div>
  </section>
</template>
