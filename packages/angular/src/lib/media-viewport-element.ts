/** Imperative playback/recording API shared by rd-* viewport custom elements. */
export interface MediaViewportElement extends HTMLElement {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  isPaused(): boolean;
  getOutputCanvas(): HTMLCanvasElement | null;
  startRecording(): boolean;
  stopRecording(): Promise<Blob | null>;
}
