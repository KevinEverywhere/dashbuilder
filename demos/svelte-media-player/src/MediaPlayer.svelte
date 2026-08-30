<script lang="ts">
  import FlexLayout from '@rosettadash/svelte/layout/flex';
  import Timer from '@rosettadash/svelte/logic/timer';
  import DetailPanel from '@rosettadash/svelte/visual/detail';
  import SelectInput from '@rosettadash/svelte/visual/input/select';
  import KpiCard from '@rosettadash/svelte/visual/kpi';
  import StatusBadge from '@rosettadash/svelte/visual/plugin/status-badge';
  import { formatPlaybackTime, getSampleVideo, SAMPLE_VIDEOS } from './videos';
  import './MediaPlayer.css';

  let { className }: { className?: string } = $props();

  let selectedId = $state(SAMPLE_VIDEOS[0].id);
  let currentTime = $state(0);
  let paused = $state(true);
  let duration = $state(0);
  let tickCount = $state(0);

  const selected = $derived(getSampleVideo(selectedId) ?? SAMPLE_VIDEOS[0]);
  const selectOptions = $derived(SAMPLE_VIDEOS.map((video) => ({ value: video.id, label: video.title })));
  const timeLabel = $derived(formatPlaybackTime(currentTime));
  const durationLabel = $derived(
    Number.isFinite(duration) && duration > 0 ? formatPlaybackTime(duration) : '—',
  );
  const rootClass = $derived(['rd-media-player', className].filter(Boolean).join(' '));

  function handleVideoChange(value: string) {
    if (!value || !getSampleVideo(value)) {
      return;
    }
    selectedId = value;
    currentTime = 0;
    duration = 0;
    paused = true;
    tickCount = 0;
  }
</script>

<FlexLayout title="Media player" direction="column" gap={10} className={rootClass}>
  <SelectInput
    label="Source"
    options={selectOptions}
    bind:value={selectedId}
    onChange={handleVideoChange}
  />
  {#key selected.url}
    <video
      class="rd-media-player__video"
      src={selected.url}
      controls
      playsinline
      aria-label={selected.title}
      bind:currentTime
      bind:paused
      bind:duration
      ontimeupdate={() => {
        tickCount += 1;
      }}
    >
      <track kind="captions" />
    </video>
  {/key}
  <FlexLayout direction="row" gap={8}>
    <KpiCard title="Current time" value={timeLabel} delta={durationLabel} />
    <StatusBadge
      statusText={paused ? 'Paused' : 'Playing'}
      tone={paused ? 'neutral' : 'success'}
    />
  </FlexLayout>
  <Timer label="Time updates" mode="interval" tickCount={tickCount} />
  <DetailPanel title={selected.title} emptyMessage="Choose a source">
    <p class="rd-media-player__source">
      <a href={selected.url}>{selected.url}</a>
    </p>
  </DetailPanel>
</FlexLayout>
