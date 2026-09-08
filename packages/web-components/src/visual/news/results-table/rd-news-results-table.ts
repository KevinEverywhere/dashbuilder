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
    return ['title', 'rows', 'link-headlines'];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'News results');
    const linkHeadlines = this.readBoolAttr('link-headlines', true);
    const rows = this.parseJsonAttr<Array<Record<string, string | undefined>>>('rows', []);
    const body = rows
      .map((row) => {
        const id = this.esc(String(row['id'] ?? ''));
        const headline = this.esc(row['headline'] ?? '');
        const url = row['url']?.trim();
        const headlineCell =
          url && linkHeadlines
            ? `<a href="${this.esc(url)}" target="_blank" rel="noopener noreferrer" class="rd-news-results-table__link" data-news-url="${this.esc(url)}">${headline}</a>`
            : headline;
        return `<tr data-row-id="${id}" data-row-url="${url ? this.esc(url) : ''}"><td>${headlineCell}</td><td>${this.esc(row['source'] ?? '')}</td><td>${this.esc(row['region'] ?? '')}</td><td>${this.esc(row['published'] ?? '')}</td></tr>`;
      })
      .join('');
    return `
      <section class="rd-news-results-table" data-testid="rd-news-results-table">
        <header class="rd-table__header"><span>${this.esc(title)}</span></header>
        <table class="rd-table"><thead><tr><th>Headline</th><th>Source</th><th>Region</th><th>Published</th></tr></thead><tbody>${body}</tbody></table>
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    const linkHeadlines = this.readBoolAttr('link-headlines', true);
    this.addEventListener('click', (event) => {
      const link = event.target instanceof HTMLElement ? event.target.closest('a[data-news-url]') : null;
      if (link instanceof HTMLAnchorElement) {
        return;
      }
      const row = event.target instanceof HTMLElement ? event.target.closest('tr[data-row-id]') : null;
      if (!(row instanceof HTMLElement)) {
        return;
      }
      const rowId = row.dataset['rowId'];
      if (!rowId) {
        return;
      }
      if (!linkHeadlines) {
        this.dispatchDetail('row-select', { id: rowId });
        return;
      }
      const url = row.dataset['rowUrl'];
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  }
}

export function registerRdNewsResultsTable(): void {
  defineRosettaElement(RD_NEWS_RESULTS_TABLE_TAG, RdNewsResultsTableElement);
}
