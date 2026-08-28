import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface ScrollRegionProps {
  title?: string;
  maxHeight?: string;
  overlayScrollbar?: boolean;
  className?: string;
}

/** @rosettadash/vue/layout/scroll-region — layout.scroll-region */
export const ScrollRegion = defineComponent({
  name: 'RdScrollRegion',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    title: { type: String as PropType<string | undefined>, default: undefined },
    maxHeight: { type: String as PropType<string | undefined>, default: undefined },
    overlayScrollbar: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs }) {
    return () => {
      const rootClass = ['rd-scroll-region', props.className, typeof attrs.class === 'string' ? attrs.class : ''].filter(Boolean).join(' ');
      return h('section', {
      class: [rootClass, props.overlayScrollbar === false ? '' : 'rd-scroll-region--overlay-scrollbar'].filter(Boolean).join(' '),
      'data-testid': 'rd-scroll-region',
      'aria-label': props.title ?? 'Scrollable content',
      style: props.maxHeight ? { maxHeight: props.maxHeight } : undefined,
    }, [
      props.title ? h('header', { class: 'rd-scroll-region__header' }, props.title) : null,
      h('div', { class: 'rd-scroll-region__body' }, slots.default?.()),
    ]);
    };
  },
});

export type ScrollRegionComponent = typeof ScrollRegion;
