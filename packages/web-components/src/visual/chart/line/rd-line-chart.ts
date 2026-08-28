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
  xAxisLabel?: string;
  yAxisLabel?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

const FALLBACK_POINTS: LineChartPoint[] = [
  { x: '2019', y: 42 },
  { x: '2020', y: 18 },
  { x: '2021', y: 12 },
  { x: '2022', y: 19 },
  { x: '2023', y: 31 },
  { x: '2024', y: 36 },
];

const CHART_WIDTH = 320;
const CHART_HEIGHT = 200;
const PAD_LEFT = 58;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 36;
const Y_TICK_X = PAD_LEFT - 6;

function formatChartValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return String(Math.round(value));
}

function buildTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    return [min];
  }
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + step * index);
}

/** @rosettadash/web-components/visual/chart/line — visual.chart.line */
export class RdLineChartElement extends RosettaAtomElement {
  static readonly tagName = RD_LINE_CHART_TAG;

  static get observedAttributes(): string[] {
    return ['title', 'points', 'x-axis-label', 'y-axis-label'];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Line chart');
    const xAxisLabel = this.readAttr('x-axis-label');
    const yAxisLabel = this.readAttr('y-axis-label');
    const parsed = this.parseJsonAttr<LineChartPoint[]>('points', []);
    const series = parsed.length ? parsed : FALLBACK_POINTS;
    const values = series.map((point) => point.y);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const minY = dataMin >= 0 ? 0 : dataMin;
    const maxY = dataMax;
    const rangeY = maxY - minY || 1;
    const ticks = buildTicks(minY, maxY);
    const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
    const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const lastIndex = Math.max(series.length - 1, 1);
    const coords = series.map((point, index) => {
      const x = PAD_LEFT + (index / lastIndex) * plotW;
      const y = PAD_TOP + plotH - ((point.y - minY) / rangeY) * plotH;
      return { x, y, label: String(point.x ?? index) };
    });
    const polyline = coords.map(({ x, y }) => `${x},${y}`).join(' ');
    const grid = ticks
      .map((tick) => {
        const y = PAD_TOP + plotH - ((tick - minY) / rangeY) * plotH;
        return `
          <g class="rd-chart-line__tick">
            <line x1="${PAD_LEFT}" y1="${y}" x2="${CHART_WIDTH - PAD_RIGHT}" y2="${y}" class="rd-chart-line__grid" />
            <text x="${Y_TICK_X}" y="${y + 4}" class="rd-chart-line__tick-label">${this.esc(formatChartValue(tick))}</text>
          </g>`;
      })
      .join('');
    const dots = coords
      .map(
        ({ x, y, label }) => `
          <g class="rd-chart-line__point">
            <circle cx="${x}" cy="${y}" r="3.5" class="rd-chart-line__dot" />
            <text x="${x}" y="${CHART_HEIGHT - 10}" class="rd-chart-line__x-label">${this.esc(label)}</text>
          </g>`,
      )
      .join('');
    const yLabel = yAxisLabel
      ? `<text x="12" y="${PAD_TOP + plotH / 2}" class="rd-chart-line__axis-label rd-chart-line__axis-label--y">${this.esc(yAxisLabel)}</text>`
      : '';
    const xLabel = xAxisLabel
      ? `<text x="${PAD_LEFT + plotW / 2}" y="${CHART_HEIGHT - 2}" class="rd-chart-line__axis-label rd-chart-line__axis-label--x">${this.esc(xAxisLabel)}</text>`
      : '';

    return `
      <section class="rd-chart-line" data-testid="rd-chart-line" role="img" aria-label="${this.esc(title)}">
        <header class="rd-chart-line__header"><span>${this.esc(title)}</span></header>
        <div class="rd-chart-line__body">
          <svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" class="rd-chart-line__svg" aria-hidden="true">
            ${grid}
            <polyline class="rd-chart-line__line" points="${polyline}" />
            ${dots}
            ${yLabel}
            ${xLabel}
          </svg>
        </div>
        <div data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdLineChart(): void {
  defineRosettaElement(RD_LINE_CHART_TAG, RdLineChartElement);
}
