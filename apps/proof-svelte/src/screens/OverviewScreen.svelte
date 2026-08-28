<script module lang="ts">
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

<script lang="ts">
  import BarChart from '@rosettadash/svelte/visual/chart/bar';
  import LineChart from '@rosettadash/svelte/visual/chart/line';
  import GridLayout from '@rosettadash/svelte/layout/grid';
  import ScrollRegion from '@rosettadash/svelte/layout/scroll-region';
  import KpiCard from '@rosettadash/svelte/visual/kpi';
  import MetricChip from '@rosettadash/svelte/visual/plugin/metric-chip';
  import StatusBadge from '@rosettadash/svelte/visual/plugin/status-badge';
  import RoleGatePanel from '../components/RoleGatePanel.svelte';
  import { MOCK_DESTINATIONS, formatVisitorCount } from '@destination-atlas';
  import type { AtlasUserRole } from '../lib/roles';
  import {
    aggregateVisitorTrend,
    computeVisitorDelta,
    destinationBarSeries,
    localizedDestinationName,
  } from '../lib/atlas-utils';

  let { locale, userRole }: { locale: string; userRole: AtlasUserRole } = $props();

  const trend = aggregateVisitorTrend();
  const bars = $derived(destinationBarSeries(locale, localizedDestinationName));
</script>

<section class="da-panel">
  <h2>Overview</h2>
  <p>Current visitor KPIs and historic trends across 30 sample destinations (10-year guesstimates).</p>
  <div class="da-stack">
    <ScrollRegion title="Destination KPIs" maxHeight="22rem">
      <GridLayout columns={3} gap={12}>
        {#each MOCK_DESTINATIONS as dest (dest.id)}
          <KpiCard
            title={localizedDestinationName(dest, locale)}
            value={formatVisitorCount(dest.visitorsCurrent)}
            delta={computeVisitorDelta(dest)}
            format="number"
          />
        {/each}
      </GridLayout>
    </ScrollRegion>
    <div class="da-stack da-stack--2">
      <LineChart
        title="Visitors over time (aggregate trend)"
        points={trend}
        xAxisLabel="Year"
        yAxisLabel="Total visitors"
        valueFormat={formatVisitorCount}
      />
      <BarChart
        title="2024 visitors by destination"
        {bars}
        yAxisLabel="Visitors"
        valueFormat={formatVisitorCount}
      />
    </div>
    <RoleGatePanel
      gateLabel="Operations metrics"
      currentRole={userRole}
      allowedRoles={['admin']}
      statusText="Admin operations panel"
      hiddenStatusText="Operations metrics are hidden for Viewer and Editor roles."
    >
      <div class="da-stack da-stack--2 da-stack--metrics">
        <MetricChip chipLabel="Avg. stay" chipValue="4.2 nights" />
        <StatusBadge statusText="Data freshness: current" tone="success" />
      </div>
    </RoleGatePanel>
  </div>
</section>
