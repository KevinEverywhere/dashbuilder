<script module lang="ts">
  export const INTEL_SOURCE = `<IntelScreen userRole={userRole} newsQuery={newsQuery}>
  <NewsSearchBox />
  <NewsResultsTable rows={filteredArticles} />
</IntelScreen>`;
</script>

<script lang="ts">
  import NewsArticleDetail from '@rosettadash/svelte/visual/news/article-detail';
  import NewsRegionSelect from '@rosettadash/svelte/visual/news/region-select';
  import NewsResultsTable from '@rosettadash/svelte/visual/news/results-table';
  import NewsSearchBox from '@rosettadash/svelte/visual/news/search-box';
  import RoleGatePanel from '../components/RoleGatePanel.svelte';
  import { useConsumerSecrets } from '../lib/consumer-secrets.svelte';
  import { MOCK_NEWS, REGION_OPTIONS } from '../lib/atlas-utils';
  import { fetchLiveNewsArticles, type LiveNewsArticle } from '../lib/news-api';
  import type { AtlasUserRole } from '../lib/roles';

  let {
    userRole,
    newsQuery,
    newsRegion,
    selectedArticleId,
    onNewsQueryChange,
    onNewsRegionChange,
    onSelectedArticleIdChange,
    onOpenSettings,
  }: {
    userRole: AtlasUserRole;
    newsQuery: string;
    newsRegion: string;
    selectedArticleId: string;
    onNewsQueryChange?: (query: string) => void;
    onNewsRegionChange?: (region: string) => void;
    onSelectedArticleIdChange?: (id: string) => void;
    onOpenSettings?: () => void;
  } = $props();

  const secrets = useConsumerSecrets();
  let liveArticles = $state<LiveNewsArticle[] | null>(null);
  let liveWarning = $state<string | null>(null);
  let liveMode = $state<'idle' | 'loading' | 'mock' | 'live'>('idle');

  $effect(() => {
    const apiKey = secrets.newsApiKey;
    const query = newsQuery;
    const region = newsRegion;

    if (!apiKey) {
      liveArticles = null;
      liveWarning = null;
      liveMode = 'mock';
      return;
    }

    liveMode = 'loading';
    let cancelled = false;

    void fetchLiveNewsArticles({ apiKey, query, region }).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result) {
        liveArticles = null;
        liveWarning =
          'NEWS_API_KEY is configured but the browser blocked the request (typical NewsAPI CORS). Showing mock headlines.';
        liveMode = 'mock';
        return;
      }
      if (result.articles.length) {
        liveArticles = result.articles;
        liveWarning = result.warning ?? null;
        liveMode = 'live';
        return;
      }
      liveArticles = null;
      liveWarning = result.warning ?? 'News API returned no results — showing mock headlines.';
      liveMode = 'mock';
    });

    return () => {
      cancelled = true;
    };
  });

  const articleSource = $derived(
    liveMode === 'live' && liveArticles?.length ? liveArticles : MOCK_NEWS,
  );

  const filtered = $derived(
    articleSource.filter((article) => {
      const matchesQuery =
        !newsQuery || article.headline.toLowerCase().includes(newsQuery.toLowerCase());
      const matchesRegion = !newsRegion || article.region === newsRegion;
      return matchesQuery && matchesRegion;
    }),
  );

  const selectedArticle = $derived(filtered.find((a) => a.id === selectedArticleId));
</script>

<section class="da-panel">
  <h2>Intel</h2>
  <p>Regional news discovery with optional live NewsAPI when a key is configured in Settings.</p>

  <RoleGatePanel
    gateLabel="News discovery"
    currentRole={userRole}
    allowedRoles={['editor', 'admin']}
    statusText="Editor news tools"
    hiddenStatusText="Intel search is hidden for Viewer role."
  >
    <div class="da-stack da-stack--2">
      <NewsSearchBox value={newsQuery} onSearch={(value) => onNewsQueryChange?.(value)} />
      <NewsRegionSelect
        label="Region"
        placeholder="All regions"
        options={REGION_OPTIONS}
        value={newsRegion}
        onChange={(value) => onNewsRegionChange?.(value)}
      />
    </div>
  </RoleGatePanel>

  {#if !secrets.newsApiKey}
    <p class="da-note da-byok-cta">
      Using mock headlines.
      <button type="button" class="da-locale-link" onclick={() => onOpenSettings?.()}>
        Add NEWS_API_KEY in Settings → Integrations
      </button>
    </p>
  {:else if liveWarning}
    <p class="da-note">{liveWarning}</p>
  {/if}

  <div class="da-intel-layout">
    <NewsResultsTable
      title="News results"
      rows={filtered.map((article) => ({
        id: article.id,
        headline: article.headline,
        source: article.source,
        published: article.published,
      }))}
      selectedRowId={selectedArticleId}
      onRowSelect={(id) => onSelectedArticleIdChange?.(id)}
    />
    {#if selectedArticle}
      <NewsArticleDetail
        headline={selectedArticle.headline}
        source={selectedArticle.source}
        published={selectedArticle.published}
        summary={selectedArticle.summary}
      />
    {/if}
  </div>
</section>
