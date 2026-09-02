import type { AuthoringRecordRange } from '@rosettadash/core';

export interface AuthoringViewportHandle {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  isPaused(): boolean;
  startRecording(): boolean;
  stopRecording(): Promise<Blob | null>;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function rangeStyle(startSec: number, endSec: number, duration: number): { left: string; width: string } {
  if (duration <= 0) {
    return { left: '0%', width: '0%' };
  }
  const left = Math.max(0, Math.min(100, (startSec / duration) * 100));
  const width = Math.max(0, Math.min(100 - left, ((endSec - startSec) / duration) * 100));
  return { left: `${left}%`, width: `${width}%` };
}

export function renderAuthoringPlaybackBarMarkup(): string {
  return `
    <div class="da-authoring-playback" data-ref="auth-playback" aria-label="Source playback and recording">
      <h4 class="da-authoring-playback__title">Playback</h4>
      <div class="da-authoring-playback__transport">
        <button type="button" class="da-authoring-playback__btn da-authoring-playback__btn--icon" data-ref="auth-playback-play" aria-label="Play">
          <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.02-6.86a1 1 0 0 0 0-1.7L9.54 4.3A1 1 0 0 0 8 5.14Z" /></svg>
        </button>
        <button type="button" class="da-authoring-playback__btn da-authoring-playback__btn--icon" data-ref="auth-playback-stop" aria-label="Stop">
          <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7V7Z" /></svg>
        </button>
        <button type="button" class="da-authoring-playback__btn da-authoring-playback__btn--icon da-authoring-playback__btn--record" data-ref="auth-playback-record" aria-label="Record">
          <svg class="da-authoring-playback__icon da-authoring-playback__icon--record" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /></svg>
        </button>
        <button type="button" class="da-authoring-playback__btn da-authoring-playback__btn--icon" data-ref="auth-playback-save" aria-label="Save recording" disabled>
          <svg class="da-authoring-playback__icon da-authoring-playback__icon--save" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v8.5m0 0 3.5-3.5M12 11.5 8.5 8M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <button type="button" class="da-authoring-playback__btn da-authoring-playback__btn--reset" data-ref="auth-playback-reset" aria-label="Reset view">RESET</button>
      </div>
      <label class="da-authoring-playback__scrub">
        <span class="da-authoring-playback__time" data-ref="auth-playback-time-left">0:00</span>
        <div class="da-authoring-playback__track-wrap">
          <div class="da-authoring-playback__track" aria-hidden="true">
            <div class="da-authoring-playback__segment" data-ref="auth-playback-segment" hidden></div>
          </div>
          <input type="range" class="da-authoring-playback__range" data-ref="auth-playback-scrub" min="0" max="0" step="0.05" value="0" disabled />
        </div>
        <span class="da-authoring-playback__time" data-ref="auth-playback-time-right">0:00</span>
      </label>
      <p class="da-note da-authoring-playback__segment-note" data-ref="auth-playback-segment-note" hidden></p>
      <p class="da-note da-authoring-playback__hint" data-ref="auth-playback-hint"></p>
    </div>`;
}

type PlaybackWireOptions = {
  getViewport: () => AuthoringViewportHandle | null;
  getRecordRange: () => AuthoringRecordRange | null;
  hint?: string;
  onRecordRangeChange: (range: AuthoringRecordRange | null) => void;
  onPreviewRecording?: (blob: Blob | null) => void;
  onResetView: () => void;
};

let playbackInterval: number | null = null;

export function wireAuthoringPlaybackBar(root: HTMLElement, options: PlaybackWireOptions): void {
  const bar = root.querySelector('[data-ref="auth-playback"]');
  if (!bar) {
    return;
  }

  const playBtn = root.querySelector('[data-ref="auth-playback-play"]');
  const stopBtn = root.querySelector('[data-ref="auth-playback-stop"]');
  const recordBtn = root.querySelector('[data-ref="auth-playback-record"]');
  const saveBtn = root.querySelector('[data-ref="auth-playback-save"]');
  const resetBtn = root.querySelector('[data-ref="auth-playback-reset"]');
  const scrub = root.querySelector<HTMLInputElement>('[data-ref="auth-playback-scrub"]');
  const timeLeft = root.querySelector('[data-ref="auth-playback-time-left"]');
  const timeRight = root.querySelector('[data-ref="auth-playback-time-right"]');
  const segment = root.querySelector<HTMLElement>('[data-ref="auth-playback-segment"]');
  const segmentNote = root.querySelector('[data-ref="auth-playback-segment-note"]');
  const hintEl = root.querySelector('[data-ref="auth-playback-hint"]');

  if (hintEl && options.hint) {
    hintEl.textContent = options.hint;
  }

  let recording = false;
  let recordingStartSec: number | null = null;
  let saveUrl: string | null = null;

  const syncUi = (): void => {
    const viewport = options.getViewport();
    if (!viewport) {
      return;
    }
    const currentTime = viewport.getCurrentTime();
    const duration = viewport.getDuration();
    const paused = viewport.isPaused();

    if (scrub) {
      scrub.max = String(duration > 0 ? duration : 0);
      scrub.value = String(Math.min(currentTime, duration || 0));
      scrub.disabled = duration <= 0;
    }

    if (playBtn) {
      playBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
      playBtn.innerHTML = paused
        ? '<svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.02-6.86a1 1 0 0 0 0-1.7L9.54 4.3A1 1 0 0 0 8 5.14Z" /></svg>'
        : '<svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z" /></svg>';
    }

    const liveRange =
      options.getRecordRange() ??
      (recording && recordingStartSec !== null
        ? { startSec: recordingStartSec, endSec: Math.max(recordingStartSec, currentTime) }
        : null);

    if (segment && liveRange && duration > 0) {
      const style = rangeStyle(liveRange.startSec, liveRange.endSec, duration);
      segment.hidden = false;
      segment.style.left = style.left;
      segment.style.width = style.width;
      segment.classList.toggle('da-authoring-playback__segment--live', recording);
    } else if (segment) {
      segment.hidden = true;
    }

    if (timeLeft) {
      timeLeft.textContent = liveRange ? formatTime(liveRange.startSec) : formatTime(currentTime);
    }
    if (timeRight) {
      timeRight.textContent = liveRange ? formatTime(liveRange.endSec) : formatTime(duration);
    }

    if (segmentNote) {
      const committed = options.getRecordRange();
      if (committed) {
        segmentNote.hidden = false;
        segmentNote.textContent = `Extract uses the output mirror recording from ${formatTime(committed.startSec)}–${formatTime(committed.endSec)} (same clip as playback download).`;
      } else {
        segmentNote.hidden = true;
        segmentNote.textContent = '';
      }
    }

    if (scrub) {
      scrub.classList.toggle('is-recording', recording);
    }
  };

  if (playbackInterval !== null) {
    window.clearInterval(playbackInterval);
  }
  playbackInterval = window.setInterval(syncUi, 100);
  syncUi();

  playBtn?.addEventListener('click', () => {
    void (async () => {
      const viewport = options.getViewport();
      if (!viewport) {
        return;
      }
      if (viewport.isPaused()) {
        await viewport.play();
      } else {
        viewport.pause();
      }
      syncUi();
    })();
  });

  stopBtn?.addEventListener('click', () => {
    options.getViewport()?.stop();
    syncUi();
  });

  recordBtn?.addEventListener('click', () => {
    void (async () => {
      const viewport = options.getViewport();
      if (!viewport) {
        return;
      }
      if (!recording) {
        recordingStartSec = viewport.getCurrentTime();
        options.onPreviewRecording?.(null);
        if (!viewport.startRecording()) {
          return;
        }
        recording = true;
        recordBtn?.classList.add('is-recording');
        recordBtn?.setAttribute('aria-label', 'Stop recording');
        recordBtn?.setAttribute('aria-pressed', 'true');
        if (viewport.isPaused()) {
          await viewport.play();
        }
        syncUi();
        return;
      }
      const startSec = recordingStartSec ?? viewport.getCurrentTime();
      const endSec = viewport.getCurrentTime();
      const blob = await viewport.stopRecording();
      recording = false;
      recordingStartSec = null;
      recordBtn?.classList.remove('is-recording');
      recordBtn?.setAttribute('aria-label', 'Record');
      recordBtn?.removeAttribute('aria-pressed');
      if (endSec > startSec + 0.05) {
        options.onRecordRangeChange({ startSec, endSec });
      } else {
        options.onRecordRangeChange(null);
        options.onPreviewRecording?.(null);
      }
      if (blob) {
        if (saveUrl) {
          URL.revokeObjectURL(saveUrl);
        }
        saveUrl = URL.createObjectURL(blob);
        if (saveBtn instanceof HTMLButtonElement) {
          saveBtn.disabled = false;
        }
        options.onPreviewRecording?.(blob);
      } else {
        options.onPreviewRecording?.(null);
      }
      syncUi();
    })();
  });

  saveBtn?.addEventListener('click', () => {
    if (!saveUrl) {
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = saveUrl;
    anchor.download = `authoring-recording-${Date.now()}.webm`;
    anchor.click();
  });

  resetBtn?.addEventListener('click', () => {
    options.onResetView();
  });

  scrub?.addEventListener('input', () => {
    const viewport = options.getViewport();
    if (!viewport || !scrub) {
      return;
    }
    viewport.seek(Number(scrub.value));
    syncUi();
  });
}

export function resetAuthoringPlaybackBar(): void {
  if (playbackInterval !== null) {
    window.clearInterval(playbackInterval);
    playbackInterval = null;
  }
}
