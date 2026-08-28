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

export interface DataTableProps {
  title?: string;
  rows?: DataTableRow[];
  className?: string;
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
          <thead><tr><th>Name</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            @for (row of rows() ?? []; track row.id) {
              <tr><td>{{ row.name }}</td><td>{{ row.status }}</td><td>{{ row.amount }}</td><td>{{ row.date }}</td></tr>
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
  readonly name = input<string | undefined>(undefined);
  readonly status = input<string | undefined>(undefined);
  readonly amount = input<number | undefined>(undefined);
  readonly date = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly rows = input<DataTableRow[] | undefined>(undefined);

  readonly rootClass = computed(() =>
    ['rd-table', this.className()].filter(Boolean).join(' '),
  );
}
