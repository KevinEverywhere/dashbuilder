<script module lang="ts">
  export const INTEL_SOURCE = `<IntelScreen userRole={userRole} selectedId={selectedId} newsQuery={newsQuery}>
  <NewsSearchBox />
  <NewsResultsTable rows={filteredArticles} />
</IntelScreen>`;
</script>

<script lang="ts">
  import {
    destinationNewsLabel,
    fetchAtlasNews,
    formatNewsFeedBanner,
    newsArticleToTableRow,
    type NewsFeedResult,
  } from '@destination-atlas';
  import NewsArticleDetail from '@rosettadash/svelte/visual/news/article-detail';
  import NewsRegionSelect from '@rosettadash/svelte/visual/news/region-select';
  import NewsResultsTable from '@rosettadash/svelte/visual/news/results-table';
  import NewsSearchBox from '@rosettadash/svelte/visual/news/search-box';
  import RoleGatePanel from '../components/RoleGatePanel.svelte';
  import { REGION_OPTIONS } from '../lib/atlas-utils';
  import type { AtlasUserRole } from '../lib/roles';

  let {
    userRole,
    selectedId,
    newsQuery,
    newsRegion,
    selectedArticleId,
    onNewsQueryChange,
    onNewsRegionChange,
    onSelectedArticleIdChange,
  }: {
    userRole: AtlasUserRole;
    selectedId: string;
    newsQuery: string;
    newsRegion: string;
    selectedArticleId: string;
    onNewsQueryChange?: (query: string) => void;
    onNewsRegionChange?: (region: string) => void;
    onSelectedArticleIdChange?: (id: string) => void;
  } = $props();

  let feedResult = $state<NewsFeedResult | null>(null);

  $effect(() => {
    const q = newsQuery;
    const region = newsRegion;
    const dest = selectedId;
    void fetchAtlasNews({ q, region, destinationId: dest }).then((result) => {
      feedResult = result;
    });
  });

  const articles = $derived(feedResult?.articles ?? []);
  const destinationLabel = $derived(destinationNewsLabel(selectedId));
  const selectedArticle = $derived(articles.find((a) => a.id === selectedArticleId));
</script>

<section class="da-panel">
  <h2>News</h2>
  <p>
    Destination-scoped headlines from Google News RSS via the builder API (~24h cache).
    {#if destinationLabel} Active destination: {destinationLabel}.{/if}
  </p>
  {#if feedResult}
    <p class="da-parity-banner da-parity-banner--{feedResult.source}" role="status">
      {formatNewsFeedBanner(feedResult, selectedId)}
    </p>
  {:else}
    <p class="da-note" role="status">Loading news…</p>
  {/if}

  <RoleGatePanel
    gateLabel="News search tools"
    currentRole={userRole}
    allowedRoles={['editor', 'admin']}
    hideWhenDenied
    statusText="Search and region filters enabled"
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

  <div class="da-intel-layout">
    <NewsResultsTable
      title="News results"
      rows={articles.map(newsArticleToTableRow)}
      selectedRowId={selectedArticleId}
      linkHeadlines={userRole === 'viewer'}
      onRowSelect={(id) => onSelectedArticleIdChange?.(id)}
    />
    <RoleGatePanel
      gateLabel="Article detail"
      currentRole={userRole}
      allowedRoles={['editor', 'admin']}
      hideWhenDenied
      statusText="Full article summaries"
    >
      <NewsArticleDetail title="Article detail">
        {#if selectedArticle}
          <div class="da-detail-body">
            <p><strong>{selectedArticle.headline}</strong></p>
            <p>{selectedArticle.source} · {selectedArticle.region} · {selectedArticle.publishedAt}</p>
            <p>{selectedArticle.summary}</p>
            {#if selectedArticle.url}
              <p><a href={selectedArticle.url} target="_blank" rel="noreferrer">Read source</a></p>
            {/if}
          </div>
        {:else}
          <p class="da-detail-body">Select a headline to read the summary.</p>
        {/if}
      </NewsArticleDetail>
    </RoleGatePanel>
  </div>
</section>
