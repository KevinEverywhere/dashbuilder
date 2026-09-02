export { RdVideoSourceElement, DB_VIDEO_SOURCE_TAG, registerRdVideoSource } from './video-source/index.js';
export {
  RdEquirectViewportElement,
  DB_EQUIRECT_VIEWPORT_TAG,
  registerRdEquirectViewport,
  type EquirectPreviewMode,
} from './equirect-viewport/index.js';
export {
  RdFlatVideoViewportElement,
  DB_FLAT_VIDEO_VIEWPORT_TAG,
  registerRdFlatVideoViewport,
} from './flat-video-viewport/index.js';
export {
  RdEquirectSphereViewportElement,
  DB_EQUIRECT_SPHERE_VIEWPORT_TAG,
  registerRdEquirectSphereViewport,
  type EquirectSphereCameraChange,
  type EquirectSphereOutputSizeChange,
} from './equirect-sphere-viewport/index.js';
export {
  RdYoutubeEmbedElement,
  DB_YOUTUBE_EMBED_TAG,
  registerRdYoutubeEmbed,
  type YoutubeEmbedProps,
} from './youtube-embed/index.js';
export { registerRdLiveCapture, RD_LIVE_CAPTURE_TAG, RdLiveCaptureElement } from './live-capture/index.js';

import { registerRdEquirectViewport } from './equirect-viewport/index.js';
import { registerRdEquirectSphereViewport } from './equirect-sphere-viewport/index.js';
import { registerRdFlatVideoViewport } from './flat-video-viewport/index.js';
import { registerRdLiveCapture } from './live-capture/index.js';
import { registerRdVideoSource } from './video-source/index.js';
import { registerRdYoutubeEmbed } from './youtube-embed/index.js';

export function registerRosettaDashMediaElements(): void {
  registerRdVideoSource();
  registerRdEquirectViewport();
  registerRdEquirectSphereViewport();
  registerRdFlatVideoViewport();
  registerRdYoutubeEmbed();
  registerRdLiveCapture();
}
