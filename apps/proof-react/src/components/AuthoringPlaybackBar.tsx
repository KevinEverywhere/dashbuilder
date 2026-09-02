import { useEffect, useState } from 'react';
import {
  AUTHORING_RECORDING_INTERRUPT_COPY,
  authoringRecordingInterruptConfirmLabel,
  type AuthoringRecordingInterruptPrompt,
} from '@rosettadash/core';
import type { AuthoringRecordRange } from '@rosettadash/core';
import type { AuthoringViewportHandle } from '../lib/authoring-viewport';
import {
  beginRecordingInterrupt,
  discardInProgressRecording,
} from '../lib/authoring-playback-interrupt';
import {
  PlaybackPauseIcon,
  PlaybackPlayIcon,
  PlaybackRecordIcon,
  PlaybackRecordStopIcon,
  PlaybackSaveIcon,
  PlaybackStopIcon,
} from './authoring-playback-icons';

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

type Props = {
  viewportRef: React.RefObject<AuthoringViewportHandle | null>;
  disabled?: boolean;
  hint?: string;
  recordRange?: AuthoringRecordRange | null;
  onRecordRangeChange?: (range: AuthoringRecordRange | null) => void;
  onPreviewRecording?: (blob: Blob | null) => void;
  onResetView?: () => void;
  onPlaybackStop?: () => void;
};

export function AuthoringPlaybackBar({
  viewportRef,
  disabled = false,
  hint,
  recordRange = null,
  onRecordRangeChange,
  onPreviewRecording,
  onResetView,
  onPlaybackStop,
}: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordingStartSec, setRecordingStartSec] = useState<number | null>(null);
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  const [interrupt, setInterrupt] = useState<AuthoringRecordingInterruptPrompt | null>(null);

  useEffect(
    () => () => {
      if (saveUrl) {
        URL.revokeObjectURL(saveUrl);
      }
    },
    [saveUrl],
  );

  const syncFromViewport = () => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    setCurrentTime(viewport.getCurrentTime());
    setDuration(viewport.getDuration());
    setPaused(viewport.isPaused());
  };

  useEffect(() => {
    const id = window.setInterval(syncFromViewport, 100);
    return () => window.clearInterval(id);
  }, [viewportRef]);

  const handlePlayPause = async () => {
    const viewport = viewportRef.current;
    if (!viewport || disabled) {
      return;
    }
    if (viewport.isPaused()) {
      await viewport.play();
    } else {
      viewport.pause();
    }
    syncFromViewport();
  };

  const clearRecordingArtifacts = () => {
    onRecordRangeChange?.(null);
    onPreviewRecording?.(null);
    setSaveUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
  };

  const handleStop = () => {
    viewportRef.current?.stop();
    syncFromViewport();
  };

  const handleStopClick = () => {
    const viewport = viewportRef.current;
    if (!viewport || disabled) {
      return;
    }
    if (recording) {
      setInterrupt(beginRecordingInterrupt(viewport, 'stop'));
      syncFromViewport();
      return;
    }
    handleStop();
  };

  const handleResetClick = () => {
    const viewport = viewportRef.current;
    if (!viewport || disabled || !onResetView) {
      return;
    }
    if (recording) {
      setInterrupt(beginRecordingInterrupt(viewport, 'reset'));
      syncFromViewport();
      return;
    }
    onResetView();
  };

  const handleCancelInterrupt = async () => {
    const pending = interrupt;
    if (!pending) {
      return;
    }
    setInterrupt(null);
    if (pending.resumePlayback) {
      await viewportRef.current?.play();
    }
    syncFromViewport();
  };

  const handleConfirmInterrupt = async () => {
    const pending = interrupt;
    const viewport = viewportRef.current;
    if (!pending || !viewport) {
      return;
    }
    setInterrupt(null);
    await discardInProgressRecording(viewport);
    setRecording(false);
    setRecordingStartSec(null);
    clearRecordingArtifacts();
    viewport.stop();
    if (pending.action === 'reset') {
      onResetView?.();
    }
    onPlaybackStop?.();
    syncFromViewport();
  };

  const handleSeek = (value: number) => {
    viewportRef.current?.seek(value);
    setCurrentTime(value);
  };

  const handleRecordToggle = async () => {
    const viewport = viewportRef.current;
    if (!viewport || disabled) {
      return;
    }
    if (!recording) {
      onPreviewRecording?.(null);
      const startSec = viewport.getCurrentTime();
      setRecordingStartSec(startSec);
      if (!viewport.startRecording()) {
        return;
      }
      setRecording(true);
      if (viewport.isPaused()) {
        await viewport.play();
      }
      return;
    }
    const startSec = recordingStartSec ?? viewport.getCurrentTime();
    const endSec = viewport.getCurrentTime();
    const blob = await viewport.stopRecording();
    setRecording(false);
    setRecordingStartSec(null);
    if (endSec > startSec + 0.05) {
      onRecordRangeChange?.({ startSec, endSec });
    } else {
      onRecordRangeChange?.(null);
    }
    if (!blob) {
      onPreviewRecording?.(null);
      return;
    }
    onPreviewRecording?.(blob);
    setSaveUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return URL.createObjectURL(blob);
    });
  };

  const handleSave = () => {
    if (!saveUrl) {
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = saveUrl;
    anchor.download = `authoring-recording-${Date.now()}.webm`;
    anchor.click();
  };

  const liveEndSec = recording && recordingStartSec !== null ? Math.max(recordingStartSec, currentTime) : null;
  const displayRange = recordRange ?? (liveEndSec !== null && recordingStartSec !== null
    ? { startSec: recordingStartSec, endSec: liveEndSec }
    : null);

  return (
    <div className="da-authoring-playback" aria-label="Source playback and recording">
      <h4 className="da-authoring-playback__title">Playback</h4>
      <div className="da-authoring-playback__transport">
        <button
          type="button"
          className="da-authoring-playback__btn da-authoring-playback__btn--icon"
          disabled={disabled}
          aria-label={paused ? 'Play' : 'Pause'}
          onClick={() => void handlePlayPause()}
        >
          {paused ? <PlaybackPlayIcon /> : <PlaybackPauseIcon />}
        </button>
        <button
          type="button"
          className="da-authoring-playback__btn da-authoring-playback__btn--icon"
          disabled={disabled}
          aria-label="Stop"
          onClick={handleStopClick}
        >
          <PlaybackStopIcon />
        </button>
        <button
          type="button"
          className={`da-authoring-playback__btn da-authoring-playback__btn--icon da-authoring-playback__btn--record${recording ? ' is-recording' : ''}`}
          disabled={disabled}
          aria-label={recording ? 'Stop recording' : 'Record'}
          aria-pressed={recording}
          onClick={() => void handleRecordToggle()}
        >
          {recording ? <PlaybackRecordStopIcon /> : <PlaybackRecordIcon />}
        </button>
        <button
          type="button"
          className="da-authoring-playback__btn da-authoring-playback__btn--icon"
          disabled={disabled || !saveUrl}
          aria-label="Save recording"
          onClick={handleSave}
        >
          <PlaybackSaveIcon />
        </button>
        <button
          type="button"
          className="da-authoring-playback__btn da-authoring-playback__btn--reset"
          disabled={disabled || !onResetView}
          aria-label="Reset view"
          onClick={handleResetClick}
        >
          RESET
        </button>
      </div>
      {interrupt ? (
        <div
          className="da-authoring-playback__interrupt"
          role="alertdialog"
          aria-labelledby="auth-playback-interrupt-msg"
        >
          <p id="auth-playback-interrupt-msg" className="da-authoring-playback__interrupt-message">
            {AUTHORING_RECORDING_INTERRUPT_COPY.message}
          </p>
          <div className="da-authoring-playback__interrupt-actions">
            <button
              type="button"
              className="da-authoring-playback__btn da-authoring-playback__btn--interrupt-cancel"
              onClick={() => void handleCancelInterrupt()}
            >
              {AUTHORING_RECORDING_INTERRUPT_COPY.cancel}
            </button>
            <button
              type="button"
              className="da-authoring-playback__btn da-authoring-playback__btn--interrupt-confirm"
              onClick={() => void handleConfirmInterrupt()}
            >
              {authoringRecordingInterruptConfirmLabel(interrupt.action)}
            </button>
          </div>
        </div>
      ) : null}
      <label className="da-authoring-playback__scrub">
        <span className="da-authoring-playback__time">
          {displayRange ? formatTime(displayRange.startSec) : formatTime(currentTime)}
        </span>
        <div className="da-authoring-playback__track-wrap">
          <div className="da-authoring-playback__track" aria-hidden="true">
            {displayRange && duration > 0 ? (
              <div
                className={`da-authoring-playback__segment${recording ? ' da-authoring-playback__segment--live' : ''}`}
                style={rangeStyle(displayRange.startSec, displayRange.endSec, duration)}
              />
            ) : null}
          </div>
          <input
            type="range"
            className={`da-authoring-playback__range${recording ? ' is-recording' : ''}`}
            min={0}
            max={duration > 0 ? duration : 0}
            step={0.05}
            value={Math.min(currentTime, duration || 0)}
            disabled={disabled || duration <= 0}
            onChange={(event) => handleSeek(Number(event.target.value))}
          />
        </div>
        <span className="da-authoring-playback__time">
          {displayRange ? formatTime(displayRange.endSec) : formatTime(duration)}
        </span>
      </label>
      {recordRange ? (
        <p className="da-note da-authoring-playback__segment-note">
          Extract uses {formatTime(recordRange.startSec)}–{formatTime(recordRange.endSec)} (
          {formatTime(recordRange.endSec - recordRange.startSec)} recorded). Output mirror recording
          (same clip as playback download).
        </p>
      ) : null}
      <p className="da-note da-authoring-playback__hint">
        {hint ??
          'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'}
      </p>
    </div>
  );
}
