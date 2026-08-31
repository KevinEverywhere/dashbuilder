import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface DataTableRow {
  id: string;
  name?: string;
  status?: string;
  amount?: string | number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface DataTableColumn {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  format?: (value: unknown, row: DataTableRow) => string;
}

export interface DataTableProps {
  title?: string;
  rows?: DataTableRow[];
  columns?: DataTableColumn[];
  selectedRowId?: string;
  onRowSelect?: (rowId: string) => void;
  className?: string;
}

const DEFAULT_COLUMNS: DataTableColumn[] = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'amount', header: 'Amount', align: 'right' },
  { key: 'date', header: 'Date', align: 'right' },
];

function cellValue(row: DataTableRow, column: DataTableColumn): string {
  const raw = row[column.key];
  if (column.format) {
    return column.format(raw, row);
  }
  if (raw === undefined || raw === null) {
    return '—';
  }
  return String(raw);
}

/** @rosettadash/vue/visual/table — visual.table */
export const DataTable = defineComponent({
  name: 'RdDataTable',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    title: { type: String as PropType<string | undefined>, default: undefined },
    rows: { type: Array as PropType<DataTableRow[] | undefined>, default: undefined },
    columns: { type: Array as PropType<DataTableColumn[] | undefined>, default: undefined },
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
      const columns = props.columns?.length ? props.columns : DEFAULT_COLUMNS;
      return h('section', { class: rootClass, 'data-testid': 'rd-table' }, [
        h('header', { class: 'rd-table__header' }, h('span', null, props.title ?? 'Data table')),
        h('div', { class: 'rd-table__scroll' }, [
          h('table', { class: 'rd-table__table' }, [
            h(
              'thead',
              null,
              h(
                'tr',
                null,
                columns.map((column) =>
                  h(
                    'th',
                    {
                      key: column.key,
                      class: column.align ? `rd-table__cell--${column.align}` : undefined,
                      style: column.width ? { width: column.width } : undefined,
                    },
                    column.header,
                  ),
                ),
              ),
            ),
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
                  columns.map((column) =>
                    h(
                      'td',
                      {
                        key: column.key,
                        class: column.align ? `rd-table__cell--${column.align}` : undefined,
                        style: column.width ? { width: column.width } : undefined,
                      },
                      cellValue(row, column),
                    ),
                  ),
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
