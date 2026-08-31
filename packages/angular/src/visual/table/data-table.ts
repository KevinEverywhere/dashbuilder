import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

/** @rosettadash/angular/visual/table — visual.table */
@Component({
  selector: 'rd-table',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.data-testid]="'rd-table'" [ngClass]="rootClass()">
      <header class="rd-table__header"><span>{{ title() ?? 'Data table' }}</span></header>
      <div class="rd-table__scroll">
        <table class="rd-table__table">
          <thead>
            <tr>
              @for (column of resolvedColumns(); track column.key) {
                <th
                  [class]="'rd-table__cell--' + (column.align ?? 'left')"
                  [style.width]="column.width"
                >
                  {{ column.header }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows() ?? []; track row.id) {
              <tr>
                @for (column of resolvedColumns(); track column.key) {
                  <td
                    [class]="'rd-table__cell--' + (column.align ?? 'left')"
                    [style.width]="column.width"
                  >
                    {{ displayValue(row, column) }}
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
      <ng-content />
    </section>
  `,
})
export class DataTable {
  readonly className = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly rows = input<DataTableRow[] | undefined>(undefined);
  readonly columns = input<DataTableColumn[] | undefined>(undefined);

  readonly rootClass = computed(() =>
    ['rd-table', this.className()].filter(Boolean).join(' '),
  );
  readonly resolvedColumns = computed(() =>
    this.columns()?.length ? this.columns()! : DEFAULT_COLUMNS,
  );

  displayValue(row: DataTableRow, column: DataTableColumn): string {
    return cellValue(row, column);
  }
}
