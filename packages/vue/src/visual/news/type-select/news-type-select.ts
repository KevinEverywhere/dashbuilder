import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface NewsTypeSelectProps {
  label?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/** @rosettadash/vue/visual/news/type-select — visual.news.type-select */
export const NewsTypeSelect = defineComponent({
  name: 'RdNewsTypeSelect',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    label: { type: String as PropType<string | undefined>, default: undefined },
    placeholder: { type: String as PropType<string | undefined>, default: undefined },
    options: { type: Array as PropType<{ value: string; label: string }[] | undefined>, default: undefined },
    value: { type: String as PropType<string | undefined>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs }) {
    return () => {
      const rootClass = ['rd-news-type-select', props.className, typeof attrs.class === 'string' ? attrs.class : ''].filter(Boolean).join(' ');
      return h('section', { class: rootClass, 'data-testid': 'rd-news-type-select' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('select', { class: 'rd-select', value: props.value ?? '' }, [
        h('option', { value: '', selected: !(props.value ?? '') }, props.placeholder ?? 'Select…'),
        ...(props.options ?? []).map((o) =>
          h('option', { key: o.value, value: o.value, selected: o.value === (props.value ?? '') }, o.label),
        ),
      ]),
      slots.default?.(),
    ]);
    };
  },
});

export type NewsTypeSelectComponent = typeof NewsTypeSelect;
