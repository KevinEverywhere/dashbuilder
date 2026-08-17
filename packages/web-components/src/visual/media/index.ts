export { RdVideoSourceElement, DB_VIDEO_SOURCE_TAG, registerRdVideoSource } from './video-source/index.js';
export {
  RdEquirectViewportElement,
  DB_EQUIRECT_VIEWPORT_TAG,
  registerRdEquirectViewport,
  type EquirectPreviewMode,
} from './equirect-viewport/index.js';
export {
  RdYoutubeEmbedElement,
  DB_YOUTUBE_EMBED_TAG,
  registerRdYoutubeEmbed,
  type YoutubeEmbedProps,
} from './youtube-embed/index.js';
export { registerRdLiveCapture, RD_LIVE_CAPTURE_TAG, RdLiveCaptureElement } from './live-capture/index.js';

import { registerRdEquirectViewport } from './equirect-viewport/index.js';
import { registerRdLiveCapture } from './live-capture/index.js';
import { registerRdVideoSource } from './video-source/index.js';
import { registerRdYoutubeEmbed } from './youtube-embed/index.js';

export function registerRosettaDashMediaElements(): void {
  registerRdVideoSource();
  registerRdEquirectViewport();
  registerRdYoutubeEmbed();
  registerRdLiveCapture();
}
