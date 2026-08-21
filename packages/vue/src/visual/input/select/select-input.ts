import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface SelectInputOption {
  value: string;
  label: string;
}

export interface SelectInputProps {
  label?: string;
  placeholder?: string;
  options?: SelectInputOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/** @rosettadash/vue/visual/input/select — visual.input.select */
export const SelectInput = defineComponent({
  name: 'RdSelectInput',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    label: { type: String as PropType<string | undefined>, default: undefined },
    placeholder: { type: String as PropType<string | undefined>, default: undefined },
    options: { type: Array as PropType<SelectInputOption[] | undefined>, default: undefined },
    value: { type: String as PropType<string | undefined>, default: undefined },
    onChange: { type: Function as PropType<((value: string) => void) | undefined>, default: undefined },
  },
  emits: ['change', 'update:value'],
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs, emit }) {
    const onNativeChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) {
        return;
      }
      props.onChange?.(target.value);
      emit('change', target.value);
      emit('update:value', target.value);
    };

    return () => {
      const rootClass = ['rd-input-select', props.className, typeof attrs.class === 'string' ? attrs.class : '']
        .filter(Boolean)
        .join(' ');
      return h('section', { class: rootClass, 'data-testid': 'rd-input-select' }, [
        props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
        h(
          'select',
          {
            class: 'rd-select',
            value: props.value ?? '',
            onChange: onNativeChange,
          },
          [
            h('option', { value: '' }, props.placeholder ?? 'Select…'),
            ...(props.options ?? []).map((o) => h('option', { key: o.value, value: o.value }, o.label)),
          ],
        ),
        slots.default?.(),
      ]);
    };
  },
});

export type SelectInputComponent = typeof SelectInput;
