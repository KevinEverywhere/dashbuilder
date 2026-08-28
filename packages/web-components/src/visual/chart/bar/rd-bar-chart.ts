import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_BAR_CHART_TAG = 'rd-bar-chart';

export interface BarChartBar {
  label?: string;
  value: number;
}

export interface BarChartProps {
  title?: string;
  bars?: BarChartBar[];
  yAxisLabel?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

const FALLBACK_BARS: BarChartBar[] = [
  { label: 'A', value: 40 },
  { label: 'B', value: 65 },
  { label: 'C', value: 55 },
  { label: 'D', value: 80 },
  { label: 'E', value: 48 },
];

function formatChartValue(value: number): string {
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

/** @rosettadash/web-components/visual/chart/bar — visual.chart.bar */
export class RdBarChartElement extends RosettaAtomElement {
  static readonly tagName = RD_BAR_CHART_TAG;

  static get observedAttributes(): string[] {
    return ['title', 'bars', 'y-axis-label'];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Bar chart');
    const yAxisLabel = this.readAttr('y-axis-label');
    const parsed = this.parseJsonAttr<BarChartBar[]>('bars', []);
    const series = parsed.length ? parsed : FALLBACK_BARS;
    const maxValue = Math.max(...series.map((bar) => bar.value), 1);
    const ticks = buildTicks(maxValue);
    const yTicks = [...ticks]
      .reverse()
      .map((tick) => `<span class="rd-chart-bar__y-tick">${this.esc(formatChartValue(tick))}</span>`)
      .join('');
    const grid = ticks
      .map(
        (tick) =>
          `<span class="rd-chart-bar__grid-line" style="bottom:${(tick / maxValue) * 100}%"></span>`,
      )
      .join('');
    const bars = series
      .map((bar) => {
        const label = bar.label ?? '';
        const heightPct = (bar.value / maxValue) * 100;
        const formatted = formatChartValue(bar.value);
        return `
          <div class="rd-chart-bar__bar-group">
            <div class="rd-chart-bar__bar-wrap">
              <div class="rd-chart-bar__bar" style="height:${heightPct}%" title="${this.esc(`${label}: ${formatted}`)}"></div>
            </div>
            <span class="rd-chart-bar__x-label">${this.esc(label)}</span>
            <span class="rd-chart-bar__value">${this.esc(formatted)}</span>
          </div>`;
      })
      .join('');
    const yLabel = yAxisLabel ? `<span class="rd-chart-bar__y-label">${this.esc(yAxisLabel)}</span>` : '';

    return `
      <section class="rd-chart-bar" data-testid="rd-chart-bar" role="img" aria-label="${this.esc(title)}">
        <header class="rd-chart-bar__header"><span>${this.esc(title)}</span></header>
        <div class="rd-chart-bar__body">
          <div class="rd-chart-bar__y-axis" aria-hidden="true">
            <div class="rd-chart-bar__y-ticks">${yTicks}</div>
            ${yLabel}
          </div>
          <div class="rd-chart-bar__plot">
            <div class="rd-chart-bar__grid-lines" aria-hidden="true">${grid}</div>
            <div class="rd-chart-bar__bars">${bars}</div>
          </div>
        </div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdBarChart(): void {
  defineRosettaElement(RD_BAR_CHART_TAG, RdBarChartElement);
}
