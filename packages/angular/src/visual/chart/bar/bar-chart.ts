import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarChartBar {
  label: string;
  value: number;
}

export interface BarChartProps {
  title?: string;
  bars?: BarChartBar[];
  yAxisLabel?: string;
  valueFormat?: (value: number) => string;
  className?: string;
}

const FALLBACK_BARS: BarChartBar[] = [
  { label: 'A', value: 40 },
  { label: 'B', value: 65 },
  { label: 'C', value: 55 },
  { label: 'D', value: 80 },
  { label: 'E', value: 48 },
];

function defaultFormat(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return String(Math.round(value));
}

function buildTicks(max: number, count = 4): number[] {
  if (max <= 0) {
    return [0];
  }
  const step = max / (count - 1);
  return Array.from({ length: count }, (_, index) => step * index);
}

/** @rosettadash/angular/visual/chart/bar — visual.chart.bar */
@Component({
  selector: 'rd-chart-bar',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      [attr.data-testid]="'rd-chart-bar'"
      [ngClass]="rootClass()"
      role="img"
      [attr.aria-label]="title() ?? 'Bar chart'"
    >
      <header class="rd-chart-bar__header"><span>{{ title() ?? 'Bar chart' }}</span></header>
      <div class="rd-chart-bar__body">
        <div class="rd-chart-bar__y-axis" aria-hidden="true">
          <div class="rd-chart-bar__y-ticks">
            @for (tick of model().ticksReversed; track tick) {
              <span class="rd-chart-bar__y-tick">{{ model().format(tick) }}</span>
            }
          </div>
          @if (yAxisLabel()) {
            <span class="rd-chart-bar__y-label">{{ yAxisLabel() }}</span>
          }
        </div>
        <div class="rd-chart-bar__plot">
          <div class="rd-chart-bar__grid-lines" aria-hidden="true">
            @for (tick of model().ticks; track tick) {
              <span
                class="rd-chart-bar__grid-line"
                [style.bottom.%]="(tick / model().maxValue) * 100"
              ></span>
            }
          </div>
          <div class="rd-chart-bar__bars">
            @for (bar of model().bars; track bar.label) {
              <div class="rd-chart-bar__bar-group">
                <div class="rd-chart-bar__bar-wrap">
                  <div
                    class="rd-chart-bar__bar"
                    [style.height.%]="(bar.value / model().maxValue) * 100"
                    [attr.title]="bar.label + ': ' + model().format(bar.value)"
                  ></div>
                </div>
                <span class="rd-chart-bar__x-label">{{ bar.label }}</span>
                <span class="rd-chart-bar__value">{{ model().format(bar.value) }}</span>
              </div>
            }
          </div>
        </div>
      </div>
      <ng-content />
    </section>
  `,
})
export class BarChart {
  readonly className = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly bars = input<BarChartBar[] | undefined>(undefined);
  readonly yAxisLabel = input<string | undefined>(undefined);
  readonly valueFormat = input<((value: number) => string) | undefined>(undefined);

  readonly rootClass = computed(() =>
    ['rd-chart-bar', this.className()].filter(Boolean).join(' '),
  );

  readonly model = computed(() => {
    const bars = this.bars()?.length ? this.bars()! : FALLBACK_BARS;
    const format = this.valueFormat() ?? defaultFormat;
    const maxValue = Math.max(...bars.map((bar) => bar.value), 1);
    const ticks = buildTicks(maxValue);
    return {
      bars,
      format,
      maxValue,
      ticks,
      ticksReversed: [...ticks].reverse(),
    };
  });
}
