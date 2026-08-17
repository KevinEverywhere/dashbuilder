import { defineRosettaElement } from '../../lib/element-utils.js';
import { RosettaAtomElement } from '../../lib/rosetta-atom-element.js';

export const RD_DATA_TABLE_TAG = 'rd-data-table';

export interface DataTableRow {
  id: string;
  name?: string;
  status?: string;
  amount?: number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface DataTableProps {
  title?: string;
  rows?: DataTableRow[];
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/table — visual.table */
export class RdDataTableElement extends RosettaAtomElement {
  static readonly tagName = RD_DATA_TABLE_TAG;

  static get observedAttributes(): string[] {
    return ["title","rows"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Data table');
    const rows = this.parseJsonAttr<Array<Record<string, string | number | undefined>>>('rows', []);
    const body = rows.map((row) => `<tr data-row-id="${this.esc(String(row['id'] ?? ''))}"><td>${this.esc(String(row['name'] ?? ''))}</td><td>${this.esc(String(row['status'] ?? ''))}</td><td>${this.esc(String(row['amount'] ?? ''))}</td><td>${this.esc(String(row['date'] ?? ''))}</td></tr>`).join('');
    return `
      <section class="rd-table rd-table" data-testid="rd-table">
        <header class="rd-table__header"><span>${this.esc(title)}</span></header>
        <div class="rd-table__scroll">
          <table class="rd-table__table">
            <thead><tr><th>Name</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
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
