import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import {
  destinationNewsLabel,
  fetchAtlasNews,
  formatNewsFeedBanner,
  newsArticleToTableRow,
  type NewsArticle,
  type NewsFeedResult,
} from '@destination-atlas';
import { NewsArticleDetail } from '@rosettadash/angular/visual/news/article-detail';
import { REGION_OPTIONS } from '../lib/atlas-utils';
import { AtlasStateService } from '../services/atlas-state.service';
import { RoleGatePanelComponent } from '../components/role-gate-panel.component';
import { DaBoundSelectInputComponent } from '../components/proof-form-fields.component';

@Component({
  selector: 'da-intel-screen',
  standalone: true,
  imports: [NewsArticleDetail, RoleGatePanelComponent, DaBoundSelectInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="da-panel">
      <h2>News</h2>
      <p>
        Destination-scoped headlines from Google News RSS via the builder API (~24h cache).
        @if (destinationLabel()) {
          Active destination: {{ destinationLabel() }}.
        }
      </p>
      @if (feedResult(); as result) {
        <p
          class="da-parity-banner da-parity-banner--{{ result.source }}"
          role="status"
        >
          {{ feedBanner() }}
        </p>
      } @else {
        <p class="da-note" role="status">Loading news…</p>
      }

      <div class="da-stack">
        <da-role-gate-panel
          [gateLabel]="'News search tools'"
          [currentRole]="atlas.userRole()"
          [allowedRoles]="['editor', 'admin']"
          [hideWhenDenied]="true"
          statusText="Search and region filters enabled"
        >
          <div class="da-stack da-stack--2">
            <section class="rd-news-search-box">
              <span class="rd-field__label">Search news</span>
              <div class="rd-search__row">
                <input
                  type="search"
                  class="rd-input"
                  placeholder="Search headlines…"
                  [value]="atlas.newsQuery()"
                  (input)="atlas.newsQuery.set($any($event.target).value)"
                />
                <button type="button" class="rd-button" (click)="atlas.newsQuery.set(atlas.newsQuery())">
                  Search
                </button>
              </div>
            </section>
            <da-bound-select-input
              [fieldLabel]="'Region'"
              placeholder="All regions"
              [options]="regionOptions"
              [value]="atlas.newsRegion()"
              (valueChange)="atlas.newsRegion.set($event)"
            />
          </div>
        </da-role-gate-panel>

        <section class="rd-news-results-table">
          <header class="rd-table__header">
            <span>News results</span>
            @if (tableRows().length) {
              <span class="rd-table__count">{{ tableRows().length }} articles</span>
            }
          </header>
          <table class="rd-table">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Source</th>
                <th>Region</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              @for (article of tableRows(); track article.id) {
                <tr
                  [class.rd-table__row--selected]="article.id === atlas.selectedArticleId()"
                  class="da-table-row--clickable"
                  (click)="openArticle(article)"
                >
                  <td>
                    @if (article.url && !canSelectRows()) {
                      <a
                        [href]="article.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rd-news-results-table__link"
                        (click)="$event.stopPropagation()"
                      >
                        {{ article.headline }}
                      </a>
                    } @else {
                      {{ article.headline }}
                    }
                  </td>
                  <td>{{ article.source }}</td>
                  <td>{{ article.region }}</td>
                  <td>{{ article.published }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <da-role-gate-panel
          [gateLabel]="'Article detail'"
          [currentRole]="atlas.userRole()"
          [allowedRoles]="['editor', 'admin']"
          [hideWhenDenied]="true"
          statusText="Full article summaries"
        >
          <rd-news-article-detail title="Article detail">
            @if (selectedArticle(); as article) {
              <div class="da-detail-body">
                <p><strong>{{ article.headline }}</strong></p>
                <p>{{ article.source }} · {{ article.region }} · {{ article.publishedAt }}</p>
                <p>{{ article.summary }}</p>
                @if (article.url) {
                  <p><a [href]="article.url" target="_blank" rel="noreferrer">Read source</a></p>
                }
              </div>
            } @else {
              <p class="da-detail-body">Select a headline to read the summary.</p>
            }
          </rd-news-article-detail>
        </da-role-gate-panel>
      </div>
    </section>
  `,
})
export class IntelScreenComponent {
  readonly atlas = inject(AtlasStateService);

  readonly regionOptions = REGION_OPTIONS;
  readonly feedResult = signal<NewsFeedResult | null>(null);

  readonly destinationLabel = computed(() => destinationNewsLabel(this.atlas.selectedId()));

  readonly articles = computed<NewsArticle[]>(() => this.feedResult()?.articles ?? []);

  readonly tableRows = computed(() => this.articles().map(newsArticleToTableRow));

  readonly feedBanner = computed(() => {
    const result = this.feedResult();
    return result ? formatNewsFeedBanner(result, this.atlas.selectedId()) : '';
  });

  readonly selectedArticle = computed(() => {
    const id = this.atlas.selectedArticleId();
    return this.articles().find((article) => article.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      const query = this.atlas.newsQuery();
      const region = this.atlas.newsRegion();
      const destinationId = this.atlas.selectedId();
      void fetchAtlasNews({ q: query, region, destinationId }).then((result) => {
        this.feedResult.set(result);
      });
    });
  }

  openArticle(article: ReturnType<typeof newsArticleToTableRow>): void {
    if (this.canSelectRows()) {
      this.atlas.selectedArticleId.set(article.id);
      return;
    }
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  }

  canSelectRows(): boolean {
    return this.atlas.userRole() !== 'viewer';
  }

  selectArticle(id: string): void {
    const article = this.tableRows().find((row) => row.id === id);
    if (article) {
      this.openArticle(article);
    }
  }
}
