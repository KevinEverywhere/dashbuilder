import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_PIE_CHART_TAG = 'rd-pie-chart';

export interface PieChartProps {
  title?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/chart/pie — visual.chart.pie */
export class RdPieChartElement extends RosettaAtomElement {
  static readonly tagName = RD_PIE_CHART_TAG;

  static get observedAttributes(): string[] {
    return ["title"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Pie chart');
    return `
      <section class="rd-chart-pie" data-testid="rd-chart-pie">
        <header class="rd-chart-pie__header"><span>${this.esc(title)}</span></header>
        <div class="rd-chart-pie__pie" aria-hidden="true"></div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdPieChart(): void {
  defineRosettaElement(RD_PIE_CHART_TAG, RdPieChartElement);
}
