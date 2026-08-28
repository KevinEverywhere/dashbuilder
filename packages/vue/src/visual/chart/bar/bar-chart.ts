import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

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

/** @rosettadash/vue/visual/chart/bar — visual.chart.bar */
export const BarChart = defineComponent({
  name: 'RdBarChart',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    title: { type: String as PropType<string | undefined>, default: undefined },
    bars: { type: Array as PropType<BarChartBar[] | undefined>, default: undefined },
    yAxisLabel: { type: String as PropType<string | undefined>, default: undefined },
    valueFormat: { type: Function as PropType<((value: number) => string) | undefined>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs }) {
    return () => {
      const rootClass = ['rd-chart-bar', props.className, typeof attrs.class === 'string' ? attrs.class : '']
        .filter(Boolean)
        .join(' ');
      const bars = props.bars?.length ? props.bars : FALLBACK_BARS;
      const format = props.valueFormat ?? defaultFormat;
      const maxValue = Math.max(...bars.map((bar) => bar.value), 1);
      const ticks = buildTicks(maxValue);

      return h(
        'section',
        {
          class: rootClass,
          'data-testid': 'rd-chart-bar',
          role: 'img',
          'aria-label': props.title ?? 'Bar chart',
        },
        [
          h('header', { class: 'rd-chart-bar__header' }, h('span', null, props.title ?? 'Bar chart')),
          h('div', { class: 'rd-chart-bar__body' }, [
            h('div', { class: 'rd-chart-bar__y-axis', 'aria-hidden': 'true' }, [
              h(
                'div',
                { class: 'rd-chart-bar__y-ticks' },
                [...ticks]
                  .reverse()
                  .map((tick) => h('span', { key: tick, class: 'rd-chart-bar__y-tick' }, format(tick))),
              ),
              props.yAxisLabel ? h('span', { class: 'rd-chart-bar__y-label' }, props.yAxisLabel) : null,
            ]),
            h('div', { class: 'rd-chart-bar__plot' }, [
              h(
                'div',
                { class: 'rd-chart-bar__grid-lines', 'aria-hidden': 'true' },
                ticks.map((tick) =>
                  h('span', {
                    key: tick,
                    class: 'rd-chart-bar__grid-line',
                    style: { bottom: `${(tick / maxValue) * 100}%` },
                  }),
                ),
              ),
              h(
                'div',
                { class: 'rd-chart-bar__bars' },
                bars.map((bar) => {
                  const heightPct = (bar.value / maxValue) * 100;
                  return h('div', { key: bar.label, class: 'rd-chart-bar__bar-group' }, [
                    h('div', { class: 'rd-chart-bar__bar-wrap' }, [
                      h('div', {
                        class: 'rd-chart-bar__bar',
                        style: { height: `${heightPct}%` },
                        title: `${bar.label}: ${format(bar.value)}`,
                      }),
                    ]),
                    h('span', { class: 'rd-chart-bar__x-label' }, bar.label),
                    h('span', { class: 'rd-chart-bar__value' }, format(bar.value)),
                  ]);
                }),
              ),
            ]),
          ]),
          slots.default?.(),
        ],
      );
    };
  },
});

export type BarChartComponent = typeof BarChart;
