import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface DetailPanelProps {
  title?: string;
  emptyMessage?: string;
  className?: string;
}

function slotNodes(nodes: VNode[] | undefined): VNode[] {
  return (nodes ?? []).filter((node) => node !== null && node !== undefined);
}

/** @rosettadash/vue/visual/detail — visual.detail */
export const DetailPanel = defineComponent({
  name: 'RdDetailPanel',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    title: { type: String as PropType<string | undefined>, default: undefined },
    emptyMessage: { type: String as PropType<string | undefined>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs }) {
    return () => {
      const rootClass = ['rd-detail', props.className, typeof attrs.class === 'string' ? attrs.class : '']
        .filter(Boolean)
        .join(' ');
      const content = slotNodes(slots.default?.());
      return h('section', { class: rootClass, 'data-testid': 'rd-detail' }, [
        h('header', { class: 'rd-detail__header' }, h('span', null, props.title ?? 'Details')),
        content.length
          ? h('div', { class: 'rd-detail__body' }, content)
          : h('p', { class: 'rd-detail__empty' }, props.emptyMessage ?? 'Select a row to view details'),
      ]);
    };
  },
});

export type DetailPanelComponent = typeof DetailPanel;
