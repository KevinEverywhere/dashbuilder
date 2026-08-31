import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FlexLayout } from '@rosettadash/angular/layout/flex';
import { LineChart } from '@rosettadash/angular/visual/chart/line';
import { DetailPanel } from '@rosettadash/angular/visual/detail';
import { SelectInput } from '@rosettadash/angular/visual/input/select';
import { StatusBadge } from '@rosettadash/angular/visual/plugin/status-badge';
import { DataTable } from '@rosettadash/angular/visual/table';
import {
  STOCK_SYMBOLS,
  fetchStockQuote,
  formatUsd,
  sampleQuote,
  type QuoteDay,
  type StockQuote,
} from './quotes';

const TABLE_SLOTS = 4;
const PLACEHOLDER_ROWS: QuoteDay[] = Array.from({ length: TABLE_SLOTS }, (_, index) => ({
  id: `slot-${index}`,
  name: '\u00a0',
  status: '\u00a0',
  amount: '\u00a0',
  date: '\u00a0',
}));

function signedChange(quote: StockQuote): string {
  const sign = quote.change >= 0 ? '+' : '';
  return `${sign}${quote.change.toFixed(2)} (${sign}${quote.changePercent.toFixed(2)}%)`;
}

@Component({
  selector: 'rd-stock-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlexLayout, SelectInput, StatusBadge, LineChart, DataTable, DetailPanel],
  template: `
    <rd-flex direction="column" [gap]="10" className="rd-stock-tracker">
      <rd-flex direction="row" [gap]="8" density="compact" className="rd-stock-tracker__header">
        <span class="rd-stock-tracker__title">Stock tracker</span>
        <rd-input-select
          label="Symbol"
          [options]="symbols"
          [value]="symbol()"
          (valueChange)="onSymbol($event)"
        />
        <rd-plugin-status-badge [statusText]="badgeText()" [tone]="badgeTone()" />
      </rd-flex>
      <rd-detail title="Quote" className="rd-stock-tracker__quote" emptyMessage="Select a symbol">
        <dl class="rd-detail-stats rd-detail-stats--compact">
          <div><dt>Symbol</dt><dd>{{ quote().symbol }}</dd></div>
          <div><dt>Last</dt><dd>{{ priceLabel() }}</dd></div>
          <div><dt>Previous close</dt><dd>{{ previousCloseLabel() }}</dd></div>
          <div><dt>Change</dt><dd>{{ deltaLabel() }}</dd></div>
        </dl>
      </rd-detail>
      <rd-chart-line
        [title]="quote().symbol + ' month'"
        className="rd-stock-tracker__chart"
        [points]="chartPoints()"
        xAxisLabel="Session"
        yAxisLabel="USD"
      />
      <rd-table title="Recent sessions" [rows]="rows()" [columns]="sessionColumns" />
    </rd-flex>
  `,
})
export class StockTrackerComponent {
  readonly sessionColumns = [
    { key: 'name', header: 'Session' },
    { key: 'amount', header: 'Close', align: 'right' as const },
    { key: 'status', header: 'Trend' },
    { key: 'date', header: 'Volume', align: 'right' as const },
  ];
  readonly symbols = [...STOCK_SYMBOLS];
  readonly symbol = signal('AAPL');
  readonly quote = signal<StockQuote>(sampleQuote('AAPL'));
  readonly status = signal<'loading' | 'ready'>('loading');

  readonly chartPoints = computed(() =>
    this.quote()
      .days.map((day) => ({ x: day.name, y: Number(day.amount) }))
      .filter((point) => Number.isFinite(point.y)),
  );

  readonly rows = computed(() => {
    const filled = this.quote().days.slice(0, TABLE_SLOTS);
    return filled.length >= TABLE_SLOTS
      ? filled
      : [...filled, ...PLACEHOLDER_ROWS.slice(filled.length)];
  });
  readonly priceLabel = computed(() => formatUsd(this.quote().price));
  readonly deltaLabel = computed(() => signedChange(this.quote()));
  readonly previousCloseLabel = computed(() => formatUsd(this.quote().previousClose));
  readonly badgeText = computed(() => {
    if (this.status() === 'loading') {
      return 'Updating';
    }
    if (this.quote().sample) {
      return 'Sample';
    }
    return this.quote().change >= 0 ? 'Up' : 'Down';
  });
  readonly badgeTone = computed(() => {
    if (this.status() === 'loading') {
      return 'neutral' as const;
    }
    if (this.quote().sample) {
      return 'warning' as const;
    }
    return this.quote().change >= 0 ? ('success' as const) : ('error' as const);
  });

  constructor() {
    void this.load(this.symbol());
  }

  onSymbol(value: string): void {
    if (!value || value === this.symbol()) {
      return;
    }
    this.symbol.set(value);
    this.quote.set(sampleQuote(value));
    void this.load(value);
  }

  private async load(symbol: string): Promise<void> {
    this.status.set('loading');
    try {
      this.quote.set(await fetchStockQuote(symbol));
      this.status.set('ready');
    } catch {
      this.quote.set(sampleQuote(symbol));
      this.status.set('ready');
    }
  }
}
