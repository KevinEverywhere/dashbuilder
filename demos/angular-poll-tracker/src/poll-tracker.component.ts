import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FlexLayout } from '@rosettadash/angular/layout/flex';
import { BarChart } from '@rosettadash/angular/visual/chart/bar';
import { PieChart } from '@rosettadash/angular/visual/chart/pie';
import { DetailPanel } from '@rosettadash/angular/visual/detail';
import { SelectInput } from '@rosettadash/angular/visual/input/select';
import { KpiCard } from '@rosettadash/angular/visual/kpi';
import { StatusBadge } from '@rosettadash/angular/visual/plugin/status-badge';
import { DataTable } from '@rosettadash/angular/visual/table';
import { POLL_RACES, getPollRace, raceLead } from './races';

@Component({
  selector: 'rd-poll-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlexLayout, SelectInput, KpiCard, StatusBadge, BarChart, PieChart, DataTable, DetailPanel],
  template: `
    <rd-flex title="Poll tracker" direction="column" [gap]="10" className="rd-stock-tracker">
      <rd-input-select
        label="Race"
        [options]="options"
        [value]="raceId()"
        (valueChange)="onRace($event)"
      />
      <rd-flex direction="row" [gap]="8">
        <rd-kpi [title]="race()?.field ?? 'Lead'" [value]="lead()" [delta]="race()?.sample" />
        <rd-plugin-status-badge [statusText]="badgeText()" [tone]="badgeTone()" />
      </rd-flex>
      <rd-chart-bar [title]="race()?.label ?? 'Share'" />
      <rd-chart-pie title="Ballot share" />
      <rd-table title="Latest poll" [rows]="race()?.candidates ?? []" />
      <rd-detail title="Poll" emptyMessage="Select a race">
        @if (race(); as current) {
          <p>{{ current.pollster }} · {{ current.sample }} · MoE {{ current.moe }}</p>
        }
      </rd-detail>
    </rd-flex>
  `,
})
export class PollTrackerComponent {
  readonly options = POLL_RACES.map((race) => ({ value: race.id, label: race.label }));
  readonly raceId = signal(POLL_RACES[0].id);
  readonly race = computed(() => getPollRace(this.raceId()));
  readonly lead = computed(() => {
    const current = this.race();
    return current ? raceLead(current) : '—';
  });
  readonly badgeText = computed(() => {
    const lead = this.lead();
    return lead === 'Tie' ? 'Inside the margin' : 'Leads';
  });
  readonly badgeTone = computed(() => (this.lead() === 'Tie' ? ('warning' as const) : ('success' as const)));

  onRace(value: string): void {
    if (value && getPollRace(value)) {
      this.raceId.set(value);
    }
  }
}
