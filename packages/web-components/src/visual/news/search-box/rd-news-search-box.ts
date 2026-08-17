import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_NEWS_SEARCH_BOX_TAG = 'rd-news-search-box';

export interface NewsSearchBoxProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onSearch?: (query: string) => void;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/news/search-box — visual.news.search-box */
export class RdNewsSearchBoxElement extends RosettaAtomElement {
  static readonly tagName = RD_NEWS_SEARCH_BOX_TAG;

  static get observedAttributes(): string[] {
    return ["label","placeholder","value"];
  }

  protected buildMarkup(): string {
    const label = this.readAttr('label');
    const placeholder = this.readAttr('placeholder', 'Search news…');
    const value = this.readAttr('value');
    return `
      <section class="rd-news-search-box" data-testid="rd-news-search-box">
        ${label ? `<span class="rd-field__label">${this.esc(label)}</span>` : ''}
        <div class="rd-search__row">
          <input type="search" class="rd-input" data-ref="query" placeholder="${this.esc(placeholder)}" value="${this.esc(value)}" aria-label="${this.esc(label || 'Search news')}" />
          <button type="button" class="rd-button" data-ref="search">Search</button>
        </div>
        <div data-ref="slot"></div>
      </section>`;
  }

  protected override wireEvents(): void {
    const emit = () => {
      const query = this.querySelector<HTMLInputElement>('[data-ref="query"]')?.value ?? '';
      this.dispatchDetail('search', { query });
    };
    this.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement && event.target.matches('[data-ref="search"]')) emit();
    });
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') emit();
    });
  }
}

export function registerRdNewsSearchBox(): void {
  defineRosettaElement(RD_NEWS_SEARCH_BOX_TAG, RdNewsSearchBoxElement);
}
