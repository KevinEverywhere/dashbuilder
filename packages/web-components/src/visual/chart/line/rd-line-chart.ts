import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_LINE_CHART_TAG = 'rd-line-chart';

export interface LineChartProps {
  title?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/chart/line — visual.chart.line */
export class RdLineChartElement extends RosettaAtomElement {
  static readonly tagName = RD_LINE_CHART_TAG;

  static get observedAttributes(): string[] {
    return ["title"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Line chart');
    return `
      <section class="rd-chart-line" data-testid="rd-chart-line">
        <header class="rd-chart-line__header"><span>${this.esc(title)}</span></header>
        <div class="rd-chart-line__body">
          <svg viewBox="0 0 240 96" class="rd-chart-line__svg" aria-hidden="true">
            <polyline class="rd-chart-line__line" points="0,80 40,60 80,65 120,40 160,45 200,20 240,30" />
          </svg>
        </div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdLineChart(): void {
  defineRosettaElement(RD_LINE_CHART_TAG, RdLineChartElement);
}
