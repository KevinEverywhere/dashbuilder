import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NewsArticleDetail } from '@rosettadash/angular/visual/news/article-detail';
import { MOCK_NEWS, REGION_OPTIONS } from '../lib/atlas-utils';
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
      <h2>Intel</h2>
      <p>Hidden route — not in Destination Atlas nav. Palette news-discovery demo for source parity.</p>

      <div class="da-stack">
        <da-role-gate-panel
          [gateLabel]="'Palette demo tools'"
          [currentRole]="atlas.userRole()"
          [allowedRoles]="['editor', 'admin']"
          statusText="Search and region filters enabled"
          hiddenStatusText="Viewer role can browse headlines only — switch to Editor to search and filter."
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
          <header class="rd-table__header"><span>News results</span></header>
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
              @for (article of filteredArticles(); track article.id) {
                <tr
                  [class.rd-table__row--selected]="article.id === atlas.selectedArticleId()"
                  [class.da-table-row--clickable]="canSelectRows()"
                  (click)="selectArticle(article.id)"
                >
                  <td>{{ article.headline }}</td>
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
          statusText="Full article summaries"
          hiddenStatusText="Article summaries are hidden for Viewer — headlines remain visible above."
        >
          <rd-news-article-detail title="Article detail">
            @if (selectedArticle(); as article) {
              <div class="da-detail-body">
                <p><strong>{{ article.headline }}</strong></p>
                <p>{{ article.source }} · {{ article.region }} · {{ article.published }}</p>
                <p>{{ article.summary }}</p>
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

  readonly filteredArticles = computed(() => {
    const query = this.atlas.newsQuery().toLowerCase();
    const region = this.atlas.newsRegion();
    return MOCK_NEWS.filter((article) => {
      const matchesQuery =
        !query ||
        article.headline.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query);
      const matchesRegion = !region || article.region === region;
      return matchesQuery && matchesRegion;
    });
  });

  readonly selectedArticle = computed(() => {
    const id = this.atlas.selectedArticleId();
    return (
      this.filteredArticles().find((article) => article.id === id) ??
      MOCK_NEWS.find((article) => article.id === id) ??
      null
    );
  });

  canSelectRows(): boolean {
    return this.atlas.userRole() !== 'viewer';
  }

  selectArticle(id: string): void {
    if (this.canSelectRows()) {
      this.atlas.selectedArticleId.set(id);
    }
  }
}
