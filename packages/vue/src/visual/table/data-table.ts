import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface DataTableRow {
  id: string;
  name?: string;
  status?: string;
  amount?: string | number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface DataTableProps {
  title?: string;
  rows?: DataTableRow[];
  selectedRowId?: string;
  onRowSelect?: (rowId: string) => void;
  className?: string;
}

/** @rosettadash/vue/visual/table — visual.table */
export const DataTable = defineComponent({
  name: 'RdDataTable',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    title: { type: String as PropType<string | undefined>, default: undefined },
    rows: { type: Array as PropType<DataTableRow[] | undefined>, default: undefined },
    selectedRowId: { type: String as PropType<string | undefined>, default: undefined },
    onRowSelect: { type: Function as PropType<((rowId: string) => void) | undefined>, default: undefined },
  },
  emits: ['rowSelect'],
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs, emit }) {
    return () => {
      const rootClass = ['rd-table', props.className, typeof attrs.class === 'string' ? attrs.class : '']
        .filter(Boolean)
        .join(' ');
      const selectable = props.selectedRowId !== undefined || Boolean(props.onRowSelect);
      return h('section', { class: rootClass, 'data-testid': 'rd-table' }, [
        h('header', { class: 'rd-table__header' }, h('span', null, props.title ?? 'Data table')),
        h('div', { class: 'rd-table__scroll' }, [
          h('table', { class: 'rd-table__table' }, [
            h('thead', null, h('tr', null, ['Name', 'Status', 'Amount', 'Date'].map((col) => h('th', { key: col }, col)))),
            h(
              'tbody',
              null,
              (props.rows ?? []).map((row) => {
                const selected = row.id === props.selectedRowId;
                return h(
                  'tr',
                  {
                    key: row.id,
                    class: [
                      'rd-table__row',
                      selected ? 'rd-table__row--selected' : '',
                      selectable ? 'rd-table__row--interactive' : '',
                    ]
                      .filter(Boolean)
                      .join(' '),
                    'aria-selected': selected || undefined,
                    onClick: selectable
                      ? () => {
                          emit('rowSelect', row.id);
                          props.onRowSelect?.(row.id);
                        }
                      : undefined,
                  },
                  [
                    h('td', null, row.name),
                    h('td', null, row.status),
                    h('td', null, row.amount),
                    h('td', null, row.date),
                  ],
                );
              }),
            ),
          ]),
        ]),
        slots.default?.(),
      ]);
    };
  },
});

export type DataTableComponent = typeof DataTable;
