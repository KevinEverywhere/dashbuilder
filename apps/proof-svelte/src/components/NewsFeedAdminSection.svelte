<script lang="ts">
  import {
    fetchNewsAdminStatus,
    refreshNewsCache,
    type NewsAdminStatus,
  } from '@destination-atlas';
  import RoleGatePanel from './RoleGatePanel.svelte';
  import { roleLabel, type AtlasUserRole } from '../lib/roles';

  let { userRole }: { userRole: AtlasUserRole } = $props();

  let status = $state<NewsAdminStatus | null>(null);
  let busy = $state(false);
  let message = $state('');

  $effect(() => {
    void fetchNewsAdminStatus().then((next) => {
      status = next;
    });
  });

  async function handleRefresh(): Promise<void> {
    busy = true;
    message = '';
    status = await refreshNewsCache();
    busy = false;
    message = status ? 'News cache refreshed from RSS feeds.' : 'Could not refresh news cache.';
  }
</script>

<RoleGatePanel
  gateLabel="News feeds (admin)"
  currentRole={userRole}
  allowedRoles={['admin']}
  statusText="Admin can refresh the cached Google News RSS ingest"
  hiddenStatusText={`News feed administration is restricted to Admin (${roleLabel(userRole)} is read-only).`}
>
  <p class="da-note">
    Builder API ingests free Google News RSS feeds and caches results for about 24 hours.
  </p>
  {#if status}
    <ul class="da-news-admin-stats">
      <li>Cached articles: <strong>{status.articleCount}</strong></li>
      <li>
        Last fetch:
        <strong>{status.fetchedAt ? new Date(status.fetchedAt).toLocaleString() : 'never'}</strong>
      </li>
      <li>TTL: <strong>{Math.round(status.cacheTtlMs / 3_600_000)}h</strong></li>
      <li>Feeds: <strong>{status.feeds.length}</strong></li>
    </ul>
  {:else}
    <p class="da-note">Could not read news admin status — is the builder API running?</p>
  {/if}
  <div class="da-byok-actions">
    <button type="button" class="rd-button" disabled={busy} onclick={() => void handleRefresh()}>
      {busy ? 'Refreshing…' : 'Refresh news cache'}
    </button>
  </div>
  {#if message}
    <p class="da-byok-save-msg">{message}</p>
  {/if}
</RoleGatePanel>
