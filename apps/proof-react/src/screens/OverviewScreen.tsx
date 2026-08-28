import { BarChart } from '@rosettadash/react/visual/chart/bar';
import { LineChart } from '@rosettadash/react/visual/chart/line';
import { GridLayout } from '@rosettadash/react/layout/grid';
import { ScrollRegion } from '@rosettadash/react/layout/scroll-region';
import { RoleGate } from '@rosettadash/react/domain/role-gate';
import { KpiCard } from '@rosettadash/react/visual/kpi';
import { MetricChip } from '@rosettadash/react/visual/plugin/metric-chip';
import { StatusBadge } from '@rosettadash/react/visual/plugin/status-badge';
import { MOCK_DESTINATIONS, formatVisitorCount } from '@destination-atlas';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import {
  aggregateVisitorTrend,
  computeVisitorDelta,
  destinationBarSeries,
  localizedDestinationName,
} from '../lib/atlas-utils';

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

type Props = Pick<AtlasContext, 'locale' | 'userRole'>;

export function OverviewScreen({ locale, userRole }: Props) {
  const trend = aggregateVisitorTrend();
  const bars = destinationBarSeries(locale, localizedDestinationName);

  return (
    <section className="da-panel">
      <h2>Overview</h2>
      <p>Current visitor KPIs and historic trends across 30 sample destinations (10-year guesstimates).</p>
      <div className="da-stack">
        <ScrollRegion title="Destination KPIs" maxHeight="22rem">
          <GridLayout columns={3} gap={12}>
            {MOCK_DESTINATIONS.map((dest) => (
              <KpiCard
                key={dest.id}
                title={localizedDestinationName(dest, locale)}
                value={formatVisitorCount(dest.visitorsCurrent)}
                delta={computeVisitorDelta(dest)}
                format="number"
              />
            ))}
          </GridLayout>
        </ScrollRegion>
        <div className="da-stack da-stack--2">
          <LineChart
            title="Visitors over time (aggregate trend)"
            points={trend}
            xAxisLabel="Year"
            yAxisLabel="Total visitors"
            valueFormat={formatVisitorCount}
          />
          <BarChart
            title="2024 visitors by destination"
            bars={bars}
            yAxisLabel="Visitors"
            valueFormat={formatVisitorCount}
          />
        </div>
        <RoleGate
          label="Operations metrics"
          currentRole={userRole}
          allowedRoles={['admin']}
          statusText="Admin operations panel"
          hiddenStatusText="Operations metrics are hidden for Viewer and Editor roles."
        >
          <div className="da-stack da-stack--2 da-stack--metrics">
            <MetricChip chipLabel="Avg. stay" chipValue="4.2 nights" />
            <StatusBadge statusText="Data freshness: current" tone="success" />
          </div>
        </RoleGate>
      </div>
    </section>
  );
}
