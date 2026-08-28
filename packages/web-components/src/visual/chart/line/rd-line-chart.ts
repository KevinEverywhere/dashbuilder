import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_LINE_CHART_TAG = 'rd-line-chart';

export interface LineChartPoint {
  x?: string | number;
  y: number;
}

export interface LineChartProps {
  title?: string;
  points?: LineChartPoint[];
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/chart/line — visual.chart.line */
export class RdLineChartElement extends RosettaAtomElement {
  static readonly tagName = RD_LINE_CHART_TAG;

  static get observedAttributes(): string[] {
    return ['title', 'points'];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Line chart');
    const points = this.parseJsonAttr<LineChartPoint[]>('points', []);
    const series = points.length
      ? points
      : [{ y: 80 }, { y: 60 }, { y: 65 }, { y: 40 }, { y: 45 }, { y: 20 }, { y: 30 }];
    const ys = series.map((point) => point.y);
    const minY = Math.min(0, ...ys);
    const maxY = Math.max(...ys);
    const rangeY = maxY - minY || 1;
    const last = Math.max(series.length - 1, 1);
    const polyline = series
      .map((point, index) => `${(index / last) * 240},${88 - ((point.y - minY) / rangeY) * 72}`)
      .join(' ');
    return `
      <section class="rd-chart-line" data-testid="rd-chart-line" role="img" aria-label="${this.esc(title)}">
        <header class="rd-chart-line__header"><span>${this.esc(title)}</span></header>
        <div class="rd-chart-line__body">
          <svg viewBox="0 0 240 96" class="rd-chart-line__svg" aria-hidden="true">
            <polyline class="rd-chart-line__line" points="${polyline}" />
          </svg>
        </div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdLineChart(): void {
  defineRosettaElement(RD_LINE_CHART_TAG, RdLineChartElement);
}
