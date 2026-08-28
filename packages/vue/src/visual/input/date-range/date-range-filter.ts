import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface DateRangeFilterProps {
  label?: string;
  startDate?: string;
  endDate?: string;
  presetLabel?: string;
  granularity?: 'date' | 'month';
  onChange?: (range: { startDate: string; endDate: string }) => void;
  className?: string;
}

/** @rosettadash/vue/visual/input/date-range — visual.input.date-range */
export const DateRangeFilter = defineComponent({
  name: 'RdDateRangeFilter',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    label: { type: String as PropType<string | undefined>, default: undefined },
    startDate: { type: String as PropType<string | undefined>, default: undefined },
    endDate: { type: String as PropType<string | undefined>, default: undefined },
    presetLabel: { type: String as PropType<string | undefined>, default: undefined },
    granularity: { type: String as PropType<'date' | 'month' | undefined>, default: undefined },
    onChange: { type: Function as PropType<((range: { startDate: string; endDate: string }) => void) | undefined>, default: undefined },
  },
  emits: ['change'],
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs, emit }) {
    return () => {
      const rootClass = ['rd-input-date-range', props.className, typeof attrs.class === 'string' ? attrs.class : '']
        .filter(Boolean)
        .join(' ');
      const inputType = props.granularity === 'month' ? 'month' : 'date';
      const emitRange = (startDate: string, endDate: string) => {
        const range = { startDate, endDate };
        emit('change', range);
        props.onChange?.(range);
      };
      return h('section', { class: rootClass, 'data-testid': 'rd-input-date-range' }, [
        props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
        h('div', { class: 'rd-date-range__controls' }, [
          h('input', {
            type: inputType,
            class: 'rd-input',
            value: props.startDate ?? '',
            'aria-label': `${props.label ?? 'Date range'} start`,
            onChange: (event: Event) => {
              const startDate = (event.target as HTMLInputElement).value;
              emitRange(startDate, props.endDate ?? '');
            },
          }),
          h('span', { class: 'rd-date-range__sep' }, 'to'),
          h('input', {
            type: inputType,
            class: 'rd-input',
            value: props.endDate ?? '',
            'aria-label': `${props.label ?? 'Date range'} end`,
            onChange: (event: Event) => {
              const endDate = (event.target as HTMLInputElement).value;
              emitRange(props.startDate ?? '', endDate);
            },
          }),
        ]),
        props.presetLabel ? h('span', { class: 'rd-date-range__preset' }, props.presetLabel) : null,
        slots.default?.(),
      ]);
    };
  },
});

export type DateRangeFilterComponent = typeof DateRangeFilter;
