import { useMemo } from 'react';
import { RoleGate } from '@rosettadash/react/domain/role-gate';
import { NewsArticleDetail } from '@rosettadash/react/visual/news/article-detail';
import { NewsRegionSelect } from '@rosettadash/react/visual/news/region-select';
import { NewsResultsTable } from '@rosettadash/react/visual/news/results-table';
import { NewsSearchBox } from '@rosettadash/react/visual/news/search-box';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import { MOCK_NEWS, REGION_OPTIONS } from '../lib/atlas-utils';

export const INTEL_SOURCE = `<IntelScreen userRole={userRole} newsQuery={newsQuery}>
  <RoleGate currentRole={userRole} allowedRoles={['editor', 'admin']}>
    <NewsSearchBox value={newsQuery} onSearch={setNewsQuery} />
    <NewsRegionSelect value={newsRegion} />
  </RoleGate>
  <NewsResultsTable rows={filteredArticles} selectedRowId={selectedArticleId} />
</IntelScreen>`;

type Props = Pick<
  AtlasContext,
  | 'userRole'
  | 'newsQuery'
  | 'setNewsQuery'
  | 'newsRegion'
  | 'setNewsRegion'
  | 'selectedArticleId'
  | 'setSelectedArticleId'
>;

export function IntelScreen({
  userRole,
  newsQuery,
  setNewsQuery,
  newsRegion,
  setNewsRegion,
  selectedArticleId,
  setSelectedArticleId,
}: Props) {
  const filtered = useMemo(
    () =>
      MOCK_NEWS.filter((article) => {
        const matchesQuery =
          !newsQuery ||
          article.headline.toLowerCase().includes(newsQuery.toLowerCase()) ||
          article.summary.toLowerCase().includes(newsQuery.toLowerCase());
        const matchesRegion = !newsRegion || article.region === newsRegion;
        return matchesQuery && matchesRegion;
      }),
    [newsQuery, newsRegion],
  );

  const selected = filtered.find((article) => article.id === selectedArticleId) ??
    MOCK_NEWS.find((article) => article.id === selectedArticleId);

  return (
    <section className="da-panel">
      <h2>Intel</h2>
      <p>Hidden route — not in Destination Atlas nav. Palette news-discovery demo for source parity.</p>
      <div className="da-stack">
        <RoleGate
          label="Palette demo tools"
          currentRole={userRole}
          allowedRoles={['editor', 'admin']}
          statusText="Search and region filters enabled"
          hiddenStatusText="Viewer role can browse headlines only — switch to Editor to search and filter."
        >
          <div className="da-stack da-stack--2">
            <NewsSearchBox
              label="Search news"
              placeholder="Search headlines…"
              value={newsQuery}
              onSearch={setNewsQuery}
            />
            <NewsRegionSelect
              label="Region"
              placeholder="All regions"
              options={REGION_OPTIONS}
              value={newsRegion}
              onChange={setNewsRegion}
            />
          </div>
        </RoleGate>
        <NewsResultsTable
          title="News results"
          rows={filtered.map((article) => ({
            id: article.id,
            headline: article.headline,
            source: article.source,
            region: article.region,
            published: article.published,
          }))}
          selectedRowId={selectedArticleId}
          onRowSelect={userRole === 'viewer' ? undefined : setSelectedArticleId}
        />
        <RoleGate
          label="Article detail"
          currentRole={userRole}
          allowedRoles={['editor', 'admin']}
          statusText="Full article summaries"
          hiddenStatusText="Article summaries are hidden for Viewer — headlines remain visible above."
        >
          <NewsArticleDetail title="Article detail">
            {selected ? (
              <div className="da-detail-body">
                <p>
                  <strong>{selected.headline}</strong>
                </p>
                <p>
                  {selected.source} · {selected.region} · {selected.published}
                </p>
                <p>{selected.summary}</p>
              </div>
            ) : (
              <p className="da-detail-body">Select a headline to read the summary.</p>
            )}
          </NewsArticleDetail>
        </RoleGate>
      </div>
    </section>
  );
}
