import { useEffect, useMemo, useState } from 'react';
import { RoleGate } from '@rosettadash/react/domain/role-gate';
import { NewsArticleDetail } from '@rosettadash/react/visual/news/article-detail';
import { NewsRegionSelect } from '@rosettadash/react/visual/news/region-select';
import { NewsResultsTable } from '@rosettadash/react/visual/news/results-table';
import { NewsSearchBox } from '@rosettadash/react/visual/news/search-box';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import { useConsumerSecrets } from '../state/consumer-secrets-context';
import { MOCK_NEWS, REGION_OPTIONS } from '../lib/atlas-utils';
import { fetchLiveNewsArticles, type LiveNewsArticle } from '../lib/news-api';

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
  | 'setScreen'
  | 'setHighlightTarget'
>;

export function IntelScreen({
  userRole,
  newsQuery,
  setNewsQuery,
  newsRegion,
  setNewsRegion,
  selectedArticleId,
  setSelectedArticleId,
  setScreen,
  setHighlightTarget,
}: Props) {
  const secrets = useConsumerSecrets();
  const newsApiKey = secrets.newsApiKey;
  const [liveArticles, setLiveArticles] = useState<LiveNewsArticle[] | null>(null);
  const [liveWarning, setLiveWarning] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState<'idle' | 'loading' | 'mock' | 'live'>('idle');

  useEffect(() => {
    if (!newsApiKey) {
      setLiveArticles(null);
      setLiveWarning(null);
      setLiveMode('mock');
      return;
    }

    let cancelled = false;
    setLiveMode('loading');
    void fetchLiveNewsArticles({ apiKey: newsApiKey, query: newsQuery, region: newsRegion }).then(
      (result) => {
        if (cancelled) {
          return;
        }
        if (!result) {
          setLiveArticles(null);
          setLiveWarning(
            'NEWS_API_KEY is configured but the browser blocked the request (typical NewsAPI CORS). Showing mock headlines — use a server proxy in production.',
          );
          setLiveMode('mock');
          return;
        }
        if (result.articles.length) {
          setLiveArticles(result.articles);
          setLiveWarning(result.warning ?? null);
          setLiveMode('live');
          return;
        }
        setLiveArticles(null);
        setLiveWarning(result.warning ?? 'News API returned no results — showing mock headlines.');
        setLiveMode('mock');
      },
    );

    return () => {
      cancelled = true;
    };
  }, [newsApiKey, newsQuery, newsRegion]);

  const articleSource = liveMode === 'live' && liveArticles?.length ? liveArticles : MOCK_NEWS;

  const filtered = useMemo(
    () =>
      articleSource.filter((article) => {
        const matchesQuery =
          !newsQuery ||
          article.headline.toLowerCase().includes(newsQuery.toLowerCase()) ||
          article.summary.toLowerCase().includes(newsQuery.toLowerCase());
        const matchesRegion = !newsRegion || article.region === newsRegion;
        return matchesQuery && matchesRegion;
      }),
    [articleSource, newsQuery, newsRegion],
  );

  const selected = filtered.find((article) => article.id === selectedArticleId) ??
    articleSource.find((article) => article.id === selectedArticleId);

  const openIntegrationsSettings = () => {
    setHighlightTarget('integrations');
    setScreen('settings');
  };

  return (
    <section className="da-panel">
      <h2>Intel</h2>
      <p>Regional news discovery with search, region filter, results, and article detail.</p>
      {newsApiKey ? (
        <p className="da-note">
          {liveMode === 'loading'
            ? 'Fetching live headlines…'
            : liveMode === 'live'
              ? 'Live News API headlines (BYOK).'
              : 'BYOK key present — mock headlines used as fallback.'}
          {liveWarning ? <> {liveWarning}</> : null}
        </p>
      ) : (
        <p className="da-note da-byok-cta">
          Showing mock headlines. Add a News API key in{' '}
          <button type="button" className="da-locale-link" onClick={openIntegrationsSettings}>
            Settings → Integrations
          </button>{' '}
          for live fetch (may require a server proxy due to CORS).
        </p>
      )}
      <div className="da-stack">
        <RoleGate
          label="News discovery tools"
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
