import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

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

function chartCoords(
  points: LineChartPoint[],
  minY: number,
  rangeY: number,
): Array<{ x: number; y: number; label: string }> {
  const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const lastIndex = Math.max(points.length - 1, 1);

  return points.map((point, index) => {
    const x = PAD_LEFT + (index / lastIndex) * plotW;
    const y = PAD_TOP + plotH - ((point.y - minY) / rangeY) * plotH;
    return { x, y, label: String(point.x) };
  });
}

/** @rosettadash/vue/visual/chart/line — visual.chart.line */
export const LineChart = defineComponent({
  name: 'RdLineChart',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    title: { type: String as PropType<string | undefined>, default: undefined },
    points: { type: Array as PropType<LineChartPoint[] | undefined>, default: undefined },
    xAxisLabel: { type: String as PropType<string | undefined>, default: undefined },
    yAxisLabel: { type: String as PropType<string | undefined>, default: undefined },
    valueFormat: { type: Function as PropType<((value: number) => string) | undefined>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs }) {
    return () => {
      const rootClass = ['rd-chart-line', props.className, typeof attrs.class === 'string' ? attrs.class : '']
        .filter(Boolean)
        .join(' ');
      const points = props.points?.length ? props.points : FALLBACK_POINTS;
      const format = props.valueFormat ?? defaultFormat;
      const values = points.map((point) => point.y);
      const dataMin = Math.min(...values);
      const dataMax = Math.max(...values);
      const minY = dataMin >= 0 ? 0 : dataMin;
      const maxY = dataMax;
      const rangeY = maxY - minY || 1;
      const ticks = buildTicks(minY, maxY);
      const coords = chartCoords(points, minY, rangeY);
      const polyline = coords.map(({ x, y }) => `${x},${y}`).join(' ');
      const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

      return h(
        'section',
        {
          class: rootClass,
          'data-testid': 'rd-chart-line',
          role: 'img',
          'aria-label': props.title ?? 'Line chart',
        },
        [
          h('header', { class: 'rd-chart-line__header' }, h('span', null, props.title ?? 'Line chart')),
          h('div', { class: 'rd-chart-line__body' }, [
            h(
              'svg',
              { viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`, class: 'rd-chart-line__svg', 'aria-hidden': 'true' },
              [
                ...ticks.map((tick) => {
                  const y = PAD_TOP + plotH - ((tick - minY) / rangeY) * plotH;
                  return h('g', { key: tick, class: 'rd-chart-line__tick' }, [
                    h('line', {
                      x1: PAD_LEFT,
                      y1: y,
                      x2: CHART_WIDTH - PAD_RIGHT,
                      y2: y,
                      class: 'rd-chart-line__grid',
                    }),
                    h('text', { x: Y_TICK_X, y: y + 4, class: 'rd-chart-line__tick-label' }, format(tick)),
                  ]);
                }),
                h('polyline', { class: 'rd-chart-line__line', points: polyline }),
                ...coords.map(({ x, y, label }) =>
                  h('g', { key: label, class: 'rd-chart-line__point' }, [
                    h('circle', { cx: x, cy: y, r: 3.5, class: 'rd-chart-line__dot' }),
                    h('text', { x, y: CHART_HEIGHT - 10, class: 'rd-chart-line__x-label' }, label),
                  ]),
                ),
                props.yAxisLabel
                  ? h(
                      'text',
                      {
                        x: 12,
                        y: PAD_TOP + plotH / 2,
                        class: 'rd-chart-line__axis-label rd-chart-line__axis-label--y',
                      },
                      props.yAxisLabel,
                    )
                  : null,
                props.xAxisLabel
                  ? h(
                      'text',
                      {
                        x: PAD_LEFT + (CHART_WIDTH - PAD_LEFT - PAD_RIGHT) / 2,
                        y: CHART_HEIGHT - 2,
                        class: 'rd-chart-line__axis-label rd-chart-line__axis-label--x',
                      },
                      props.xAxisLabel,
                    )
                  : null,
              ],
            ),
          ]),
          slots.default?.(),
        ],
      );
    };
  },
});

export type LineChartComponent = typeof LineChart;
