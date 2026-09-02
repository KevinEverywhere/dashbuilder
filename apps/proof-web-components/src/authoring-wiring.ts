import { isEquirectSourceDimensions } from '@rosettadash/core';

type DashRow = Record<string, string | number | boolean | null | undefined>;

type SetPropertyElement = HTMLElement & { setProperty(name: string, value: unknown): void };

let wiredRoot: HTMLElement | null = null;

function syncWasmFromViewport(wasm: SetPropertyElement, crop: DashRow): void {
  wasm.setProperty('cropRegion', crop);
  if (crop.yaw != null) wasm.setAttribute('yaw', String(crop.yaw));
  if (crop.pitch != null) wasm.setAttribute('pitch', String(crop.pitch));
  if (crop.horizontalFov != null) wasm.setAttribute('horizontal-fov', String(crop.horizontalFov));
  if (crop.previewMode === 'flat-crop' || crop.previewMode === 'rectilinear') {
    wasm.setAttribute('extraction-mode', String(crop.previewMode));
  }
}

function applyViewportNumbers(root: HTMLElement): void {
  const viewport = root.querySelector('[data-ref="auth-equirect"]');
  if (!viewport) return;
  const readNum = (ref: string, attr: string) => {
    const value = root.querySelector(`[data-ref="${ref}"]`)?.getAttribute('value');
    if (value != null && value !== '') {
      viewport.setAttribute(attr, value);
    }
  };
  readNum('auth-yaw', 'yaw');
  readNum('auth-pitch', 'pitch');
  readNum('auth-fov', 'horizontal-fov');
}

function applyTrim(root: HTMLElement, wasm: SetPropertyElement): void {
  const start = root.querySelector('[data-ref="auth-trim-start"]')?.getAttribute('value');
  const end = root.querySelector('[data-ref="auth-trim-end"]')?.getAttribute('value');
  if (start != null && start !== '') wasm.setAttribute('trim-start-sec', start);
  if (end != null && end !== '') wasm.setAttribute('trim-end-sec', end);
}

export function wireAuthoringPipeline(root: HTMLElement): void {
  if (wiredRoot === root) {
    return;
  }
  wiredRoot = root;

  const videoSource = root.querySelector('[data-ref="auth-video-source"]');
  const viewport = root.querySelector('[data-ref="auth-equirect"]');
  const wasm = root.querySelector('[data-ref="auth-wasm"]') as SetPropertyElement | null;
  const result = root.querySelector('[data-ref="auth-extract-result"]');

  if (!videoSource || !viewport || !wasm) {
    return;
  }

  videoSource.addEventListener('video-file', (event) => {
    const detail = (event as CustomEvent<{ file: File; metadata: DashRow }>).detail;
    const width = Number(detail.metadata.sourceWidth ?? 0);
    const height = Number(detail.metadata.sourceHeight ?? 0);
    const equirect = width > 0 && height > 0 && isEquirectSourceDimensions(width, height);
    const previewMode = equirect ? 'rectilinear' : 'flat-crop';
    viewport.setAttribute('preview-mode', previewMode);
    if (width > 0) viewport.setAttribute('source-width', String(width));
    if (height > 0) viewport.setAttribute('source-height', String(height));
    wasm.setAttribute('extraction-mode', previewMode);
    wasm.setProperty('inputFile', detail.file);
    applyTrim(root, wasm);
  });

  viewport.addEventListener('crop-region', (event) => {
    const crop = (event as CustomEvent<DashRow>).detail;
    syncWasmFromViewport(wasm, crop);
  });

  ['auth-yaw', 'auth-pitch', 'auth-fov'].forEach((ref) => {
    root.querySelector(`[data-ref="${ref}"]`)?.addEventListener('value-change', () => {
      applyViewportNumbers(root);
    });
  });

  ['auth-trim-start', 'auth-trim-end'].forEach((ref) => {
    root.querySelector(`[data-ref="${ref}"]`)?.addEventListener('value-change', () => {
      applyTrim(root, wasm);
    });
  });

  wasm.addEventListener('extract-complete', (event) => {
    const detail = (event as CustomEvent<{ blob?: Blob }>).detail;
    if (!result || !detail.blob) return;
    const url = URL.createObjectURL(detail.blob);
    result.hidden = false;
    result.innerHTML = `<p>Extracted MP4 (ffmpeg.wasm):</p><video src="${url}" controls playsinline style="max-width:100%"></video>`;
  });

  wasm.addEventListener('extract-error', (event) => {
    const message = (event as CustomEvent<{ message: string }>).detail.message;
    if (!result) return;
    result.hidden = false;
    result.textContent = message;
  });
}

export function resetAuthoringWiring(): void {
  wiredRoot = null;
}
