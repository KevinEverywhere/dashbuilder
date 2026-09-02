<script lang="ts">
  import {
    AUTHORING_RECORDING_INTERRUPT_COPY,
    authoringRecordingInterruptConfirmLabel,
    type AuthoringRecordRange,
    type AuthoringRecordingInterruptPrompt,
  } from '@rosettadash/core';
  import type { AuthoringViewportHandle } from '../lib/authoring-viewport';
  import {
    beginRecordingInterrupt,
    discardInProgressRecording,
  } from '../lib/authoring-playback-interrupt';

  let {
    viewport = null,
    hint,
    disabled = false,
    recordRange = null,
    onRecordRangeChange,
    onPreviewRecordingChange,
    onResetView,
    onPlaybackStop,
  }: {
    viewport?: AuthoringViewportHandle | null;
    hint?: string;
    disabled?: boolean;
    recordRange?: AuthoringRecordRange | null;
    onRecordRangeChange?: (range: AuthoringRecordRange | null) => void;
    onPreviewRecordingChange?: (blob: Blob | null) => void;
    onResetView?: () => void;
    onPlaybackStop?: () => void;
  } = $props();

  function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const whole = Math.floor(seconds);
    const mins = Math.floor(whole / 60);
    const secs = whole % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function rangeStyle(startSec: number, endSec: number, duration: number) {
    if (duration <= 0) {
      return { left: '0%', width: '0%' };
    }
    const left = Math.max(0, Math.min(100, (startSec / duration) * 100));
    const width = Math.max(0, Math.min(100 - left, ((endSec - startSec) / duration) * 100));
    return { left: `${left}%`, width: `${width}%` };
  }

  let currentTime = $state(0);
  let duration = $state(0);
  let paused = $state(true);
  let recording = $state(false);
  let recordingStartSec = $state<number | null>(null);
  let saveUrl = $state<string | null>(null);
  let interrupt = $state<AuthoringRecordingInterruptPrompt | null>(null);

  const scrubValue = $derived(Math.min(currentTime, duration || 0));

  const displayRange = $derived.by((): AuthoringRecordRange | null => {
    if (recordRange) {
      return recordRange;
    }
    const start = recordingStartSec;
    if (recording && start !== null) {
      return { startSec: start, endSec: Math.max(start, currentTime) };
    }
    return null;
  });

  const segmentStyle = $derived.by(() => {
    const range = displayRange;
    if (!range) {
      return { left: '0%', width: '0%' };
    }
    return rangeStyle(range.startSec, range.endSec, duration);
  });

  const leftTimeLabel = $derived(
    displayRange ? formatTime(displayRange.startSec) : formatTime(currentTime),
  );

  const rightTimeLabel = $derived(
    displayRange ? formatTime(displayRange.endSec) : formatTime(duration),
  );

  function syncFromViewport(): void {
    if (!viewport) {
      return;
    }
    currentTime = viewport.getCurrentTime();
    duration = viewport.getDuration();
    paused = viewport.isPaused();
  }

  $effect(() => {
    const id = window.setInterval(() => syncFromViewport(), 100);
    return () => window.clearInterval(id);
  });

  async function togglePlayPause(): Promise<void> {
    if (!viewport || disabled) {
      return;
    }
    if (viewport.isPaused()) {
      await viewport.play();
    } else {
      viewport.pause();
    }
    syncFromViewport();
  }

  function clearRecordingArtifacts(): void {
    onRecordRangeChange?.(null);
    onPreviewRecordingChange?.(null);
    const previous = saveUrl;
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    saveUrl = null;
  }

  function stop(): void {
    viewport?.stop();
    syncFromViewport();
  }

  function handleStopClick(): void {
    if (!viewport || disabled) {
      return;
    }
    if (recording) {
      interrupt = beginRecordingInterrupt(viewport, 'stop');
      syncFromViewport();
      return;
    }
    stop();
  }

  function handleResetClick(): void {
    if (!viewport || disabled) {
      return;
    }
    if (recording) {
      interrupt = beginRecordingInterrupt(viewport, 'reset');
      syncFromViewport();
      return;
    }
    onResetView?.();
  }

  async function cancelInterrupt(): Promise<void> {
    const pending = interrupt;
    interrupt = null;
    if (pending?.resumePlayback && viewport) {
      await viewport.play();
    }
    syncFromViewport();
  }

  async function confirmInterrupt(): Promise<void> {
    const pending = interrupt;
    if (!pending || !viewport) {
      return;
    }
    interrupt = null;
    await discardInProgressRecording(viewport);
    recording = false;
    recordingStartSec = null;
    clearRecordingArtifacts();
    viewport.stop();
    if (pending.action === 'reset') {
      onResetView?.();
    }
    onPlaybackStop?.();
    syncFromViewport();
  }

  function seek(value: string): void {
    viewport?.seek(Number(value));
    currentTime = Number(value);
  }

  async function toggleRecord(): Promise<void> {
    if (!viewport || disabled) {
      return;
    }
    if (!recording) {
      onPreviewRecordingChange?.(null);
      const startSec = viewport.getCurrentTime();
      recordingStartSec = startSec;
      if (!viewport.startRecording()) {
        return;
      }
      recording = true;
      if (viewport.isPaused()) {
        await viewport.play();
      }
      return;
    }
    const startSec = recordingStartSec ?? viewport.getCurrentTime();
    const endSec = viewport.getCurrentTime();
    const blob = await viewport.stopRecording();
    recording = false;
    recordingStartSec = null;
    if (endSec > startSec + 0.05) {
      onRecordRangeChange?.({ startSec, endSec });
    } else {
      onRecordRangeChange?.(null);
    }
    if (!blob) {
      onPreviewRecordingChange?.(null);
      return;
    }
    onPreviewRecordingChange?.(blob);
    const previous = saveUrl;
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    saveUrl = URL.createObjectURL(blob);
  }

  function save(): void {
    if (!saveUrl) {
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = saveUrl;
    anchor.download = `authoring-recording-${Date.now()}.webm`;
    anchor.click();
  }
</script>

<div class="da-authoring-playback" aria-label="Source playback and recording">
  <h4 class="da-authoring-playback__title">Playback</h4>
  <div class="da-authoring-playback__transport">
    <button
      type="button"
      class="da-authoring-playback__btn da-authoring-playback__btn--icon"
      {disabled}
      aria-label={paused ? 'Play' : 'Pause'}
      onclick={togglePlayPause}
    >
      {#if paused}
        <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.02-6.86a1 1 0 0 0 0-1.7L9.54 4.3A1 1 0 0 0 8 5.14Z" />
        </svg>
      {:else}
        <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z" />
        </svg>
      {/if}
    </button>
    <button
      type="button"
      class="da-authoring-playback__btn da-authoring-playback__btn--icon"
      {disabled}
      aria-label="Stop"
      onclick={handleStopClick}
    >
      <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h10v10H7V7Z" />
      </svg>
    </button>
    <button
      type="button"
      class="da-authoring-playback__btn da-authoring-playback__btn--icon da-authoring-playback__btn--record"
      class:is-recording={recording}
      {disabled}
      aria-label={recording ? 'Stop recording' : 'Record'}
      aria-pressed={recording}
      onclick={toggleRecord}
    >
      {#if recording}
        <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 8h8v8H8V8Z" />
        </svg>
      {:else}
        <svg class="da-authoring-playback__icon da-authoring-playback__icon--record" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
        </svg>
      {/if}
    </button>
    <button
      type="button"
      class="da-authoring-playback__btn da-authoring-playback__btn--icon"
      disabled={disabled || !saveUrl}
      aria-label="Save recording"
      onclick={save}
    >
      <svg class="da-authoring-playback__icon da-authoring-playback__icon--save" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3v8.5m0 0 3.5-3.5M12 11.5 8.5 8M5 19h14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <button
      type="button"
      class="da-authoring-playback__btn da-authoring-playback__btn--reset"
      {disabled}
      aria-label="Reset view"
      onclick={handleResetClick}
    >
      RESET
    </button>
  </div>
  {#if interrupt}
    <div
      class="da-authoring-playback__interrupt"
      role="alertdialog"
      aria-labelledby="auth-playback-interrupt-msg"
    >
      <p id="auth-playback-interrupt-msg" class="da-authoring-playback__interrupt-message">
        {AUTHORING_RECORDING_INTERRUPT_COPY.message}
      </p>
      <div class="da-authoring-playback__interrupt-actions">
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--interrupt-cancel"
          onclick={cancelInterrupt}
        >
          {AUTHORING_RECORDING_INTERRUPT_COPY.cancel}
        </button>
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--interrupt-confirm"
          onclick={confirmInterrupt}
        >
          {authoringRecordingInterruptConfirmLabel(interrupt.action)}
        </button>
      </div>
    </div>
  {/if}
  <label class="da-authoring-playback__scrub">
    <span class="da-authoring-playback__time">{leftTimeLabel}</span>
    <div class="da-authoring-playback__track-wrap">
      <div class="da-authoring-playback__track" aria-hidden="true">
        {#if displayRange && duration > 0}
          <div
            class="da-authoring-playback__segment"
            class:da-authoring-playback__segment--live={recording}
            style:left={segmentStyle.left}
            style:width={segmentStyle.width}
          ></div>
        {/if}
      </div>
      <input
        type="range"
        class="da-authoring-playback__range"
        class:is-recording={recording}
        min="0"
        max={duration > 0 ? duration : 0}
        step="0.05"
        value={scrubValue}
        disabled={disabled || duration <= 0}
        oninput={(event) => seek((event.currentTarget as HTMLInputElement).value)}
      />
    </div>
    <span class="da-authoring-playback__time">{rightTimeLabel}</span>
  </label>
  {#if recordRange}
    <p class="da-note da-authoring-playback__segment-note">
      Extract uses {formatTime(recordRange.startSec)}–{formatTime(recordRange.endSec)} ({formatTime(
        recordRange.endSec - recordRange.startSec,
      )}
      recorded). Output mirror recording (same clip as playback download).
    </p>
  {/if}
  <p class="da-note da-authoring-playback__hint">
    {hint ??
      'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'}
  </p>
</div>
