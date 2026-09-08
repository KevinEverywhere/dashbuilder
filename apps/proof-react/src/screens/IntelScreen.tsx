import { useEffect, useMemo, useState } from 'react';
import { RoleGate } from '@rosettadash/react/domain/role-gate';
import { NewsArticleDetail } from '@rosettadash/react/visual/news/article-detail';
import { NewsRegionSelect } from '@rosettadash/react/visual/news/region-select';
import { NewsResultsTable } from '@rosettadash/react/visual/news/results-table';
import { NewsSearchBox } from '@rosettadash/react/visual/news/search-box';
import {
  destinationNewsLabel,
  fetchAtlasNews,
  formatNewsFeedBanner,
  newsArticleToTableRow,
  type NewsArticle,
  type NewsFeedResult,
} from '@destination-atlas';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import { REGION_OPTIONS } from '../lib/atlas-utils';

export const INTEL_SOURCE = `<IntelScreen userRole={userRole} selectedId={selectedId} newsQuery={newsQuery}>
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
> & {
  selectedId: string;
};

export function IntelScreen({
  userRole,
  selectedId,
  newsQuery,
  setNewsQuery,
  newsRegion,
  setNewsRegion,
  selectedArticleId,
  setSelectedArticleId,
}: Props) {
  const [feedResult, setFeedResult] = useState<NewsFeedResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchAtlasNews({
      q: newsQuery,
      region: newsRegion,
      destinationId: selectedId,
    }).then((result) => {
      if (!cancelled) {
        setFeedResult(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [newsQuery, newsRegion, selectedId]);

  const articles = feedResult?.articles ?? [];
  const selected = useMemo(
    () => articles.find((article) => article.id === selectedArticleId),
    [articles, selectedArticleId],
  );
  const destinationLabel = destinationNewsLabel(selectedId);

  return (
    <section className="da-panel">
      <h2>News</h2>
      <p>
        Destination-scoped headlines from Google News RSS via the builder API (~24h cache).
        {destinationLabel ? ` Active destination: ${destinationLabel}.` : null}
      </p>
      {feedResult ? (
        <p
          className={`da-parity-banner da-parity-banner--${feedResult.source}`}
          role="status"
        >
          {formatNewsFeedBanner(feedResult, selectedId)}
        </p>
      ) : (
        <p className="da-note" role="status">
          Loading news…
        </p>
      )}
      <div className="da-stack">
        <RoleGate
          label="News search tools"
          currentRole={userRole}
          allowedRoles={['editor', 'admin']}
          hideWhenDenied
          statusText="Search and region filters enabled"
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
          rows={articles.map(newsArticleToTableRow)}
          selectedRowId={selectedArticleId}
          linkHeadlines={userRole === 'viewer'}
          onRowSelect={userRole === 'viewer' ? undefined : setSelectedArticleId}
        />
        <RoleGate
          label="Article detail"
          currentRole={userRole}
          allowedRoles={['editor', 'admin']}
          hideWhenDenied
          statusText="Full article summaries"
        >
          <NewsArticleDetail title="Article detail">
            {selected ? (
              <ArticleBody article={selected} />
            ) : (
              <p className="da-detail-body">Select a headline to read the summary.</p>
            )}
          </NewsArticleDetail>
        </RoleGate>
      </div>
    </section>
  );
}

function ArticleBody({ article }: { article: NewsArticle }) {
  return (
    <div className="da-detail-body">
      <p>
        <strong>{article.headline}</strong>
      </p>
      <p>
        {article.source} · {article.region} · {article.publishedAt}
      </p>
      <p>{article.summary}</p>
      {article.url ? (
        <p>
          <a href={article.url} target="_blank" rel="noreferrer">
            Read source
          </a>
        </p>
      ) : null}
    </div>
  );
}
