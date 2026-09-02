import { buildEquirectFlatCropFilter } from '@rosettadash/core';
import { RdWasmMediaElement, DB_WASM_MEDIA_TAG, registerRdWasmMedia } from './wasm-media/rd-wasm-media.js';

describe('@rosettadash/web-components/wasm', () => {
  beforeAll(() => {
    registerRdWasmMedia();
  });

  it('registers rd-wasm-media tag', () => {
    expect(customElements.get(DB_WASM_MEDIA_TAG)).toBeDefined();
  });

  it('shows equirect-extract filter preview from crop region', () => {
    const media = document.createElement(DB_WASM_MEDIA_TAG) as RdWasmMediaElement;
    document.body.appendChild(media);

    media.setAttribute('operation', 'equirect-extract');
    media.setAttribute('extraction-mode', 'flat-crop');
    media.setProperty('cropRegion', {
      cropX: 1508,
      cropY: 664,
      cropWidth: 1080,
      cropHeight: 720,
      outputWidth: 720,
      outputHeight: 480,
    });

    expect(media.filterPreview).toBe(
      buildEquirectFlatCropFilter({
        cropX: 1508,
        cropY: 664,
        cropWidth: 1080,
        cropHeight: 720,
        outputWidth: 720,
        outputHeight: 480,
      }),
    );

    media.remove();
  });

  it('includes reverse in rectilinear filter preview when reverse attribute is set', () => {
    const media = document.createElement(DB_WASM_MEDIA_TAG) as RdWasmMediaElement;
    document.body.appendChild(media);

    media.setAttribute('operation', 'equirect-extract');
    media.setAttribute('extraction-mode', 'rectilinear');
    media.setAttribute('yaw', '25');
    media.setAttribute('pitch', '-8');
    media.setAttribute('horizontal-fov', '75');
    media.setAttribute('output-width', '1280');
    media.setAttribute('output-height', '720');
    media.setAttribute('reverse', 'true');

    expect(media.filterPreview).toContain('reverse');

    media.remove();
  });

  it('enables extract when preview recording and record trim are set', async () => {
    const media = document.createElement(DB_WASM_MEDIA_TAG) as RdWasmMediaElement;
    document.body.appendChild(media);
    await media.whenReady();

    media.setAttribute('operation', 'equirect-extract');
    media.setAttribute('output-format', 'mp4');
    media.setProperty('previewRecording', new Blob(['webm'], { type: 'video/webm' }));
    media.setProperty('recordRange', { startSec: 1, endSec: 3 });
    await media.whenReady();

    const button = media.shadowRoot?.querySelector('[data-role="extract"]') as HTMLButtonElement | null;
    expect(button?.disabled).toBe(false);
    expect(media.filterPreview).toContain('MP4');

    media.setAttribute('output-format', 'webm');
    expect(media.filterPreview).toContain('WebM');

    media.remove();
  });

  it('enables extract when input file and record trim are set', async () => {
    const media = document.createElement(DB_WASM_MEDIA_TAG) as RdWasmMediaElement;
    document.body.appendChild(media);
    await media.whenReady();

    media.setAttribute('operation', 'equirect-extract');
    media.setProperty('inputFile', new File(['x'], 'clip.mp4', { type: 'video/mp4' }));
    media.setProperty('recordRange', { startSec: 1, endSec: 3 });
    await media.whenReady();

    const button = media.shadowRoot?.querySelector('[data-role="extract"]') as HTMLButtonElement | null;
    expect(button?.disabled).toBe(false);

    media.remove();
  });
});
