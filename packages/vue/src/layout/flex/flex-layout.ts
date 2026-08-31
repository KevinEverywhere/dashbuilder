import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export type FlexDensity = 'comfortable' | 'compact';

export interface FlexLayoutProps {
  title?: string;
  direction?: 'row' | 'column';
  gap?: number | string;
  density?: FlexDensity;
  className?: string;
}

/** @rosettadash/vue/layout/flex — layout.flex */
export const FlexLayout = defineComponent({
  name: 'RdFlexLayout',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    title: { type: String as PropType<string | undefined>, default: undefined },
    direction: { type: String as PropType<'row' | 'column' | undefined>, default: undefined },
    gap: { type: String as PropType<number | string | undefined>, default: undefined },
    density: { type: String as PropType<FlexDensity | undefined>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs }) {
    function flexGap(): number {
      return typeof props.gap === 'number' ? props.gap : 12;
    }
    return () => {
      const rootClass = [
        'rd-flex',
        props.density === 'compact' ? 'rd-flex--compact' : '',
        props.className,
        typeof attrs.class === 'string' ? attrs.class : '',
      ].filter(Boolean).join(' ');
      return h('section', { class: rootClass, 'data-testid': 'rd-flex' }, [
      props.title ? h('span', { class: 'rd-flex__title' }, props.title) : null,
      h('div', { class: 'rd-flex__flex', style: { flexDirection: props.direction ?? 'row', gap: `${flexGap()}px` } }, slots.default?.()),
    ]);
    };
  },
});

export type FlexLayoutComponent = typeof FlexLayout;
