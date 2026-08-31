import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FlexLayout } from '@rosettadash/angular/layout/flex';
import { DetailPanel } from '@rosettadash/angular/visual/detail';
import { SelectInput } from '@rosettadash/angular/visual/input/select';
import { StatusBadge } from '@rosettadash/angular/visual/plugin/status-badge';
import { DataTable } from '@rosettadash/angular/visual/table';
import { SPORTS_LEAGUES, fetchLeagueCard, type LeagueCard } from './scores';

const DASH = '—';

@Component({
  selector: 'rd-sports-scoreboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlexLayout, SelectInput, StatusBadge, DataTable, DetailPanel],
  template: `
    <rd-flex direction="column" [gap]="10" className="rd-stock-tracker">
      <rd-flex direction="row" [gap]="8" density="compact" className="rd-stock-tracker__header">
        <span class="rd-stock-tracker__title">Scoreboard</span>
        <rd-input-select
          label="League"
          [options]="leagues"
          [value]="league()"
          (valueChange)="onLeague($event)"
        />
        <rd-plugin-status-badge [statusText]="badgeText()" [tone]="badgeTone()" />
      </rd-flex>
      <rd-detail
        [title]="card()?.offseason ? 'Offseason' : 'Matchup'"
        className="rd-stock-tracker__quote"
        emptyMessage="Select a league"
      >
        <p class="rd-stock-tracker__matchup">{{ matchup() }}</p>
      </rd-detail>
      @if (card()?.offseason) {
        <section class="rd-table rd-stock-tracker__board">
          <header class="rd-table__header"><span>Desk</span></header>
          <div class="rd-table__scroll">
            <ul class="rd-stock-tracker__desk">
              @for (item of card()?.desk ?? []; track item.id) {
                <li>
                  <strong>{{ item.beat }}</strong>
                  <span>{{ item.line }}</span>
                </li>
              }
            </ul>
          </div>
        </section>
      } @else {
        <rd-table title="Today" className="rd-stock-tracker__board" [rows]="rows()" [columns]="gameColumns" />
      }
    </rd-flex>
  `,
})
export class SportsScoreboardComponent {
  readonly gameColumns = [
    { key: 'name', header: 'Matchup' },
    { key: 'status', header: 'Status' },
    { key: 'amount', header: 'Score', align: 'right' as const },
    { key: 'date', header: 'When' },
  ];
  readonly leagues = [...SPORTS_LEAGUES];
  readonly league = signal('basketball/nba');
  readonly card = signal<LeagueCard | null>(null);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  readonly rows = computed(() => (this.card()?.board.games ?? []).slice(0, 8));
  readonly matchup = computed(() => {
    const current = this.card();
    if (!current) {
      return `${DASH} · ${DASH} · ${DASH}`;
    }
    if (current.offseason) {
      return current.lede;
    }
    const game = current.board.games[0];
    if (!game) {
      return `${DASH} · ${DASH} · ${DASH}`;
    }
    return `${game.detail} · ${game.amount} · ${game.status}`;
  });
  readonly badgeText = computed(() => {
    const current = this.card();
    if (this.status() === 'loading' && !current) {
      return 'Updating';
    }
    if (this.status() === 'error' && !current) {
      return 'Unavailable';
    }
    if (current?.offseason) {
      return 'Offseason';
    }
    const count = current?.board.games.length ?? 0;
    const live = current?.board.games.some(
      (game) => game.status !== 'Final' && !game.status.includes('Scheduled'),
    );
    if (!count) {
      return 'No games';
    }
    return live ? `${count} live` : `${count} games`;
  });
  readonly badgeTone = computed(() => {
    if (this.status() === 'loading' && !this.card()) {
      return 'neutral' as const;
    }
    if (this.status() === 'error' && !this.card()) {
      return 'error' as const;
    }
    if (this.card()?.offseason) {
      return 'warning' as const;
    }
    return 'success' as const;
  });

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
    try {
      this.card.set(await fetchLeagueCard(path));
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }
}
