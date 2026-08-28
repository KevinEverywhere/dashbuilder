import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface NumberInputProps {
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

/** @rosettadash/vue/visual/input/number — visual.input.number */
export const NumberInput = defineComponent({
  name: 'RdNumberInput',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    label: { type: String as PropType<string | undefined>, default: undefined },
    placeholder: { type: String as PropType<string | undefined>, default: undefined },
    min: { type: Number as PropType<number | undefined>, default: undefined },
    max: { type: Number as PropType<number | undefined>, default: undefined },
    step: { type: Number as PropType<number | undefined>, default: undefined },
    value: { type: Number as PropType<number | undefined>, default: undefined },
    disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    onChange: { type: Function as PropType<((value: number) => void) | undefined>, default: undefined },
  },
  emits: ['change', 'update:value'],
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs, emit }) {
    const onNativeChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      const next = Number(target.value);
      props.onChange?.(next);
      emit('change', next);
      emit('update:value', next);
    };

    return () => {
      const rootClass = ['rd-input-number', props.className, typeof attrs.class === 'string' ? attrs.class : '']
        .filter(Boolean)
        .join(' ');
      return h('section', { class: rootClass, 'data-testid': 'rd-input-number' }, [
        props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
        h('input', {
          type: 'number',
          class: 'rd-input',
          placeholder: props.placeholder ?? '',
          min: props.min,
          max: props.max,
          step: props.step,
          value: props.value,
          disabled: props.disabled ?? false,
          onChange: onNativeChange,
        }),
        slots.default?.(),
      ]);
    };
  },
});

export type NumberInputComponent = typeof NumberInput;
