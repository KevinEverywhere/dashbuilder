/**
 * Storybook mount for a live full-stack news demo (DAS-189).
 */

import { defaultComponentRegistry } from '@rosettadash/core';

import {
  builderNewsEndpoint,
  fetchAtlasNews,
  formatNewsFeedBanner,
  newsArticleToTableRow,
} from '../../libs/destination-atlas/src/data/news-feed.ts';
import { renderPaletteDemo } from './palette-catalog/palette-demos.js';

export interface FullStackNewsDemoOptions {
  destinationId?: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInfra(type: string, overrides: Record<string, unknown> = {}): string {
  const definition = defaultComponentRegistry.get(type);
  if (!definition) {
    return `<div class="preview-fallback"><code>${esc(type)}</code></div>`;
  }
  return renderPaletteDemo(type, definition, overrides);
}

function renderNewsRows(rows: ReturnType<typeof newsArticleToTableRow>[]): string {
  if (rows.length === 0) {
    return `<tr><td colspan="4" class="rd-full-stack-orders__empty">No headlines yet.</td></tr>`;
  }
  return rows
    .map(
      (row) =>
        `<tr><td>${esc(row.headline)}</td><td>${esc(row.source)}</td>` +
        `<td>${esc(row.region)}</td><td>${esc(row.published)}</td></tr>`,
    )
    .join('');
}

export function mountFullStackNewsDemo(options: FullStackNewsDemoOptions = {}): HTMLElement {
  const destinationId = options.destinationId ?? 'tokyo';
  const endpoint = builderNewsEndpoint();

  const root = document.createElement('div');
  root.className = 'rd-full-stack-orders';

  root.innerHTML = `
    <header class="rd-full-stack-orders__header">
      <h2 class="rd-full-stack-orders__title">Full-stack news (live API)</h2>
      <p class="rd-full-stack-orders__summary">
        News discovery UI → RosettaDash builder <code>GET /api/news</code> → Google News RSS
        ingest with ~24h cache. Destination-scoped lookup uses the active destination query.
      </p>
      <p class="rd-full-stack-orders__meta">
        Fetch target: <code>${esc(endpoint)}?destinationId=${esc(destinationId)}</code>
        (Storybook dev proxy maps <code>/builder-api</code> → builder :3000).
      </p>
    </header>
    <section class="rd-full-stack-orders__infra">
      <h3 class="rd-full-stack-orders__section-title">Export wizard context</h3>
      <div class="rd-full-stack-orders__infra-grid">
        ${renderInfra('infra.env', { envKeys: 'BUILDER_API_KEY' })}
        ${renderInfra('infra.server.nest', { globalPrefix: 'api', label: 'Nest builder API — live' })}
        ${renderInfra('visual.news.search-box', { placeholder: 'Search headlines…' })}
      </div>
    </section>
    <section class="rd-full-stack-orders__table">
      <h3 class="rd-full-stack-orders__section-title">Live headlines</h3>
      <p class="rd-full-stack-orders__status" data-full-stack-status>Loading news…</p>
      <div class="preview-table" data-full-stack-table>
        <div class="preview-table__header">
          <span>News results</span>
          <span class="preview-chip">GET /api/news</span>
        </div>
        <table>
          <thead>
            <tr><th>Headline</th><th>Source</th><th>Region</th><th>Published</th></tr>
          </thead>
          <tbody data-full-stack-rows>
            <tr><td colspan="4" class="rd-full-stack-orders__empty">…</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <aside class="rd-full-stack-orders__setup">
      <h3 class="rd-full-stack-orders__section-title">When the table is empty</h3>
      <ol class="rd-full-stack-orders__commands">
        <li><code>npm run storybook:react:live</code></li>
      </ol>
    </aside>
  `;

  const statusEl = root.querySelector<HTMLElement>('[data-full-stack-status]');
  const rowsEl = root.querySelector<HTMLElement>('[data-full-stack-rows]');

  void fetchAtlasNews({ destinationId }).then((result) => {
    if (!statusEl || !rowsEl) {
      return;
    }

    if (result.source === 'live') {
      statusEl.className = 'rd-full-stack-orders__status rd-full-stack-orders__status--live';
      statusEl.textContent = formatNewsFeedBanner(result, destinationId);
      rowsEl.innerHTML = renderNewsRows(result.articles.map(newsArticleToTableRow));
      return;
    }

    statusEl.className = 'rd-full-stack-orders__status rd-full-stack-orders__status--offline';
    statusEl.textContent = formatNewsFeedBanner(result, destinationId);
    rowsEl.innerHTML = renderNewsRows([]);
  });

  return root;
}
