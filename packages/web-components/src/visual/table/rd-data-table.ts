import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_DATA_TABLE_TAG = 'rd-data-table';

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
}

export interface DataTableProps {
  title?: string;
  rows?: DataTableRow[];
  columns?: DataTableColumn[];
  selectedRowId?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

const DEFAULT_COLUMNS: DataTableColumn[] = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'amount', header: 'Amount', align: 'right' },
  { key: 'date', header: 'Date', align: 'right' },
];

function resolveColumns(raw: DataTableColumn[] | undefined): DataTableColumn[] {
  return raw?.length ? raw : DEFAULT_COLUMNS;
}

function cellText(row: Record<string, string | number | undefined>, column: DataTableColumn): string {
  const raw = row[column.key];
  if (raw === undefined || raw === null) {
    return '—';
  }
  return String(raw);
}

/** @rosettadash/web-components/visual/table — visual.table */
export class RdDataTableElement extends RosettaAtomElement {
  static readonly tagName = RD_DATA_TABLE_TAG;

  static get observedAttributes(): string[] {
    return ["title","rows","columns","selected-row-id"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Data table');
    const selectedId = this.readAttr('selected-row-id');
    const rows = this.parseJsonAttr<Array<Record<string, string | number | undefined>>>('rows', []);
    const columns = resolveColumns(this.parseJsonAttr<DataTableColumn[]>('columns', []));
    const head = columns
      .map((column) => {
        const align = column.align ? ` class="rd-table__cell--${this.esc(column.align)}"` : '';
        const width = column.width ? ` style="width:${this.esc(column.width)}"` : '';
        return `<th${align}${width}>${this.esc(column.header)}</th>`;
      })
      .join('');
    const body = rows.map((row) => {
      const id = String(row['id'] ?? '');
      const selected = id === selectedId;
      const classes = ['rd-table__row', 'rd-table__row--interactive', selected ? 'rd-table__row--selected' : '']
        .filter(Boolean)
        .join(' ');
      const cells = columns
        .map((column) => {
          const align = column.align ? ` class="rd-table__cell--${this.esc(column.align)}"` : '';
          const width = column.width ? ` style="width:${this.esc(column.width)}"` : '';
          return `<td${align}${width}>${this.esc(cellText(row, column))}</td>`;
        })
        .join('');
      return `<tr class="${classes}" data-row-id="${this.esc(id)}"${selected ? ' aria-selected="true"' : ''}>${cells}</tr>`;
    }).join('');
    return `
      <section class="rd-table rd-table" data-testid="rd-table">
        <header class="rd-table__header"><span>${this.esc(title)}</span></header>
        <div class="rd-table__scroll">
          <table class="rd-table__table">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    this.addEventListener('click', (event) => {
      const row = event.target instanceof HTMLElement ? event.target.closest('tr[data-row-id]') : null;
      if (row instanceof HTMLElement && row.dataset['rowId']) {
        this.dispatchDetail('row-select', { id: row.dataset['rowId'] });
      }
    });
  }
}

export function registerRdDataTable(): void {
  defineRosettaElement(RD_DATA_TABLE_TAG, RdDataTableElement);
}
