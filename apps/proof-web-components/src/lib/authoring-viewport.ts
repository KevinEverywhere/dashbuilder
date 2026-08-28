/** Shared playback/recording API for equirect and flat authoring viewports. */
export interface AuthoringViewportHandle {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPaused: () => boolean;
  getOutputCanvas: () => HTMLCanvasElement | null;
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
}
