import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface NewsArticleDetailProps {
  title?: string;
  emptyMessage?: string;
  className?: string;
}

/** @rosettadash/angular/visual/news/article-detail — visual.news.article-detail */
@Component({
  selector: 'rd-news-article-detail',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.data-testid]="'rd-news-article-detail'" [ngClass]="rootClass()">
      <header class="rd-detail__header"><span>{{ title() ?? 'Article' }}</span></header>
      <p class="rd-detail__empty">{{ emptyMessage() ?? 'Select a headline in News Results' }}</p>
      <div class="rd-detail__body">
        <ng-content />
      </div>
    </section>
  `,
})
export class NewsArticleDetail {
  readonly className = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly emptyMessage = input<string | undefined>(undefined);

  readonly rootClass = computed(() =>
    ['rd-news-article-detail', 'rd-detail', this.className()].filter(Boolean).join(' '),
  );
}
