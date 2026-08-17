import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_NEWS_RESULTS_TABLE_TAG = 'rd-news-results-table';

export interface NewsResultsTableProps {
  title?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/news/results-table — visual.news.results-table */
export class RdNewsResultsTableElement extends RosettaAtomElement {
  static readonly tagName = RD_NEWS_RESULTS_TABLE_TAG;

  static get observedAttributes(): string[] {
    return ["title","rows"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'News results');
    const rows = this.parseJsonAttr<Array<Record<string, string | undefined>>>('rows', []);
    const body = rows.map((row) => `<tr data-row-id="${this.esc(String(row['id'] ?? ''))}"><td>${this.esc(row['headline'] ?? '')}</td><td>${this.esc(row['source'] ?? '')}</td><td>${this.esc(row['region'] ?? '')}</td><td>${this.esc(row['published'] ?? '')}</td></tr>`).join('');
    return `
      <section class="rd-news-results-table" data-testid="rd-news-results-table">
        <header class="rd-table__header"><span>${this.esc(title)}</span></header>
        <table class="rd-table"><thead><tr><th>Headline</th><th>Source</th><th>Region</th><th>Published</th></tr></thead><tbody>${body}</tbody></table>
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

export function registerRdNewsResultsTable(): void {
  defineRosettaElement(RD_NEWS_RESULTS_TABLE_TAG, RdNewsResultsTableElement);
}
