import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FlexLayout } from '@rosettadash/angular/layout/flex';
import { BarChart } from '@rosettadash/angular/visual/chart/bar';
import { DetailPanel } from '@rosettadash/angular/visual/detail';
import { SelectInput } from '@rosettadash/angular/visual/input/select';
import { KpiCard } from '@rosettadash/angular/visual/kpi';
import { StatusBadge } from '@rosettadash/angular/visual/plugin/status-badge';
import { LoadingSkeleton } from '@rosettadash/angular/visual/skeleton';
import { DataTable } from '@rosettadash/angular/visual/table';
import { SPORTS_LEAGUES, fetchScoreboard, type Scoreboard } from './scores';

@Component({
  selector: 'rd-sports-scoreboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlexLayout, SelectInput, KpiCard, StatusBadge, BarChart, DataTable, DetailPanel, LoadingSkeleton],
  template: `
    <rd-flex title="Scoreboard" direction="column" [gap]="10" className="rd-stock-tracker">
      <rd-input-select
        label="League"
        [options]="leagues"
        [value]="league()"
        (valueChange)="onLeague($event)"
      />
      <rd-flex direction="row" [gap]="8">
        <rd-kpi title="Games" [value]="gameCount()" [delta]="leadGame()" />
        <rd-plugin-status-badge [statusText]="badgeText()" [tone]="badgeTone()" />
      </rd-flex>
      <rd-chart-bar title="Board" />
      @if (status() === 'loading') {
        <rd-skeleton [lines]="3" />
      } @else {
        <rd-table title="Today" [rows]="board()?.games ?? []" />
      }
      <rd-detail title="Matchup" [emptyMessage]="emptyMessage()">
        @if (board()?.games[0]; as game) {
          <p>{{ game.detail }} · {{ game.amount }} · {{ game.status }}</p>
        }
      </rd-detail>
    </rd-flex>
  `,
})
export class SportsScoreboardComponent {
  readonly leagues = [...SPORTS_LEAGUES];
  readonly league = signal('basketball/nba');
  readonly board = signal<Scoreboard | null>(null);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly errorMessage = signal('');

  readonly gameCount = computed(() =>
    this.status() === 'ready' ? String(this.board()?.games.length ?? 0) : '—',
  );
  readonly leadGame = computed(() => this.board()?.games[0]?.name);
  readonly badgeText = computed(() => {
    if (this.status() === 'loading') {
      return 'Updating';
    }
    if (this.status() === 'error') {
      return 'Unavailable';
    }
    const live = this.board()?.games.some((game) => game.status !== 'Final' && game.status !== 'Scheduled');
    return live ? 'Live' : 'Finals posted';
  });
  readonly badgeTone = computed(() => {
    if (this.status() === 'loading') {
      return 'neutral' as const;
    }
    if (this.status() === 'error') {
      return 'error' as const;
    }
    return 'success' as const;
  });
  readonly emptyMessage = computed(() =>
    this.status() === 'error' ? this.errorMessage() || 'Board unavailable' : 'Select a league',
  );

  constructor() {
    void this.load(this.league());
  }

  onLeague(value: string): void {
    if (!value || value === this.league()) {
      return;
    }
    this.league.set(value);
    void this.load(value);
  }

  private async load(path: string): Promise<void> {
    this.status.set('loading');
    this.errorMessage.set('');
    try {
      this.board.set(await fetchScoreboard(path));
      this.status.set('ready');
    } catch (error) {
      this.board.set(null);
      this.status.set('error');
      this.errorMessage.set(error instanceof Error ? error.message : 'Scoreboard request failed');
    }
  }
}
