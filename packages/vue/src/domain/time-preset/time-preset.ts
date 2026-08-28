import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface TimePresetPreset {
  id: string;
  label: string;
}

export interface TimePresetProps {
  label?: string;
  presets?: TimePresetPreset[];
  activePresetId?: string;
  onPresetChange?: (presetId: string) => void;
  className?: string;
}

/** @rosettadash/vue/domain/time-preset — domain.time-preset */
export const TimePreset = defineComponent({
  name: 'RdTimePreset',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    label: { type: String as PropType<string | undefined>, default: undefined },
    presets: { type: Array as PropType<TimePresetPreset[] | undefined>, default: undefined },
    activePresetId: { type: String as PropType<string | undefined>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  emits: ['presetChange'],
  setup(props, { slots, attrs, emit }) {
    function presetButtonClass(id: string): string {
      return ['rd-time-preset__button', props.activePresetId === id ? 'rd-time-preset__button--active' : ''].filter(Boolean).join(' ');
    }
    return () => {
      const rootClass = ['rd-time-preset', props.className, typeof attrs.class === 'string' ? attrs.class : ''].filter(Boolean).join(' ');
      return h('section', { class: rootClass, 'data-testid': 'rd-time-preset' }, [
      props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
      h('div', { class: 'rd-time-preset__buttons', role: 'group' }, (props.presets ?? []).map((p) =>
        h('button', {
          type: 'button',
          key: p.id,
          class: presetButtonClass(p.id),
          onClick: () => {
            emit('presetChange', p.id);
            props.onPresetChange?.(p.id);
          },
        }, p.label),
      )),
      slots.default?.(),
    ]);
    };
  },
});

export type TimePresetComponent = typeof TimePreset;
