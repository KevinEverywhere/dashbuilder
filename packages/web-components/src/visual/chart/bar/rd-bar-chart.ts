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
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/chart/bar — visual.chart.bar */
export class RdBarChartElement extends RosettaAtomElement {
  static readonly tagName = RD_BAR_CHART_TAG;

  static get observedAttributes(): string[] {
    return ['title', 'bars'];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Bar chart');
    const barsData = this.parseJsonAttr<BarChartBar[]>('bars', []);
    const series = barsData.length
      ? barsData
      : [{ value: 40 }, { value: 65 }, { value: 55 }, { value: 80 }, { value: 48 }];
    const max = Math.max(...series.map((bar) => bar.value), 1);
    const bars = series
      .map(
        (bar) =>
          `<div class="rd-chart-bar__bar-wrap"><div class="rd-chart-bar__bar" style="height:${Math.round((bar.value / max) * 100)}%"></div></div>`,
      )
      .join('');
    return `
      <section class="rd-chart-bar" data-testid="rd-chart-bar" role="img" aria-label="${this.esc(title)}">
        <header class="rd-chart-bar__header"><span>${this.esc(title)}</span></header>
        <div class="rd-chart-bar__bars" aria-hidden="true">${bars}</div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdBarChart(): void {
  defineRosettaElement(RD_BAR_CHART_TAG, RdBarChartElement);
}
