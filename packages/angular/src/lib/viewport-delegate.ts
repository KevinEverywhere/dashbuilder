import type { MediaViewportElement } from './media-viewport-element.js';

export function delegateViewportMethods(host: HTMLElement): {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPaused: () => boolean;
  getOutputCanvas: () => HTMLCanvasElement | null;
  startRecording: () => boolean;
  stopRecording: () => Promise<Blob | null>;
} {
  const el = host as MediaViewportElement;
  return {
    play: () => el.play?.() ?? Promise.resolve(),
    pause: () => el.pause?.(),
    stop: () => el.stop?.(),
    seek: (time) => el.seek?.(time),
    getCurrentTime: () => el.getCurrentTime?.() ?? 0,
    getDuration: () => el.getDuration?.() ?? 0,
    isPaused: () => el.isPaused?.() ?? true,
    getOutputCanvas: () => el.getOutputCanvas?.() ?? null,
    startRecording: () => el.startRecording?.() ?? false,
    stopRecording: () => el.stopRecording?.() ?? Promise.resolve(null),
  };
}
