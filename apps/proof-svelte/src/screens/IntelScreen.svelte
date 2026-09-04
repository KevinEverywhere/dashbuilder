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
  import { MOCK_NEWS, REGION_OPTIONS } from '../lib/atlas-utils';
  import type { AtlasUserRole } from '../lib/roles';

  let {
    userRole,
    newsQuery,
    newsRegion,
    selectedArticleId,
    onNewsQueryChange,
    onNewsRegionChange,
    onSelectedArticleIdChange,
  }: {
    userRole: AtlasUserRole;
    newsQuery: string;
    newsRegion: string;
    selectedArticleId: string;
    onNewsQueryChange?: (query: string) => void;
    onNewsRegionChange?: (region: string) => void;
    onSelectedArticleIdChange?: (id: string) => void;
  } = $props();

  const filtered = $derived(
    MOCK_NEWS.filter((article) => {
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
  <p>Hidden route — not in Destination Atlas nav. Palette news-discovery demo for source parity.</p>

  <RoleGatePanel
    gateLabel="Palette demo"
    currentRole={userRole}
    allowedRoles={['editor', 'admin']}
    statusText="Editor palette demo"
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
