<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
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

const props = defineProps<{
  viewport?: AuthoringViewportHandle | null;
  hint?: string;
  disabled?: boolean;
  recordRange?: AuthoringRecordRange | null;
}>();

const emit = defineEmits<{
  resetView: [];
  playbackStop: [];
  'update:recordRange': [AuthoringRecordRange | null];
  'update:previewRecording': [Blob | null];
}>();

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

const currentTime = ref(0);
const duration = ref(0);
const paused = ref(true);
const recording = ref(false);
const recordingStartSec = ref<number | null>(null);
const saveUrl = ref<string | null>(null);
const interrupt = ref<AuthoringRecordingInterruptPrompt | null>(null);

function scrubValue(): number {
  return Math.min(currentTime.value, duration.value || 0);
}

function displayRange(): AuthoringRecordRange | null {
  const committed = props.recordRange;
  if (committed) {
    return committed;
  }
  const start = recordingStartSec.value;
  if (recording.value && start !== null) {
    return { startSec: start, endSec: Math.max(start, currentTime.value) };
  }
  return null;
}

function segmentStyle(): { left: string; width: string } {
  const range = displayRange();
  if (!range) {
    return { left: '0%', width: '0%' };
  }
  return rangeStyle(range.startSec, range.endSec, duration.value);
}

function leftTimeLabel(): string {
  const range = displayRange();
  return range ? formatTime(range.startSec) : formatTime(currentTime.value);
}

function rightTimeLabel(): string {
  const range = displayRange();
  return range ? formatTime(range.endSec) : formatTime(duration.value);
}

function syncFromViewport(): void {
  const viewport = props.viewport;
  if (!viewport) {
    return;
  }
  currentTime.value = viewport.getCurrentTime();
  duration.value = viewport.getDuration();
  paused.value = viewport.isPaused();
}

let intervalId: ReturnType<typeof setInterval> | undefined;

watch(
  () => props.viewport,
  () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    intervalId = window.setInterval(() => syncFromViewport(), 100);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (intervalId !== undefined) {
    clearInterval(intervalId);
  }
  const previous = saveUrl.value;
  if (previous) {
    URL.revokeObjectURL(previous);
  }
});

async function togglePlayPause(): Promise<void> {
  const viewport = props.viewport;
  if (!viewport || props.disabled) {
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
  emit('update:recordRange', null);
  emit('update:previewRecording', null);
  const previous = saveUrl.value;
  if (previous) {
    URL.revokeObjectURL(previous);
  }
  saveUrl.value = null;
}

function stop(): void {
  props.viewport?.stop();
  syncFromViewport();
}

function handleStopClick(): void {
  const viewport = props.viewport;
  if (!viewport || props.disabled) {
    return;
  }
  if (recording.value) {
    interrupt.value = beginRecordingInterrupt(viewport, 'stop');
    syncFromViewport();
    return;
  }
  stop();
}

function handleResetClick(): void {
  const viewport = props.viewport;
  if (!viewport || props.disabled) {
    return;
  }
  if (recording.value) {
    interrupt.value = beginRecordingInterrupt(viewport, 'reset');
    syncFromViewport();
    return;
  }
  emit('resetView');
}

async function cancelInterrupt(): Promise<void> {
  const pending = interrupt.value;
  interrupt.value = null;
  if (pending?.resumePlayback && props.viewport) {
    await props.viewport.play();
  }
  syncFromViewport();
}

async function confirmInterrupt(): Promise<void> {
  const pending = interrupt.value;
  const viewport = props.viewport;
  if (!pending || !viewport) {
    return;
  }
  interrupt.value = null;
  await discardInProgressRecording(viewport);
  recording.value = false;
  recordingStartSec.value = null;
  clearRecordingArtifacts();
  viewport.stop();
  if (pending.action === 'reset') {
    emit('resetView');
  }
  emit('playbackStop');
  syncFromViewport();
}

function seek(value: string): void {
  props.viewport?.seek(Number(value));
  currentTime.value = Number(value);
}

async function toggleRecord(): Promise<void> {
  const viewport = props.viewport;
  if (!viewport || props.disabled) {
    return;
  }
  if (!recording.value) {
    emit('update:previewRecording', null);
    const startSec = viewport.getCurrentTime();
    recordingStartSec.value = startSec;
    if (!viewport.startRecording()) {
      return;
    }
    recording.value = true;
    if (viewport.isPaused()) {
      await viewport.play();
    }
    return;
  }
  const startSec = recordingStartSec.value ?? viewport.getCurrentTime();
  const endSec = viewport.getCurrentTime();
  const blob = await viewport.stopRecording();
  recording.value = false;
  recordingStartSec.value = null;
  if (endSec > startSec + 0.05) {
    emit('update:recordRange', { startSec, endSec });
  } else {
    emit('update:recordRange', null);
  }
  if (!blob) {
    emit('update:previewRecording', null);
    return;
  }
  emit('update:previewRecording', blob);
  const previous = saveUrl.value;
  if (previous) {
    URL.revokeObjectURL(previous);
  }
  saveUrl.value = URL.createObjectURL(blob);
}

function save(): void {
  const url = saveUrl.value;
  if (!url) {
    return;
  }
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `authoring-recording-${Date.now()}.webm`;
  anchor.click();
}
</script>

<template>
  <div class="da-authoring-playback" aria-label="Source playback and recording">
    <h4 class="da-authoring-playback__title">Playback</h4>
    <div class="da-authoring-playback__transport">
      <button
        type="button"
        class="da-authoring-playback__btn da-authoring-playback__btn--icon"
        :disabled="disabled"
        :aria-label="paused ? 'Play' : 'Pause'"
        @click="togglePlayPause"
      >
        <svg v-if="paused" class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.02-6.86a1 1 0 0 0 0-1.7L9.54 4.3A1 1 0 0 0 8 5.14Z" />
        </svg>
        <svg v-else class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z" />
        </svg>
      </button>
      <button
        type="button"
        class="da-authoring-playback__btn da-authoring-playback__btn--icon"
        :disabled="disabled"
        aria-label="Stop"
        @click="handleStopClick"
      >
        <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7h10v10H7V7Z" />
        </svg>
      </button>
      <button
        type="button"
        class="da-authoring-playback__btn da-authoring-playback__btn--icon da-authoring-playback__btn--record"
        :class="{ 'is-recording': recording }"
        :disabled="disabled"
        :aria-label="recording ? 'Stop recording' : 'Record'"
        :aria-pressed="recording"
        @click="toggleRecord"
      >
        <svg v-if="recording" class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 8h8v8H8V8Z" />
        </svg>
        <svg
          v-else
          class="da-authoring-playback__icon da-authoring-playback__icon--record"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="7" />
        </svg>
      </button>
      <button
        type="button"
        class="da-authoring-playback__btn da-authoring-playback__btn--icon"
        :disabled="disabled || !saveUrl"
        aria-label="Save recording"
        @click="save"
      >
        <svg
          class="da-authoring-playback__icon da-authoring-playback__icon--save"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
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
        :disabled="disabled"
        aria-label="Reset view"
        @click="handleResetClick"
      >
        RESET
      </button>
    </div>
    <div
      v-if="interrupt"
      class="da-authoring-playback__interrupt"
      role="alertdialog"
      aria-labelledby="auth-playback-interrupt-msg"
    >
      <p id="auth-playback-interrupt-msg" class="da-authoring-playback__interrupt-message">
        {{ AUTHORING_RECORDING_INTERRUPT_COPY.message }}
      </p>
      <div class="da-authoring-playback__interrupt-actions">
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--interrupt-cancel"
          @click="cancelInterrupt"
        >
          {{ AUTHORING_RECORDING_INTERRUPT_COPY.cancel }}
        </button>
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--interrupt-confirm"
          @click="confirmInterrupt"
        >
          {{ authoringRecordingInterruptConfirmLabel(interrupt.action) }}
        </button>
      </div>
    </div>
    <label class="da-authoring-playback__scrub">
      <span class="da-authoring-playback__time">{{ leftTimeLabel() }}</span>
      <div class="da-authoring-playback__track-wrap">
        <div class="da-authoring-playback__track" aria-hidden="true">
          <div
            v-if="displayRange() && duration > 0"
            class="da-authoring-playback__segment"
            :class="{ 'da-authoring-playback__segment--live': recording }"
            :style="segmentStyle()"
          ></div>
        </div>
        <input
          type="range"
          class="da-authoring-playback__range"
          :class="{ 'is-recording': recording }"
          min="0"
          :max="duration > 0 ? duration : 0"
          step="0.05"
          :value="scrubValue()"
          :disabled="disabled || duration <= 0"
          @input="seek(($event.target as HTMLInputElement).value)"
        />
      </div>
      <span class="da-authoring-playback__time">{{ rightTimeLabel() }}</span>
    </label>
    <p v-if="recordRange" class="da-note da-authoring-playback__segment-note">
      Extract uses {{ formatTime(recordRange.startSec) }}–{{ formatTime(recordRange.endSec) }} ({{
        formatTime(recordRange.endSec - recordRange.startSec)
      }}
      span).
    </p>
    <p class="da-note da-authoring-playback__hint">
      {{
        hint ??
        'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'
      }}
    </p>
  </div>
</template>
