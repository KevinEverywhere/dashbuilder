<script lang="ts">
export const INTEL_SOURCE = `<IntelScreen userRole={userRole} newsQuery={newsQuery}>
  <NewsSearchBox />
  <NewsResultsTable rows={filteredArticles} />
</IntelScreen>`;
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NewsArticleDetail } from '@rosettadash/vue/visual/news/article-detail';
import { NewsRegionSelect } from '@rosettadash/vue/visual/news/region-select';
import { NewsResultsTable } from '@rosettadash/vue/visual/news/results-table';
import { NewsSearchBox } from '@rosettadash/vue/visual/news/search-box';
import RoleGatePanel from '../components/RoleGatePanel.vue';
import { useConsumerSecrets } from '../composables/use-consumer-secrets';
import { MOCK_NEWS, REGION_OPTIONS } from '../lib/atlas-utils';
import { fetchLiveNewsArticles, type LiveNewsArticle } from '../lib/news-api';
import type { AtlasUserRole } from '../lib/roles';

const props = defineProps<{
  userRole: AtlasUserRole;
  newsQuery: string;
  newsRegion: string;
  selectedArticleId: string;
}>();

const emit = defineEmits<{
  'update:newsQuery': [string];
  'update:newsRegion': [string];
  'update:selectedArticleId': [string];
  openSettings: [];
}>();

const secrets = useConsumerSecrets();
const liveArticles = ref<LiveNewsArticle[] | null>(null);
const liveWarning = ref<string | null>(null);
const liveMode = ref<'idle' | 'loading' | 'mock' | 'live'>('idle');

watch(
  () => [secrets.newsApiKey, props.newsQuery, props.newsRegion] as const,
  ([apiKey, query, region]) => {
    if (!apiKey) {
      liveArticles.value = null;
      liveWarning.value = null;
      liveMode.value = 'mock';
      return;
    }
    liveMode.value = 'loading';
    void fetchLiveNewsArticles({ apiKey, query, region }).then((result) => {
      if (!result) {
        liveArticles.value = null;
        liveWarning.value =
          'NEWS_API_KEY is configured but the browser blocked the request (typical NewsAPI CORS). Showing mock headlines.';
        liveMode.value = 'mock';
        return;
      }
      if (result.articles.length) {
        liveArticles.value = result.articles;
        liveWarning.value = result.warning ?? null;
        liveMode.value = 'live';
        return;
      }
      liveArticles.value = null;
      liveWarning.value = result.warning ?? 'News API returned no results — showing mock headlines.';
      liveMode.value = 'mock';
    });
  },
  { immediate: true },
);

const articleSource = computed(() =>
  liveMode.value === 'live' && liveArticles.value?.length ? liveArticles.value : MOCK_NEWS,
);

const filtered = computed(() =>
  articleSource.value.filter((article) => {
    const matchesQuery =
      !props.newsQuery || article.headline.toLowerCase().includes(props.newsQuery.toLowerCase());
    const matchesRegion = !props.newsRegion || article.region === props.newsRegion;
    return matchesQuery && matchesRegion;
  }),
);

const selectedArticle = computed(() => filtered.value.find((a) => a.id === props.selectedArticleId));
</script>

<template>
  <section class="da-panel">
    <h2>Intel</h2>
    <p>Regional news discovery with optional live NewsAPI when a key is configured in Settings.</p>

    <RoleGatePanel
      gate-label="News discovery"
      :current-role="userRole"
      :allowed-roles="['editor', 'admin']"
      status-text="Editor news tools"
      hidden-status-text="Intel search is hidden for Viewer role."
    >
      <div class="da-stack da-stack--2">
        <NewsSearchBox :value="newsQuery" @search="emit('update:newsQuery', $event)" />
        <NewsRegionSelect
          label="Region"
          placeholder="All regions"
          :options="REGION_OPTIONS"
          :value="newsRegion"
          @change="emit('update:newsRegion', $event)"
        />
      </div>
    </RoleGatePanel>

    <p v-if="!secrets.newsApiKey" class="da-note da-byok-cta">
      Using mock headlines.
      <button type="button" class="da-locale-link" @click="emit('openSettings')">
        Add NEWS_API_KEY in Settings → Integrations
      </button>
    </p>
    <p v-else-if="liveWarning" class="da-note">{{ liveWarning }}</p>

    <div class="da-intel-layout">
      <NewsResultsTable
        :rows="
          filtered.map((article) => ({
            id: article.id,
            headline: article.headline,
            source: article.source,
            published: article.published,
          }))
        "
        :selected-row-id="selectedArticleId"
        @row-select="emit('update:selectedArticleId', $event)"
      />
      <NewsArticleDetail
        v-if="selectedArticle"
        :headline="selectedArticle.headline"
        :source="selectedArticle.source"
        :published="selectedArticle.published"
        :summary="selectedArticle.summary"
      />
    </div>
  </section>
</template>
