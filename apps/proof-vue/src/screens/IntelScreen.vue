<script lang="ts">
export const INTEL_SOURCE = `<IntelScreen userRole={userRole} selectedId={selectedId} newsQuery={newsQuery}>
  <NewsSearchBox />
  <NewsResultsTable rows={filteredArticles} />
</IntelScreen>`;
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  destinationNewsLabel,
  fetchAtlasNews,
  formatNewsFeedBanner,
  newsArticleToTableRow,
  type NewsFeedResult,
} from '@destination-atlas';
import { NewsArticleDetail } from '@rosettadash/vue/visual/news/article-detail';
import { NewsRegionSelect } from '@rosettadash/vue/visual/news/region-select';
import { NewsResultsTable } from '@rosettadash/vue/visual/news/results-table';
import { NewsSearchBox } from '@rosettadash/vue/visual/news/search-box';
import RoleGatePanel from '../components/RoleGatePanel.vue';
import { REGION_OPTIONS } from '../lib/atlas-utils';
import type { AtlasUserRole } from '../lib/roles';

const props = defineProps<{
  userRole: AtlasUserRole;
  selectedId: string;
  newsQuery: string;
  newsRegion: string;
  selectedArticleId: string;
}>();

const emit = defineEmits<{
  'update:newsQuery': [string];
  'update:newsRegion': [string];
  'update:selectedArticleId': [string];
}>();

const feedResult = ref<NewsFeedResult | null>(null);

async function loadNews(): Promise<void> {
  feedResult.value = await fetchAtlasNews({
    q: props.newsQuery,
    region: props.newsRegion,
    destinationId: props.selectedId,
  });
}

watch(
  () => [props.newsQuery, props.newsRegion, props.selectedId] as const,
  () => {
    void loadNews();
  },
  { immediate: true },
);

const articles = computed(() => feedResult.value?.articles ?? []);
const destinationLabel = computed(() => destinationNewsLabel(props.selectedId));
const selectedArticle = computed(() => articles.value.find((a) => a.id === props.selectedArticleId));
</script>

<template>
  <section class="da-panel">
    <h2>News</h2>
    <p>
      Destination-scoped headlines from Google News RSS via the builder API (~24h cache).
      <template v-if="destinationLabel"> Active destination: {{ destinationLabel }}.</template>
    </p>
    <p
      v-if="feedResult"
      class="da-parity-banner"
      :class="`da-parity-banner--${feedResult.source}`"
      role="status"
    >
      {{ formatNewsFeedBanner(feedResult, selectedId) }}
    </p>
    <p v-else class="da-note" role="status">Loading news…</p>

    <RoleGatePanel
      gate-label="News search tools"
      :current-role="userRole"
      :allowed-roles="['editor', 'admin']"
      hide-when-denied
      status-text="Search and region filters enabled"
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

    <div class="da-intel-layout">
      <NewsResultsTable
        title="News results"
        :rows="articles.map(newsArticleToTableRow)"
        :selected-row-id="selectedArticleId"
        :link-headlines="userRole === 'viewer'"
        @row-select="(id) => emit('update:selectedArticleId', id)"
      />
      <RoleGatePanel
        gate-label="Article detail"
        :current-role="userRole"
        :allowed-roles="['editor', 'admin']"
        hide-when-denied
        status-text="Full article summaries"
      >
        <NewsArticleDetail title="Article detail">
          <div v-if="selectedArticle" class="da-detail-body">
            <p><strong>{{ selectedArticle.headline }}</strong></p>
            <p>{{ selectedArticle.source }} · {{ selectedArticle.region }} · {{ selectedArticle.publishedAt }}</p>
            <p>{{ selectedArticle.summary }}</p>
            <p v-if="selectedArticle.url">
              <a :href="selectedArticle.url" target="_blank" rel="noreferrer">Read source</a>
            </p>
          </div>
          <p v-else class="da-detail-body">Select a headline to read the summary.</p>
        </NewsArticleDetail>
      </RoleGatePanel>
    </div>
  </section>
</template>
