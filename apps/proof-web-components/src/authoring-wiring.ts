import {
  AUTHORING_OUTPUT_CUSTOM_ID,
  AUTHORING_OUTPUT_PRESETS,
  authoringExtractDownloadName,
  authoringPreviewRecordingDownloadName,
  centerCropForOutput,
  flatCropToCropRegion,
  getAuthoringOutputPreset,
  isEquirectSourceDimensions,
  virtualCameraToCropRegion,
  wrapSignedDegrees,
  type AuthoringRecordRange,
  type FlatCropRect,
} from '@rosettadash/core';
import type {
  RdEquirectSphereViewportElement,
  RdFlatVideoViewportElement,
} from '@rosettadash/web-components/visual/media';
import {
  refreshAuthoringCameraControls,
  wireAuthoringCameraControls,
} from './authoring-camera-controls.js';
import {
  type AuthoringViewportHandle,
  resetAuthoringPlaybackBar,
  wireAuthoringPlaybackBar,
} from './authoring-playback-bar.js';

type DashRow = Record<string, string | number | boolean | null | undefined>;
type ViewportMode = 'flat' | 'equirect' | 'none';
type SetPropertyElement = HTMLElement & { setProperty(name: string, value: unknown): void };

let wiredRoot: HTMLElement | null = null;
let sourceObjectUrl: string | null = null;

const state = {
  mode: 'none' as ViewportMode,
  inputFile: null as File | null,
  sourceWidth: 0,
  sourceHeight: 0,
  yaw: 25,
  pitch: -8,
  horizontalFov: 75,
  outputWidth: 720,
  outputHeight: 480,
  outputPresetId: '720x480',
  reverse: false,
  cropX: 0,
  cropY: 0,
  cropWidth: 640,
  cropHeight: 360,
  recordRange: null as AuthoringRecordRange | null,
  previewRecording: null as Blob | null,
  extractFormat: 'mp4' as 'mp4' | 'webm',
  defaultYaw: 25,
  defaultPitch: -8,
  defaultHorizontalFov: 75,
  extractFilter: '',
};

function probeVideoFile(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    video.src = url;
  });
}

function wireFileInput(
  input: HTMLInputElement,
  onFile: (detail: { file: File; metadata: DashRow }) => void,
): void {
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    void probeVideoFile(file).then(({ width, height }) => {
      onFile({
        file,
        metadata: {
          name: file.name,
          sourceWidth: width > 0 ? width : undefined,
          sourceHeight: height > 0 ? height : undefined,
          size: file.size,
        },
      });
    });
  });
}

function evenDimension(value: number): number {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

function matchOutputPreset(width: number, height: number): string {
  const match = AUTHORING_OUTPUT_PRESETS.find((entry) => entry.width === width && entry.height === height);
  return match?.id ?? AUTHORING_OUTPUT_CUSTOM_ID;
}

function asFlatViewport(el: Element | null): RdFlatVideoViewportElement | null {
  return el instanceof HTMLElement && 'getOutputCanvas' in el
    ? (el as RdFlatVideoViewportElement)
    : null;
}

function asSphereViewport(el: Element | null): RdEquirectSphereViewportElement | null {
  return el instanceof HTMLElement && 'getOutputCanvas' in el && el.tagName === 'RD-EQUIRECT-SPHERE-VIEWPORT'
    ? (el as RdEquirectSphereViewportElement)
    : null;
}

function readNumberRef(root: HTMLElement, ref: string, fallback: number): number {
  const value = root.querySelector(`[data-ref="${ref}"]`)?.getAttribute('value');
  return value != null && value !== '' ? Number(value) : fallback;
}

function setNumberRef(root: HTMLElement, ref: string, value: number): void {
  root.querySelector(`[data-ref="${ref}"]`)?.setAttribute('value', String(value));
}

function getActiveViewport(root: HTMLElement): AuthoringViewportHandle | null {
  if (state.mode === 'flat') {
    return asFlatViewport(root.querySelector('[data-ref="auth-flat-viewport"]'));
  }
  if (state.mode === 'equirect') {
    return asSphereViewport(root.querySelector('[data-ref="auth-sphere-viewport"]'));
  }
  return null;
}

function buildCropRegion(): DashRow | null {
  if (state.mode === 'equirect') {
    return virtualCameraToCropRegion({
      camera: { yaw: state.yaw, pitch: state.pitch, roll: 0, fov: state.horizontalFov },
      sourceWidth: state.sourceWidth,
      sourceHeight: state.sourceHeight,
      outputWidth: state.outputWidth,
      outputHeight: state.outputHeight,
      reverse: state.reverse,
    });
  }
  if (state.mode === 'flat' && state.sourceWidth > 0 && state.sourceHeight > 0) {
    return flatCropToCropRegion({
      cropX: state.cropX,
      cropY: state.cropY,
      cropWidth: state.cropWidth,
      cropHeight: state.cropHeight,
      sourceWidth: state.sourceWidth,
      sourceHeight: state.sourceHeight,
      outputWidth: state.outputWidth,
      outputHeight: state.outputHeight,
      reverse: state.reverse,
    });
  }
  return null;
}

function syncWasm(root: HTMLElement): void {
  const wasm = root.querySelector('[data-ref="auth-wasm"]') as SetPropertyElement | null;
  if (!wasm) {
    return;
  }
  wasm.setProperty('recordRange', state.recordRange);
  wasm.setProperty('previewRecording', state.previewRecording);
  wasm.setAttribute('output-format', state.extractFormat);
  const crop = buildCropRegion();
  if (!crop) {
    return;
  }
  wasm.setProperty('cropRegion', crop);
  wasm.setAttribute('extraction-mode', state.mode === 'equirect' ? 'rectilinear' : 'flat-crop');
  wasm.setAttribute('yaw', String(state.yaw));
  wasm.setAttribute('pitch', String(state.pitch));
  wasm.setAttribute('horizontal-fov', String(state.horizontalFov));
  wasm.setAttribute('output-width', String(state.outputWidth));
  wasm.setAttribute('output-height', String(state.outputHeight));
  if (state.reverse) {
    wasm.setAttribute('reverse', '');
  } else {
    wasm.removeAttribute('reverse');
  }
  state.extractFilter = typeof crop.filter === 'string' ? crop.filter : '';
  const filterEl = root.querySelector('[data-ref="auth-filter-note"]');
  if (filterEl) {
    if (state.previewRecording) {
      filterEl.hidden = false;
      filterEl.textContent =
        state.extractFormat === 'webm'
          ? 'Extract copies the output mirror recording as WebM (same clip as playback download).'
          : 'Extract transcodes the output mirror recording to MP4 via ffmpeg.wasm (playback download stays WebM).';
    } else if (state.extractFilter) {
      filterEl.hidden = false;
      filterEl.innerHTML = `Filter: <code class="da-value-ellipsis" tabindex="0">${state.extractFilter}</code>`;
    } else {
      filterEl.hidden = true;
      filterEl.textContent = '';
    }
  }
}

function syncSourceDimensionsNote(root: HTMLElement): void {
  const note = root.querySelector('[data-ref="auth-source-dims"]');
  if (!note || state.sourceWidth <= 0 || state.sourceHeight <= 0) {
    return;
  }
  note.removeAttribute('hidden');
  const aspect = state.sourceHeight > 0 ? state.sourceWidth / state.sourceHeight : 0;
  const equirect = state.mode === 'equirect';
  const warn = equirect && Math.abs(aspect - 2) > 0.05;
  note.className = `da-note${warn ? ' da-note--warn' : ''}`;
  note.textContent = `Source dimensions: ${state.sourceWidth}×${state.sourceHeight} (${aspect.toFixed(2)}:1)${
    equirect ? ' — interior view flips texture for inside-out viewing' : ''
  }${warn ? ' · aspect ratio differs from 2:1; extract may look wrong' : ''}`;
}

function bindOutputPreviewHosts(root: HTMLElement): void {
  const outputPreview = root.querySelector('[data-ref="auth-output-preview"]');
  const flat = asFlatViewport(root.querySelector('[data-ref="auth-flat-viewport"]'));
  const sphere = asSphereViewport(root.querySelector('[data-ref="auth-sphere-viewport"]'));
  flat?.setProperty('outputPreviewHost', null);
  sphere?.setProperty('outputPreviewHost', null);
  if (!(outputPreview instanceof HTMLElement)) {
    return;
  }
  if (state.mode === 'flat') {
    flat?.setProperty('outputPreviewHost', outputPreview);
    return;
  }
  if (state.mode === 'equirect') {
    sphere?.setProperty('outputPreviewHost', outputPreview);
  }
}

function applyOutputPreset(root: HTMLElement, presetId: string): void {
  state.outputPresetId = presetId;
  root.querySelector('[data-ref="auth-output-preset"]')?.setAttribute('value', presetId);
  if (presetId === AUTHORING_OUTPUT_CUSTOM_ID) {
    root.querySelector('[data-ref="auth-output-width"]')?.removeAttribute('disabled');
    root.querySelector('[data-ref="auth-output-height"]')?.removeAttribute('disabled');
    return;
  }
  const preset = getAuthoringOutputPreset(presetId);
  if (!preset) {
    return;
  }
  state.outputWidth = preset.width;
  state.outputHeight = preset.height;
  setNumberRef(root, 'auth-output-width', preset.width);
  setNumberRef(root, 'auth-output-height', preset.height);
  root.querySelector('[data-ref="auth-output-width"]')?.setAttribute('disabled', '');
  root.querySelector('[data-ref="auth-output-height"]')?.setAttribute('disabled', '');
  if (state.mode === 'flat' && state.sourceWidth > 0 && state.sourceHeight > 0) {
    const centered = centerCropForOutput(state.sourceWidth, state.sourceHeight, preset.width, preset.height);
    applyFlatCrop(root, centered);
  }
  syncViewports(root);
  syncWasm(root);
  asSphereViewport(root.querySelector('[data-ref="auth-sphere-viewport"]'))?.setProperty(
    'resetExportReference',
    true,
  );
}

function applyFlatCrop(root: HTMLElement, crop: FlatCropRect): void {
  state.cropX = crop.cropX;
  state.cropY = crop.cropY;
  state.cropWidth = crop.cropWidth;
  state.cropHeight = crop.cropHeight;
  setNumberRef(root, 'auth-crop-x', crop.cropX);
  setNumberRef(root, 'auth-crop-y', crop.cropY);
  setNumberRef(root, 'auth-crop-w', crop.cropWidth);
  setNumberRef(root, 'auth-crop-h', crop.cropHeight);
  const flat = asFlatViewport(root.querySelector('[data-ref="auth-flat-viewport"]'));
  flat?.setAttribute('crop-x', String(crop.cropX));
  flat?.setAttribute('crop-y', String(crop.cropY));
  flat?.setAttribute('crop-width', String(crop.cropWidth));
  flat?.setAttribute('crop-height', String(crop.cropHeight));
}

function syncViewports(root: HTMLElement): void {
  const flat = asFlatViewport(root.querySelector('[data-ref="auth-flat-viewport"]'));
  const sphere = asSphereViewport(root.querySelector('[data-ref="auth-sphere-viewport"]'));
  flat?.setAttribute('output-width', String(state.outputWidth));
  flat?.setAttribute('output-height', String(state.outputHeight));
  sphere?.setAttribute('output-width', String(state.outputWidth));
  sphere?.setAttribute('output-height', String(state.outputHeight));
  sphere?.setAttribute('yaw', String(state.yaw));
  sphere?.setAttribute('pitch', String(state.pitch));
  sphere?.setAttribute('horizontal-fov', String(state.horizontalFov));
  setNumberRef(root, 'auth-out-yaw', state.yaw);
  setNumberRef(root, 'auth-out-pitch', state.pitch);
  setNumberRef(root, 'auth-out-fov', state.horizontalFov);
  refreshAuthoringCameraControls(root, {
    yaw: state.yaw,
    pitch: state.pitch,
    horizontalFov: state.horizontalFov,
  });
}

function setSourceLoaded(root: HTMLElement, loaded: boolean): void {
  root.querySelector('[data-ref="auth-pick-source"]')?.toggleAttribute('hidden', loaded);
  root.querySelector('[data-ref="auth-source-toolbar"]')?.toggleAttribute('hidden', !loaded);
  root.querySelector('[data-ref="auth-source-placeholder"]')?.toggleAttribute('hidden', loaded);
  root.querySelector('[data-ref="auth-source-controls"]')?.toggleAttribute('hidden', !loaded);
  root.querySelector('[data-ref="auth-output-placeholder"]')?.toggleAttribute('hidden', loaded);
  root.querySelector('[data-ref="auth-output-controls"]')?.toggleAttribute('hidden', !loaded);

  const outputPreview = root.querySelector('[data-ref="auth-output-preview"]');
  if (outputPreview instanceof HTMLElement) {
    outputPreview.classList.toggle('da-authoring-program-preview-host--placeholder', !loaded);
    if (!loaded) {
      outputPreview.innerHTML =
        '<p class="da-authoring-output-placeholder">Choose source file to create output</p>';
    } else {
      outputPreview.innerHTML = '';
    }
  }
}

function setMode(root: HTMLElement, next: ViewportMode): void {
  state.mode = next;
  root.querySelector('[data-ref="auth-flat-viewport"]')?.toggleAttribute('hidden', next !== 'flat');
  root.querySelector('[data-ref="auth-sphere-viewport"]')?.toggleAttribute('hidden', next !== 'equirect');
  root.querySelector('[data-ref="auth-flat-controls"]')?.toggleAttribute('hidden', next !== 'flat');
  root.querySelector('[data-ref="auth-camera"]')?.toggleAttribute('hidden', next !== 'equirect');
  root.querySelector('[data-ref="auth-out-camera"]')?.toggleAttribute('hidden', next !== 'equirect');

  bindOutputPreviewHosts(root);

  const modeNote = root.querySelector('[data-ref="auth-mode-note"]');
  if (modeNote) {
    modeNote.textContent =
      next === 'flat'
        ? 'Flat video — drag the crop rectangle on source'
        : next === 'equirect'
          ? '360° equirectangular — camera framing controls'
          : '';
  }

  const playbackHint = root.querySelector('[data-ref="auth-playback-hint"]');
  if (playbackHint) {
    playbackHint.textContent =
      next === 'equirect'
        ? 'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'
        : next === 'flat'
          ? 'Drag the crop rectangle · corner handles set a custom output size · presets snap to standard dimensions'
          : '';
  }

  const recordHint = root.querySelector('[data-ref="auth-record-hint"]');
  if (recordHint) {
    recordHint.hidden = Boolean(state.recordRange);
  }
}

function revokeSourceUrl(): void {
  if (sourceObjectUrl) {
    URL.revokeObjectURL(sourceObjectUrl);
    sourceObjectUrl = null;
  }
}

function resetView(root: HTMLElement): void {
  if (state.mode === 'equirect') {
    state.yaw = state.defaultYaw;
    state.pitch = state.defaultPitch;
    state.horizontalFov = state.defaultHorizontalFov;
  } else if (state.sourceWidth > 0 && state.sourceHeight > 0) {
    const centered = centerCropForOutput(
      state.sourceWidth,
      state.sourceHeight,
      state.outputWidth,
      state.outputHeight,
    );
    applyFlatCrop(root, centered);
  }
  syncViewports(root);
  syncWasm(root);
}

export function wireAuthoringPipeline(root: HTMLElement): void {
  if (wiredRoot === root) {
    return;
  }
  resetAuthoringPlaybackBar();
  wiredRoot = root;

  const wasm = root.querySelector('[data-ref="auth-wasm"]') as SetPropertyElement | null;
  const fileInputs = [
    root.querySelector<HTMLInputElement>('[data-ref="auth-file-input"]'),
    root.querySelector<HTMLInputElement>('[data-ref="auth-file-input-initial"]'),
  ].filter((input): input is HTMLInputElement => input instanceof HTMLInputElement);

  if (!wasm || fileInputs.length === 0) {
    return;
  }

  applyOutputPreset(root, state.outputPresetId);

  const onVideoFile = (detail: { file: File; metadata: DashRow }): void => {
    const width = Number(detail.metadata.sourceWidth ?? 0);
    const height = Number(detail.metadata.sourceHeight ?? 0);

    revokeSourceUrl();
    sourceObjectUrl = URL.createObjectURL(detail.file);
    state.inputFile = detail.file;
    state.sourceWidth = width;
    state.sourceHeight = height;
    state.recordRange = null;
    state.previewRecording = null;
    state.yaw = state.defaultYaw;
    state.pitch = state.defaultPitch;
    state.horizontalFov = state.defaultHorizontalFov;

    wasm.setProperty('inputFile', detail.file);
    setSourceLoaded(root, true);
    syncSourceDimensionsNote(root);

    const equirect = width > 0 && height > 0 && isEquirectSourceDimensions(width, height);
    if (equirect) {
      setMode(root, 'equirect');
      const sphere = asSphereViewport(root.querySelector('[data-ref="auth-sphere-viewport"]'));
      sphere?.setAttribute('flip-interior', '');
      sphere?.setProperty('videoSrc', sourceObjectUrl);
      syncViewports(root);
      syncWasm(root);
      return;
    }

    setMode(root, 'flat');
    if (width <= 0 || height <= 0) {
      return;
    }
    const centered = centerCropForOutput(state.sourceWidth, state.sourceHeight, state.outputWidth, state.outputHeight);
    const flat = asFlatViewport(root.querySelector('[data-ref="auth-flat-viewport"]'));
    flat?.setAttribute('source-width', String(width));
    flat?.setAttribute('source-height', String(height));
    flat?.setProperty('videoSrc', sourceObjectUrl);
    applyFlatCrop(root, centered);
    syncViewports(root);
    syncWasm(root);
  };

  fileInputs.forEach((input) => wireFileInput(input, onVideoFile));

  asFlatViewport(root.querySelector('[data-ref="auth-flat-viewport"]'))?.addEventListener('crop-change', (event) => {
    const crop = (event as CustomEvent<FlatCropRect>).detail;
    applyFlatCrop(root, crop);
    state.outputWidth = evenDimension(crop.cropWidth);
    state.outputHeight = evenDimension(crop.cropHeight);
    state.outputPresetId = AUTHORING_OUTPUT_CUSTOM_ID;
    setNumberRef(root, 'auth-output-width', state.outputWidth);
    setNumberRef(root, 'auth-output-height', state.outputHeight);
    root.querySelector('[data-ref="auth-output-preset"]')?.setAttribute('value', AUTHORING_OUTPUT_CUSTOM_ID);
    root.querySelector('[data-ref="auth-output-width"]')?.removeAttribute('disabled');
    root.querySelector('[data-ref="auth-output-height"]')?.removeAttribute('disabled');
    syncViewports(root);
    syncWasm(root);
  });

  asSphereViewport(root.querySelector('[data-ref="auth-sphere-viewport"]'))?.addEventListener('camera-change', (event) => {
    const detail = (event as CustomEvent<{ yaw: number; pitch: number; horizontalFov: number }>).detail;
    state.yaw = wrapSignedDegrees(detail.yaw);
    state.pitch = detail.pitch;
    state.horizontalFov = detail.horizontalFov;
    syncViewports(root);
    syncWasm(root);
  });

  asSphereViewport(root.querySelector('[data-ref="auth-sphere-viewport"]'))?.addEventListener(
    'output-size-change',
    (event) => {
      const detail = (event as CustomEvent<{ outputWidth: number; outputHeight: number }>).detail;
      state.outputWidth = evenDimension(detail.outputWidth);
      state.outputHeight = evenDimension(detail.outputHeight);
      state.outputPresetId = AUTHORING_OUTPUT_CUSTOM_ID;
      setNumberRef(root, 'auth-output-width', state.outputWidth);
      setNumberRef(root, 'auth-output-height', state.outputHeight);
      root.querySelector('[data-ref="auth-output-preset"]')?.setAttribute('value', AUTHORING_OUTPUT_CUSTOM_ID);
      root.querySelector('[data-ref="auth-output-width"]')?.removeAttribute('disabled');
      root.querySelector('[data-ref="auth-output-height"]')?.removeAttribute('disabled');
      syncViewports(root);
      syncWasm(root);
    },
  );

  wireAuthoringPlaybackBar(root, {
    getViewport: () => getActiveViewport(root),
    getRecordRange: () => state.recordRange,
    hint:
      state.mode === 'equirect'
        ? 'Drag on the sphere or use Camera framing sliders · FOV above 130° enters little-planet'
        : 'Drag the crop rectangle · corner handles set a custom output size · presets snap to standard dimensions',
    onRecordRangeChange: (range) => {
      state.recordRange = range;
      const recordHint = root.querySelector('[data-ref="auth-record-hint"]');
      if (recordHint) {
        recordHint.hidden = Boolean(range);
      }
      syncWasm(root);
    },
    onPreviewRecording: (blob) => {
      state.previewRecording = blob;
      syncWasm(root);
    },
    onResetView: () => resetView(root),
  });

  wireAuthoringCameraControls(root, {
    getState: () => ({
      yaw: state.yaw,
      pitch: state.pitch,
      horizontalFov: state.horizontalFov,
    }),
    onChange: (partial) => {
      if (partial.yaw != null) {
        state.yaw = wrapSignedDegrees(partial.yaw);
      }
      if (partial.pitch != null) {
        state.pitch = partial.pitch;
      }
      if (partial.horizontalFov != null) {
        state.horizontalFov = partial.horizontalFov;
      }
      syncViewports(root);
      syncWasm(root);
    },
    onReset: () => {
      state.yaw = state.defaultYaw;
      state.pitch = state.defaultPitch;
      state.horizontalFov = state.defaultHorizontalFov;
      syncViewports(root);
      syncWasm(root);
    },
  });

  const bindCropInput = (ref: string, key: keyof FlatCropRect) => {
    root.querySelector(`[data-ref="${ref}"]`)?.addEventListener('value-change', () => {
      if (state.mode !== 'flat') {
        return;
      }
      const value = readNumberRef(root, ref, 0);
      applyFlatCrop(root, {
        cropX: state.cropX,
        cropY: state.cropY,
        cropWidth: state.cropWidth,
        cropHeight: state.cropHeight,
        [key]: value,
      });
      state.outputWidth = evenDimension(state.cropWidth);
      state.outputHeight = evenDimension(state.cropHeight);
      state.outputPresetId = AUTHORING_OUTPUT_CUSTOM_ID;
      syncViewports(root);
      syncWasm(root);
    });
  };
  bindCropInput('auth-crop-x', 'cropX');
  bindCropInput('auth-crop-y', 'cropY');
  bindCropInput('auth-crop-w', 'cropWidth');
  bindCropInput('auth-crop-h', 'cropHeight');

  root.querySelector('[data-ref="auth-output-preset"]')?.addEventListener('value-change', () => {
    const presetId =
      root.querySelector('[data-ref="auth-output-preset"]')?.getAttribute('value') ?? AUTHORING_OUTPUT_CUSTOM_ID;
    applyOutputPreset(root, presetId);
  });

  const onCustomOutputDim = (): void => {
    if (state.outputPresetId !== AUTHORING_OUTPUT_CUSTOM_ID) {
      return;
    }
    const nextWidth = readNumberRef(root, 'auth-output-width', state.outputWidth);
    const nextHeight = readNumberRef(root, 'auth-output-height', state.outputHeight);
    state.outputWidth = nextWidth;
    state.outputHeight = nextHeight;
    state.outputPresetId = matchOutputPreset(state.outputWidth, state.outputHeight);
    root.querySelector('[data-ref="auth-output-preset"]')?.setAttribute('value', state.outputPresetId);
    if (state.mode === 'flat' && state.sourceWidth > 0 && state.sourceHeight > 0 && state.outputPresetId !== AUTHORING_OUTPUT_CUSTOM_ID) {
      const centered = centerCropForOutput(
        state.sourceWidth,
        state.sourceHeight,
        state.outputWidth,
        state.outputHeight,
      );
      applyFlatCrop(root, centered);
    }
    syncViewports(root);
    syncWasm(root);
  };
  root.querySelector('[data-ref="auth-output-width"]')?.addEventListener('value-change', onCustomOutputDim);
  root.querySelector('[data-ref="auth-output-height"]')?.addEventListener('value-change', onCustomOutputDim);

  root.querySelector('[data-ref="auth-reverse"]')?.addEventListener('click', () => {
    state.reverse = !state.reverse;
    root.querySelector('[data-ref="auth-reverse"]')?.classList.toggle('is-active', state.reverse);
    root.querySelector('[data-ref="auth-reverse"]')?.setAttribute('aria-pressed', state.reverse ? 'true' : 'false');
    syncWasm(root);
  });

  root.querySelector('[data-ref="auth-extract-format"]')?.addEventListener('value-change', () => {
    const value =
      root.querySelector('[data-ref="auth-extract-format"]')?.getAttribute('value') ?? 'mp4';
    state.extractFormat = value === 'webm' ? 'webm' : 'mp4';
    syncWasm(root);
  });

  (['auth-out-yaw', 'auth-out-pitch', 'auth-out-fov'] as const).forEach((ref, index) => {
    root.querySelector(`[data-ref="${ref}"]`)?.addEventListener('value-change', () => {
      if (state.mode !== 'equirect') {
        return;
      }
      const value = readNumberRef(root, ref, 0);
      if (index === 0) {
        state.yaw = wrapSignedDegrees(value);
      } else if (index === 1) {
        state.pitch = value;
      } else {
        state.horizontalFov = value;
      }
      syncViewports(root);
      syncWasm(root);
    });
  });

  wasm.addEventListener('extract-complete', (event) => {
    const detail = (event as CustomEvent<{ blob?: Blob; metadata?: DashRow }>).detail;
    const result = root.querySelector('[data-ref="auth-extract-result"]');
    if (!result || !detail.blob) {
      return;
    }
    const url = URL.createObjectURL(detail.blob);
    const isPreviewRecording = detail.metadata?.source === 'preview-recording';
    const filter = detail.metadata?.filter;
    if (typeof filter === 'string') {
      state.extractFilter = filter;
    }
    result.hidden = false;
    result.className = 'da-note';
    if (isPreviewRecording) {
      const isWebm = detail.metadata?.format === 'webm';
      result.innerHTML = `
      <p class="da-note">Extracted preview recording (${isWebm ? 'WebM' : 'MP4'}):</p>
      <video class="da-authoring-pane__video" src="${url}" controls playsinline autoplay muted></video>
      <a class="da-media-extract-output__download" href="${url}" download="${
        isWebm
          ? authoringPreviewRecordingDownloadName(state.inputFile)
          : authoringExtractDownloadName(state.inputFile)
      }">Download extracted video</a>`;
      return;
    }
    result.innerHTML = `
      <p class="da-note">Extracted MP4 (ffmpeg.wasm):</p>
      <video class="da-authoring-pane__video" src="${url}" controls playsinline autoplay muted></video>
      <a class="da-media-extract-output__download" href="${url}" download="${authoringExtractDownloadName(state.inputFile)}">Download extracted video</a>`;
  });

  wasm.addEventListener('extract-error', (event) => {
    const message = (event as CustomEvent<{ message: string }>).detail.message;
    const result = root.querySelector('[data-ref="auth-extract-result"]');
    if (!result) {
      return;
    }
    result.hidden = false;
    result.className = 'da-note da-note--warn';
    result.textContent = `Extract failed: ${message}`;
  });

  wasm.addEventListener('progress', (event) => {
    const progress = (event as CustomEvent<{ progress: number }>).detail.progress;
    const busy = root.querySelector('[data-ref="auth-extract-busy"]');
    if (busy) {
      busy.hidden = false;
      busy.textContent =
        progress > 0
          ? `Extracting… ${progress}%`
          : 'Extracting… loading ffmpeg.wasm (~31 MB first run)';
    }
  });

  setSourceLoaded(root, false);
  setMode(root, 'none');
}

export function resetAuthoringWiring(): void {
  revokeSourceUrl();
  resetAuthoringPlaybackBar();
  wiredRoot = null;
  state.mode = 'none';
  state.inputFile = null;
  state.recordRange = null;
  state.previewRecording = null;
  state.extractFilter = '';
}
