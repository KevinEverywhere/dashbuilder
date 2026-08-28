import { forwardRef, type CSSProperties, type ReactNode } from 'react';

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
  style?: CSSProperties;
  children?: ReactNode;
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

/** @rosettadash/react/visual/table — visual.table */
export const DataTable = forwardRef<HTMLElement, DataTableProps>(function DataTable(
  props,
  ref,
) {
  const { className, style, children } = props;
  const rootClass = ['rd-table', className].filter(Boolean).join(' ');
  const columns = props.columns?.length ? props.columns : DEFAULT_COLUMNS;
  const rows = props.rows ?? [];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={rootClass} style={style} data-testid="rd-table">
      <header className="rd-table__header">
        <span>{props.title ?? 'Data table'}</span>
        {rows.length ? (
          <span className="rd-table__count">{rows.length} rows</span>
        ) : null}
      </header>
      <div className="rd-table__scroll">
        <table className="rd-table__table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.align ? `rd-table__cell--${column.align}` : undefined}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = props.selectedRowId === row.id;
              return (
                <tr
                  key={row.id}
                  className={[
                    'rd-table__row',
                    selected ? 'rd-table__row--selected' : '',
                    props.onRowSelect ? 'rd-table__row--interactive' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-selected={selected || undefined}
                  onClick={
                    props.onRowSelect
                      ? () => props.onRowSelect?.(row.id)
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.align ? `rd-table__cell--${column.align}` : undefined}
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {cellValue(row, column)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {children}
    </section>
  );
});
