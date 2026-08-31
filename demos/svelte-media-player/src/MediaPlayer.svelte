<script lang="ts">
  import FlexLayout from '@rosettadash/svelte/layout/flex';
  import DetailPanel from '@rosettadash/svelte/visual/detail';
  import SelectInput from '@rosettadash/svelte/visual/input/select';
  import KpiCard from '@rosettadash/svelte/visual/kpi';
  import YoutubeEmbed from '@rosettadash/svelte/visual/media/youtube-embed';
  import StatusBadge from '@rosettadash/svelte/visual/plugin/status-badge';
  import { getSampleVideo, SAMPLE_VIDEOS, watchUrl } from './videos';
  import './MediaPlayer.css';

  let { className }: { className?: string } = $props();

  let selectedId = $state(SAMPLE_VIDEOS[0].id);

  const selected = $derived(getSampleVideo(selectedId) ?? SAMPLE_VIDEOS[0]);
  const selectOptions = $derived(
    SAMPLE_VIDEOS.map((video) => ({
      value: video.id,
      label: `${video.title} · ${video.continentLabel}`,
    })),
  );
  const sourceUrl = $derived(watchUrl(selected.videoId));
  const rootClass = $derived(['rd-media-player', className].filter(Boolean).join(' '));

  function handleVideoChange(value: string) {
    if (!value || !getSampleVideo(value)) {
      return;
    }
    selectedId = value;
  }
</script>

<FlexLayout title="Media player" direction="column" gap={10} className={rootClass}>
  <SelectInput
    label="Source"
    options={selectOptions}
    bind:value={selectedId}
    onChange={handleVideoChange}
  />
  {#key selected.videoId}
    <YoutubeEmbed
      className="rd-media-player__video"
      videoId={selected.videoId}
      title={selected.title}
    />
  {/key}
  <FlexLayout direction="row" gap={8} density="compact">
    <KpiCard title={selected.continentLabel} value={selected.title} delta={selected.videoId} />
    <StatusBadge statusText="Ready" tone="success" />
  </FlexLayout>
  <DetailPanel
    className="rd-media-player__source-panel"
    title={selected.title}
    emptyMessage="Choose a source"
  >
    <p class="rd-media-player__source">
      <a href={sourceUrl}>{sourceUrl}</a>
    </p>
  </DetailPanel>
</FlexLayout>
