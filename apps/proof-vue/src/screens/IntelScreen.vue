<script lang="ts">
export const INTEL_SOURCE = `<IntelScreen userRole={userRole} newsQuery={newsQuery}>
  <NewsSearchBox />
  <NewsResultsTable rows={filteredArticles} />
</IntelScreen>`;
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { NewsArticleDetail } from '@rosettadash/vue/visual/news/article-detail';
import { NewsRegionSelect } from '@rosettadash/vue/visual/news/region-select';
import { NewsResultsTable } from '@rosettadash/vue/visual/news/results-table';
import { NewsSearchBox } from '@rosettadash/vue/visual/news/search-box';
import RoleGatePanel from '../components/RoleGatePanel.vue';
import { MOCK_NEWS, REGION_OPTIONS } from '../lib/atlas-utils';
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
}>();

const filtered = computed(() =>
  MOCK_NEWS.filter((article) => {
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
    <p>Hidden route — not in Destination Atlas nav. Palette news-discovery demo for source parity.</p>

    <RoleGatePanel
      gate-label="Palette demo"
      :current-role="userRole"
      :allowed-roles="['editor', 'admin']"
      status-text="Editor palette demo"
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
