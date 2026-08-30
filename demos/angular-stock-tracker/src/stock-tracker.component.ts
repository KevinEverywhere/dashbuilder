import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FlexLayout } from '@rosettadash/angular/layout/flex';
import { LineChart } from '@rosettadash/angular/visual/chart/line';
import { DetailPanel } from '@rosettadash/angular/visual/detail';
import { SelectInput } from '@rosettadash/angular/visual/input/select';
import { KpiCard } from '@rosettadash/angular/visual/kpi';
import { StatusBadge } from '@rosettadash/angular/visual/plugin/status-badge';
import { LoadingSkeleton } from '@rosettadash/angular/visual/skeleton';
import { DataTable } from '@rosettadash/angular/visual/table';
import { STOCK_SYMBOLS, fetchStockQuote, formatUsd, type StockQuote } from './quotes';

@Component({
  selector: 'rd-stock-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlexLayout, SelectInput, KpiCard, StatusBadge, LineChart, DataTable, DetailPanel, LoadingSkeleton],
  template: `
    <rd-flex title="Stock tracker" direction="column" [gap]="10" className="rd-stock-tracker">
      <rd-input-select
        label="Symbol"
        [options]="symbols"
        [value]="symbol()"
        (valueChange)="onSymbol($event)"
      />
      <rd-flex direction="row" [gap]="8">
        <rd-kpi
          [title]="symbol() + ' last'"
          [value]="priceLabel()"
          [delta]="deltaLabel()"
        />
        <rd-plugin-status-badge [statusText]="badgeText()" [tone]="badgeTone()" />
      </rd-flex>
      <rd-chart-line [title]="symbol() + ' month'" />
      @if (status() === 'loading') {
        <rd-skeleton [lines]="3" />
      } @else {
        <rd-table title="Recent sessions" [rows]="rows()" />
      }
      <rd-detail title="Quote" [emptyMessage]="emptyMessage()">
        @if (quote(); as current) {
          <dl class="rd-detail-stats">
            <div><dt>Symbol</dt><dd>{{ current.symbol }}</dd></div>
            <div><dt>Previous close</dt><dd>{{ formatUsd(current.previousClose) }}</dd></div>
            <div><dt>Change</dt><dd>{{ deltaLabel() }}</dd></div>
          </dl>
        }
      </rd-detail>
    </rd-flex>
  `,
})
export class StockTrackerComponent {
  readonly symbols = [...STOCK_SYMBOLS];
  readonly symbol = signal('AAPL');
  readonly quote = signal<StockQuote | null>(null);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly errorMessage = signal('');

  readonly rows = computed(() => this.quote()?.days ?? []);
  readonly priceLabel = computed(() => {
    const quote = this.quote();
    return this.status() === 'ready' && quote ? formatUsd(quote.price) : '—';
  });
  readonly deltaLabel = computed(() => {
    const quote = this.quote();
    if (this.status() !== 'ready' || !quote) {
      return undefined;
    }
    const sign = quote.change >= 0 ? '+' : '';
    return `${sign}${quote.change.toFixed(2)} (${sign}${quote.changePercent.toFixed(2)}%)`;
  });
  readonly badgeText = computed(() => {
    if (this.status() === 'loading') {
      return 'Updating';
    }
    if (this.status() === 'error') {
      return 'Unavailable';
    }
    const quote = this.quote();
    return quote && quote.change >= 0 ? 'Up' : 'Down';
  });
  readonly badgeTone = computed(() => {
    if (this.status() === 'loading') {
      return 'neutral' as const;
    }
    if (this.status() === 'error') {
      return 'error' as const;
    }
    return (this.quote()?.change ?? 0) >= 0 ? ('success' as const) : ('error' as const);
  });
  readonly emptyMessage = computed(() =>
    this.status() === 'error' ? this.errorMessage() || 'Quote unavailable' : 'Select a symbol',
  );

  constructor() {
    void this.load(this.symbol());
  }

  onSymbol(value: string): void {
    if (!value || value === this.symbol()) {
      return;
    }
    this.symbol.set(value);
    void this.load(value);
  }

  private async load(symbol: string): Promise<void> {
    this.status.set('loading');
    this.errorMessage.set('');
    try {
      this.quote.set(await fetchStockQuote(symbol));
      this.status.set('ready');
    } catch (error) {
      this.quote.set(null);
      this.status.set('error');
      this.errorMessage.set(error instanceof Error ? error.message : 'Quote request failed');
    }
  }

  protected readonly formatUsd = formatUsd;
}
