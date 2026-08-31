import { defineRosettaElement } from '../../../lib/element-utils.js';
import { RosettaAtomElement } from '../../../lib/rosetta-atom-element.js';

export const RD_NEWS_ARTICLE_DETAIL_TAG = 'rd-news-article-detail';

export interface NewsArticleDetailProps {
  title?: string;
  emptyMessage?: string;
  className?: string;
  style?: Record<string, string>;
  children?: unknown;
}

/** @rosettadash/web-components/visual/news/article-detail — visual.news.article-detail */
export class RdNewsArticleDetailElement extends RosettaAtomElement {
  static readonly tagName = RD_NEWS_ARTICLE_DETAIL_TAG;

  static get observedAttributes(): string[] {
    return ["title","empty-message"];
  }

  protected buildMarkup(): string {
    const title = this.readAttr('title', 'Article');
    const empty = this.readAttr('empty-message', 'Select a headline in News Results');
    return `
      <section class="rd-news-article-detail rd-detail" data-testid="rd-news-article-detail">
        <header class="rd-detail__header"><span>${this.esc(title)}</span></header>
        <p class="rd-detail__empty">${this.esc(empty)}</p>
        <div class="rd-detail__body" data-ref="slot"></div>
      </section>`;
  }
}

export function registerRdNewsArticleDetail(): void {
  defineRosettaElement(RD_NEWS_ARTICLE_DETAIL_TAG, RdNewsArticleDetailElement);
}
