import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GridLayout } from '@rosettadash/angular/layout/grid';
import { ScrollRegion } from '@rosettadash/angular/layout/scroll-region';
import { KpiCard } from '@rosettadash/angular/visual/kpi';
import { LineChart } from '@rosettadash/angular/visual/chart/line';
import { BarChart } from '@rosettadash/angular/visual/chart/bar';
import { RoleGate } from '@rosettadash/angular/domain/role-gate';
import { MetricChip } from '@rosettadash/angular/visual/plugin/metric-chip';
import { StatusBadge } from '@rosettadash/angular/visual/plugin/status-badge';
import { MOCK_DESTINATIONS, formatVisitorCount } from '@destination-atlas';
import type { AtlasUserRole } from '../lib/roles';
import { computeVisitorDelta, localizedDestinationName } from '../lib/atlas-utils';

@Component({
  selector: 'da-overview-screen',
  standalone: true,
  imports: [GridLayout, ScrollRegion, KpiCard, LineChart, BarChart, RoleGate, MetricChip, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="da-panel">
      <h2>Overview</h2>
      <p>Current visitor KPIs and historic trends across 30 sample destinations (10-year guesstimates).</p>
      <div class="da-stack">
        <rd-scroll-region title="Destination KPIs" maxHeight="22rem">
          <rd-grid [columns]="3" [gap]="12">
            @for (dest of destinations; track dest.id) {
              <rd-kpi
                [title]="destTitle(dest)"
                [value]="formatCount(dest.visitorsCurrent)"
                [delta]="visitorDelta(dest)"
                format="number"
              />
            }
          </rd-grid>
        </rd-scroll-region>
        <div class="da-stack da-stack--2">
          <rd-chart-line title="Visitors over time (aggregate trend)" />
          <rd-chart-bar title="2024 visitors by destination" />
        </div>
        <rd-role-gate
          label="Operations metrics"
          [allowedRoles]="['admin']"
          statusText="Admin operations panel"
        >
          <div class="da-stack da-stack--2 da-stack--metrics">
            <rd-plugin-metric-chip chipLabel="Avg. stay" chipValue="4.2 nights" />
            <rd-plugin-status-badge statusText="Data freshness: current" tone="success" />
          </div>
        </rd-role-gate>
      </div>
    </section>
  `,
})
export class OverviewScreenComponent {
  readonly locale = input.required<string>();
  readonly userRole = input.required<AtlasUserRole>();

  readonly destinations = MOCK_DESTINATIONS;
  readonly formatCount = formatVisitorCount;

  destTitle(dest: (typeof MOCK_DESTINATIONS)[number]): string {
    return localizedDestinationName(dest, this.locale());
  }

  visitorDelta(dest: (typeof MOCK_DESTINATIONS)[number]): string {
    return computeVisitorDelta(dest);
  }
}
