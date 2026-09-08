<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  fetchNewsAdminStatus,
  refreshNewsCache,
  type NewsAdminStatus,
} from '@destination-atlas';
import RoleGatePanel from './RoleGatePanel.vue';
import type { AtlasUserRole } from '../lib/roles';
import { roleLabel } from '../lib/roles';

defineProps<{ userRole: AtlasUserRole }>();
const status = ref<NewsAdminStatus | null>(null);
const busy = ref(false);
const message = ref('');

onMounted(() => {
  void fetchNewsAdminStatus().then((next) => {
    status.value = next;
  });
});

async function handleRefresh(): Promise<void> {
  busy.value = true;
  message.value = '';
  status.value = await refreshNewsCache();
  busy.value = false;
  message.value = status.value
    ? 'News cache refreshed from RSS feeds.'
    : 'Could not refresh news cache.';
}
</script>

<template>
  <RoleGatePanel
    gate-label="News feeds (admin)"
    :current-role="userRole"
    :allowed-roles="['admin']"
    status-text="Admin can refresh the cached Google News RSS ingest"
    :hidden-status-text="`News feed administration is restricted to Admin (${roleLabel(userRole)} is read-only).`"
  >
    <p class="da-note">
      Builder API ingests free Google News RSS feeds and caches results for about 24 hours.
    </p>
    <ul v-if="status" class="da-news-admin-stats">
      <li>Cached articles: <strong>{{ status.articleCount }}</strong></li>
      <li>
        Last fetch:
        <strong>{{ status.fetchedAt ? new Date(status.fetchedAt).toLocaleString() : 'never' }}</strong>
      </li>
      <li>TTL: <strong>{{ Math.round(status.cacheTtlMs / 3_600_000) }}h</strong></li>
      <li>Feeds: <strong>{{ status.feeds.length }}</strong></li>
    </ul>
    <p v-else class="da-note">Could not read news admin status — is the builder API running?</p>
    <div class="da-byok-actions">
      <button type="button" class="rd-button" :disabled="busy" @click="handleRefresh">
        {{ busy ? 'Refreshing…' : 'Refresh news cache' }}
      </button>
    </div>
    <p v-if="message" class="da-byok-save-msg">{{ message }}</p>
  </RoleGatePanel>
</template>
