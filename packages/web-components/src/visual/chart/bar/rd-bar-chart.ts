import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_BAR_CHART_TAG = 'rd-bar-chart';

export interface BarChartProps {
  title?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/chart/bar — visual.chart.bar */
export class RdBarChartElement extends RosettaAtomElement {
  static readonly tagName = RD_BAR_CHART_TAG;

  static get observedAttributes(): string[] {
    return ["title"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Bar chart');
    const bars = [40, 65, 55, 80, 48].map((h) => `<div class="rd-chart-bar__bar-wrap"><div class="rd-chart-bar__bar" style="height:${h}%"></div></div>`).join('');
    return `
      <section class="rd-chart-bar" data-testid="rd-chart-bar">
        <header class="rd-chart-bar__header"><span>${this.esc(title)}</span></header>
        <div class="rd-chart-bar__bars" aria-hidden="true">${bars}</div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdBarChart(): void {
  defineRosettaElement(RD_BAR_CHART_TAG, RdBarChartElement);
}
