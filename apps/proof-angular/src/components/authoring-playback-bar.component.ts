import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AUTHORING_RECORDING_INTERRUPT_COPY,
  authoringRecordingInterruptConfirmLabel,
  type AuthoringRecordRange,
  type AuthoringRecordingInterruptPrompt,
} from '@rosettadash/core';

/** Minimal playback API used by the authoring bar (matches EquirectSphereViewport). */
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

function rangeStyle(startSec: number, endSec: number, duration: number) {
  if (duration <= 0) {
    return { left: '0%', width: '0%' };
  }
  const left = Math.max(0, Math.min(100, (startSec / duration) * 100));
  const width = Math.max(0, Math.min(100 - left, ((endSec - startSec) / duration) * 100));
  return { left: `${left}%`, width: `${width}%` };
}

@Component({
  selector: 'da-authoring-playback-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="da-authoring-playback" aria-label="Source playback and recording">
      <h4 class="da-authoring-playback__title">Playback</h4>
      <div class="da-authoring-playback__transport">
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--icon"
          [disabled]="disabled()"
          [attr.aria-label]="paused() ? 'Play' : 'Pause'"
          (click)="togglePlayPause()"
        >
          @if (paused()) {
            <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.02-6.86a1 1 0 0 0 0-1.7L9.54 4.3A1 1 0 0 0 8 5.14Z" />
            </svg>
          } @else {
            <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z" />
            </svg>
          }
        </button>
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--icon"
          [disabled]="disabled()"
          aria-label="Stop"
          (click)="handleStopClick()"
        >
          <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7h10v10H7V7Z" />
          </svg>
        </button>
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--icon da-authoring-playback__btn--record"
          [class.is-recording]="recording()"
          [disabled]="disabled()"
          [attr.aria-label]="recording() ? 'Stop recording' : 'Record'"
          [attr.aria-pressed]="recording()"
          (click)="toggleRecord()"
        >
          @if (recording()) {
            <svg class="da-authoring-playback__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 8h8v8H8V8Z" />
            </svg>
          } @else {
            <svg class="da-authoring-playback__icon da-authoring-playback__icon--record" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="7" />
            </svg>
          }
        </button>
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--icon"
          [disabled]="disabled() || !saveUrl()"
          aria-label="Save recording"
          (click)="save()"
        >
          <svg class="da-authoring-playback__icon da-authoring-playback__icon--save" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v8.5m0 0 3.5-3.5M12 11.5 8.5 8M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          class="da-authoring-playback__btn da-authoring-playback__btn--reset"
          [disabled]="disabled()"
          aria-label="Reset view"
          (click)="handleResetClick()"
        >
          RESET
        </button>
      </div>
      @if (interrupt()) {
        <div
          class="da-authoring-playback__interrupt"
          role="alertdialog"
          aria-labelledby="auth-playback-interrupt-msg"
        >
          <p id="auth-playback-interrupt-msg" class="da-authoring-playback__interrupt-message">
            {{ interruptCopy.message }}
          </p>
          <div class="da-authoring-playback__interrupt-actions">
            <button
              type="button"
              class="da-authoring-playback__btn da-authoring-playback__btn--interrupt-cancel"
              (click)="cancelInterrupt()"
            >
              {{ interruptCopy.cancel }}
            </button>
            <button
              type="button"
              class="da-authoring-playback__btn da-authoring-playback__btn--interrupt-confirm"
              (click)="confirmInterrupt()"
            >
              {{ interruptConfirmLabel() }}
            </button>
          </div>
        </div>
      }
      <label class="da-authoring-playback__scrub">
        <span class="da-authoring-playback__time">{{ leftTimeLabel() }}</span>
        <div class="da-authoring-playback__track-wrap">
          <div class="da-authoring-playback__track" aria-hidden="true">
            @if (displayRange() && duration() > 0) {
              <div
                class="da-authoring-playback__segment"
                [class.da-authoring-playback__segment--live]="recording()"
                [style.left]="segmentStyle().left"
                [style.width]="segmentStyle().width"
              ></div>
            }
          </div>
          <input
            type="range"
            class="da-authoring-playback__range"
            [class.is-recording]="recording()"
            min="0"
            [max]="duration() > 0 ? duration() : 0"
            step="0.05"
            [value]="scrubValue()"
            [disabled]="disabled() || duration() <= 0"
            (input)="seek($any($event.target).value)"
          />
        </div>
        <span class="da-authoring-playback__time">{{ rightTimeLabel() }}</span>
      </label>
      @if (recordRange()) {
        <p class="da-note da-authoring-playback__segment-note">
          Extract uses {{ formatTime(recordRange()!.startSec) }}–{{ formatTime(recordRange()!.endSec) }} ({{
            formatTime(recordRange()!.endSec - recordRange()!.startSec)
          }}
          recorded). Output mirror recording (same clip as playback download).
        </p>
      }
      <p class="da-note da-authoring-playback__hint">
        {{ hint() ?? 'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet' }}
      </p>
    </div>
  `,
})
export class AuthoringPlaybackBarComponent {
  readonly viewport = input<AuthoringViewportHandle | null>(null);
  readonly hint = input<string | undefined>(undefined);
  readonly disabled = input(false);
  readonly recordRange = input<AuthoringRecordRange | null>(null);

  readonly resetView = output<void>();
  readonly playbackStop = output<void>();
  readonly recordRangeChange = output<AuthoringRecordRange | null>();
  readonly previewRecordingChange = output<Blob | null>();

  readonly interruptCopy = AUTHORING_RECORDING_INTERRUPT_COPY;
  readonly interrupt = signal<AuthoringRecordingInterruptPrompt | null>(null);

  readonly formatTime = formatTime;
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly paused = signal(true);
  readonly recording = signal(false);
  readonly recordingStartSec = signal<number | null>(null);
  readonly saveUrl = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const id = window.setInterval(() => this.syncFromViewport(), 100);
      onCleanup(() => window.clearInterval(id));
    });
  }

  scrubValue(): number {
    return Math.min(this.currentTime(), this.duration() || 0);
  }

  displayRange(): AuthoringRecordRange | null {
    const committed = this.recordRange();
    if (committed) {
      return committed;
    }
    const start = this.recordingStartSec();
    if (this.recording() && start !== null) {
      return { startSec: start, endSec: Math.max(start, this.currentTime()) };
    }
    return null;
  }

  segmentStyle(): { left: string; width: string } {
    const range = this.displayRange();
    if (!range) {
      return { left: '0%', width: '0%' };
    }
    return rangeStyle(range.startSec, range.endSec, this.duration());
  }

  leftTimeLabel(): string {
    const range = this.displayRange();
    return range ? formatTime(range.startSec) : formatTime(this.currentTime());
  }

  rightTimeLabel(): string {
    const range = this.displayRange();
    return range ? formatTime(range.endSec) : formatTime(this.duration());
  }

  private syncFromViewport(): void {
    const viewport = this.viewport();
    if (!viewport) {
      return;
    }
    this.currentTime.set(viewport.getCurrentTime());
    this.duration.set(viewport.getDuration());
    this.paused.set(viewport.isPaused());
  }

  async togglePlayPause(): Promise<void> {
    const viewport = this.viewport();
    if (!viewport || this.disabled()) {
      return;
    }
    if (viewport.isPaused()) {
      await viewport.play();
    } else {
      viewport.pause();
    }
    this.syncFromViewport();
  }

  stop(): void {
    this.viewport()?.stop();
    this.syncFromViewport();
  }

  handleStopClick(): void {
    const viewport = this.viewport();
    if (!viewport || this.disabled()) {
      return;
    }
    if (this.recording()) {
      this.interrupt.set(this.beginRecordingInterrupt(viewport, 'stop'));
      this.syncFromViewport();
      return;
    }
    this.stop();
  }

  handleResetClick(): void {
    const viewport = this.viewport();
    if (!viewport || this.disabled()) {
      return;
    }
    if (this.recording()) {
      this.interrupt.set(this.beginRecordingInterrupt(viewport, 'reset'));
      this.syncFromViewport();
      return;
    }
    this.resetView.emit();
  }

  interruptConfirmLabel(): string {
    const pending = this.interrupt();
    return pending ? authoringRecordingInterruptConfirmLabel(pending.action) : '';
  }

  async cancelInterrupt(): Promise<void> {
    const pending = this.interrupt();
    this.interrupt.set(null);
    if (pending?.resumePlayback) {
      await this.viewport()?.play();
    }
    this.syncFromViewport();
  }

  async confirmInterrupt(): Promise<void> {
    const pending = this.interrupt();
    const viewport = this.viewport();
    if (!pending || !viewport) {
      return;
    }
    this.interrupt.set(null);
    await viewport.stopRecording();
    this.recording.set(false);
    this.recordingStartSec.set(null);
    this.clearRecordingArtifacts();
    viewport.stop();
    if (pending.action === 'reset') {
      this.resetView.emit();
    }
    this.playbackStop.emit();
    this.syncFromViewport();
  }

  private beginRecordingInterrupt(
    viewport: AuthoringViewportHandle,
    action: AuthoringRecordingInterruptPrompt['action'],
  ): AuthoringRecordingInterruptPrompt {
    const resumePlayback = !viewport.isPaused();
    viewport.pause();
    return { action, resumePlayback };
  }

  private clearRecordingArtifacts(): void {
    this.recordRangeChange.emit(null);
    this.previewRecordingChange.emit(null);
    const previous = this.saveUrl();
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    this.saveUrl.set(null);
  }

  seek(value: string): void {
    this.viewport()?.seek(Number(value));
    this.currentTime.set(Number(value));
  }

  async toggleRecord(): Promise<void> {
    const viewport = this.viewport();
    if (!viewport || this.disabled()) {
      return;
    }
    if (!this.recording()) {
      this.previewRecordingChange.emit(null);
      const startSec = viewport.getCurrentTime();
      this.recordingStartSec.set(startSec);
      if (!viewport.startRecording()) {
        return;
      }
      this.recording.set(true);
      if (viewport.isPaused()) {
        await viewport.play();
      }
      return;
    }
    const startSec = this.recordingStartSec() ?? viewport.getCurrentTime();
    const endSec = viewport.getCurrentTime();
    const blob = await viewport.stopRecording();
    this.recording.set(false);
    this.recordingStartSec.set(null);
    if (endSec > startSec + 0.05) {
      this.recordRangeChange.emit({ startSec, endSec });
    } else {
      this.recordRangeChange.emit(null);
    }
    if (!blob) {
      this.previewRecordingChange.emit(null);
      return;
    }
    this.previewRecordingChange.emit(blob);
    const previous = this.saveUrl();
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    this.saveUrl.set(URL.createObjectURL(blob));
  }

  save(): void {
    const url = this.saveUrl();
    if (!url) {
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `authoring-recording-${Date.now()}.webm`;
    anchor.click();
  }
}
