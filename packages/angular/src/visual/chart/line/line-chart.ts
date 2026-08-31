import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface LineChartPoint {
  x: string | number;
  y: number;
}

export interface LineChartProps {
  title?: string;
  points?: LineChartPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueFormat?: (value: number) => string;
  className?: string;
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

function defaultFormat(value: number): string {
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

/** @rosettadash/angular/visual/chart/line — visual.chart.line */
@Component({
  selector: 'rd-chart-line',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      [attr.data-testid]="'rd-chart-line'"
      [ngClass]="rootClass()"
      role="img"
      [attr.aria-label]="title() ?? 'Line chart'"
    >
      <header class="rd-chart-line__header"><span>{{ title() ?? 'Line chart' }}</span></header>
      <div class="rd-chart-line__body">
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="rd-chart-line__svg" aria-hidden="true">
          @for (tick of model().ticks; track tick.value) {
            <g class="rd-chart-line__tick">
              <line
                [attr.x1]="padLeft"
                [attr.y1]="tick.y"
                [attr.x2]="width - padRight"
                [attr.y2]="tick.y"
                class="rd-chart-line__grid"
              />
              <text [attr.x]="tickLabelX" [attr.y]="tick.y + 4" class="rd-chart-line__tick-label">
                {{ tick.label }}
              </text>
            </g>
          }
          <polyline class="rd-chart-line__line" [attr.points]="model().polyline" />
          @for (point of model().coords; track point.label) {
            <g class="rd-chart-line__point">
              <circle [attr.cx]="point.x" [attr.cy]="point.y" r="3.5" class="rd-chart-line__dot" />
              <text [attr.x]="point.x" [attr.y]="height - 10" class="rd-chart-line__x-label">
                {{ point.label }}
              </text>
            </g>
          }
          @if (yAxisLabel()) {
            <text
              x="12"
              [attr.y]="padTop + plotH / 2"
              class="rd-chart-line__axis-label rd-chart-line__axis-label--y"
            >
              {{ yAxisLabel() }}
            </text>
          }
          @if (xAxisLabel()) {
            <text
              [attr.x]="padLeft + (width - padLeft - padRight) / 2"
              [attr.y]="height - 2"
              class="rd-chart-line__axis-label rd-chart-line__axis-label--x"
            >
              {{ xAxisLabel() }}
            </text>
          }
        </svg>
      </div>
      <ng-content />
    </section>
  `,
})
export class LineChart {
  readonly className = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly points = input<LineChartPoint[] | undefined>(undefined);
  readonly xAxisLabel = input<string | undefined>(undefined);
  readonly yAxisLabel = input<string | undefined>(undefined);
  readonly valueFormat = input<((value: number) => string) | undefined>(undefined);

  readonly width = CHART_WIDTH;
  readonly height = CHART_HEIGHT;
  readonly padLeft = PAD_LEFT;
  readonly padRight = PAD_RIGHT;
  readonly padTop = PAD_TOP;
  readonly plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  readonly tickLabelX = Y_TICK_X;

  readonly rootClass = computed(() =>
    ['rd-chart-line', this.className()].filter(Boolean).join(' '),
  );

  readonly model = computed(() => {
    const points = this.points()?.length ? this.points()! : FALLBACK_POINTS;
    const format = this.valueFormat() ?? defaultFormat;
    const values = points.map((point) => point.y);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const minY = dataMin >= 0 ? 0 : dataMin;
    const maxY = dataMax;
    const rangeY = maxY - minY || 1;
    const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
    const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const lastIndex = Math.max(points.length - 1, 1);
    const coords = points.map((point, index) => ({
      x: PAD_LEFT + (index / lastIndex) * plotW,
      y: PAD_TOP + plotH - ((point.y - minY) / rangeY) * plotH,
      label: String(point.x),
    }));
    const ticks = buildTicks(minY, maxY).map((value) => ({
      value,
      label: format(value),
      y: PAD_TOP + plotH - ((value - minY) / rangeY) * plotH,
    }));
    return {
      polyline: coords.map(({ x, y }) => `${x},${y}`).join(' '),
      coords,
      ticks,
    };
  });
}
