import { wrapSignedDegrees } from '@rosettadash/core';

export const LITTLE_PLANET_HFOV = 360;
export const LITTLE_PLANET_PITCH = -85;

const MIN_HFOV = 30;
const MAX_HFOV = 360;
const PLANET_ZONE_HFOV = 125;
const MIN_FOCAL_MM = 8;
const MAX_FOCAL_MM = 200;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function zoomFromHfov(hfov: number): number {
  const logMin = Math.log(MIN_HFOV);
  const logMax = Math.log(MAX_HFOV);
  const logFov = Math.log(clamp(hfov, MIN_HFOV, MAX_HFOV));
  return clamp(((logFov - logMax) / (logMin - logMax)) * 100, 0, 100);
}

function hfovFromZoom(zoomPercent: number): number {
  const t = clamp(zoomPercent, 0, 100) / 100;
  const logMin = Math.log(MIN_HFOV);
  const logMax = Math.log(MAX_HFOV);
  return Math.exp(logMax + t * (logMin - logMax));
}

function focalLengthFromHfov(hfov: number): number {
  const zoom = zoomFromHfov(hfov) / 100;
  const logMin = Math.log(MIN_FOCAL_MM);
  const logMax = Math.log(MAX_FOCAL_MM);
  return Math.exp(logMin + (1 - zoom) * (logMax - logMin));
}

function hfovFromFocalLength(focal: number): number {
  const f = clamp(focal, MIN_FOCAL_MM, MAX_FOCAL_MM);
  const logMin = Math.log(MIN_FOCAL_MM);
  const logMax = Math.log(MAX_FOCAL_MM);
  const zoom = 1 - (Math.log(f) - logMin) / (logMax - logMin);
  return hfovFromZoom(zoom * 100);
}

export function renderAuthoringCameraControlsMarkup(): string {
  return `
    <div class="da-authoring-camera" data-ref="auth-camera" hidden aria-label="Camera framing controls">
      <div class="da-authoring-camera__header">
        <h4 class="da-authoring-camera__title">Camera framing</h4>
        <div class="da-authoring-camera__actions">
          <button type="button" class="da-authoring-camera__preset" data-ref="auth-camera-planet">Little planet</button>
          <button type="button" class="da-authoring-camera__step" data-ref="auth-camera-zoom-in">Zoom in</button>
          <button type="button" class="da-authoring-camera__step" data-ref="auth-camera-zoom-out">Zoom out</button>
          <button type="button" class="da-authoring-camera__reset" data-ref="auth-camera-reset">Reset</button>
        </div>
      </div>
      <label class="da-authoring-camera__row">
        <span class="da-authoring-camera__label">Zoom<span class="da-authoring-camera__hint">left = zoom out toward little-planet · right = zoom in</span></span>
        <input type="range" data-ref="auth-camera-zoom" min="0" max="100" step="0.5" value="50" />
        <output class="da-authoring-camera__value" data-ref="auth-camera-zoom-out">50%</output>
      </label>
      <label class="da-authoring-camera__row">
        <span class="da-authoring-camera__label">Focal length<span class="da-authoring-camera__hint">35mm full-frame equivalent · longer = zoom in</span></span>
        <input type="range" data-ref="auth-camera-focal" min="${MIN_FOCAL_MM}" max="${MAX_FOCAL_MM}" step="0.5" value="35" />
        <output class="da-authoring-camera__value" data-ref="auth-camera-focal-out">35mm</output>
      </label>
      <label class="da-authoring-camera__row">
        <span class="da-authoring-camera__label">Horizontal FOV<span class="da-authoring-camera__hint" data-ref="auth-camera-fov-hint">below 125° = normal rectilinear</span></span>
        <input type="range" data-ref="auth-camera-hfov" min="${MIN_HFOV}" max="${MAX_HFOV}" step="1" value="75" />
        <output class="da-authoring-camera__value" data-ref="auth-camera-hfov-out">75°</output>
      </label>
      <label class="da-authoring-camera__row">
        <span class="da-authoring-camera__label">Yaw</span>
        <input type="range" data-ref="auth-camera-yaw" min="-180" max="180" step="0.5" value="25" />
        <output class="da-authoring-camera__value" data-ref="auth-camera-yaw-out">25°</output>
      </label>
      <label class="da-authoring-camera__row">
        <span class="da-authoring-camera__label">Pitch<span class="da-authoring-camera__hint">down = ground in center for little-planet</span></span>
        <input type="range" data-ref="auth-camera-pitch" min="-85" max="85" step="0.5" value="-8" />
        <output class="da-authoring-camera__value" data-ref="auth-camera-pitch-out">-8°</output>
      </label>
      <p class="da-note da-authoring-camera__note" data-ref="auth-camera-note"></p>
    </div>`;
}

export type CameraState = {
  yaw: number;
  pitch: number;
  horizontalFov: number;
};

type CameraWireOptions = {
  getState: () => CameraState;
  onChange: (partial: Partial<CameraState>) => void;
  onReset: () => void;
};

function syncCameraOutputs(root: HTMLElement, state: CameraState): void {
  const zoom = zoomFromHfov(state.horizontalFov);
  const focal = focalLengthFromHfov(state.horizontalFov);
  const inPlanet = state.horizontalFov > PLANET_ZONE_HFOV;

  root.querySelector<HTMLInputElement>('[data-ref="auth-camera-zoom"]')!.value = String(zoom);
  root.querySelector('[data-ref="auth-camera-zoom-out"]')!.textContent = `${zoom.toFixed(1)}%`;
  root.querySelector<HTMLInputElement>('[data-ref="auth-camera-focal"]')!.value = String(focal);
  root.querySelector('[data-ref="auth-camera-focal-out"]')!.textContent = `${focal.toFixed(1)}mm`;
  root.querySelector<HTMLInputElement>('[data-ref="auth-camera-hfov"]')!.value = String(state.horizontalFov);
  root.querySelector('[data-ref="auth-camera-hfov-out"]')!.textContent = `${state.horizontalFov.toFixed(0)}°`;
  root.querySelector<HTMLInputElement>('[data-ref="auth-camera-yaw"]')!.value = String(state.yaw);
  root.querySelector('[data-ref="auth-camera-yaw-out"]')!.textContent = `${state.yaw.toFixed(1)}°`;
  root.querySelector<HTMLInputElement>('[data-ref="auth-camera-pitch"]')!.value = String(state.pitch);
  root.querySelector('[data-ref="auth-camera-pitch-out"]')!.textContent = `${state.pitch.toFixed(1)}°`;

  const fovHint = root.querySelector('[data-ref="auth-camera-fov-hint"]');
  if (fovHint) {
    fovHint.textContent = inPlanet ? 'little-planet zone (125°–360°)' : 'below 125° = normal rectilinear';
  }
  const note = root.querySelector('[data-ref="auth-camera-note"]');
  if (note) {
    note.innerHTML = inPlanet
      ? 'Little-planet active. Keep your subject on the <strong>ring</strong> of the disk (horizon), not the center — the center is the ground below the camera.'
      : 'To match VLC little-planet: click <strong>Little planet</strong>, or drag Zoom all the way <strong>left</strong> (0%) and Pitch down to −85°.';
  }

  root.querySelector<HTMLButtonElement>('[data-ref="auth-camera-zoom-in"]')!.disabled = zoom >= 100;
  root.querySelector<HTMLButtonElement>('[data-ref="auth-camera-zoom-out"]')!.disabled = zoom <= 0;
}

export function wireAuthoringCameraControls(root: HTMLElement, options: CameraWireOptions): void {
  syncCameraOutputs(root, options.getState());

  root.querySelector('[data-ref="auth-camera-zoom"]')?.addEventListener('input', (event) => {
    const value = Number((event.target as HTMLInputElement).value);
    options.onChange({ horizontalFov: hfovFromZoom(value) });
    syncCameraOutputs(root, options.getState());
  });

  root.querySelector('[data-ref="auth-camera-focal"]')?.addEventListener('input', (event) => {
    const value = Number((event.target as HTMLInputElement).value);
    options.onChange({ horizontalFov: hfovFromFocalLength(value) });
    syncCameraOutputs(root, options.getState());
  });

  root.querySelector('[data-ref="auth-camera-hfov"]')?.addEventListener('input', (event) => {
    options.onChange({ horizontalFov: Number((event.target as HTMLInputElement).value) });
    syncCameraOutputs(root, options.getState());
  });

  root.querySelector('[data-ref="auth-camera-yaw"]')?.addEventListener('input', (event) => {
    options.onChange({ yaw: wrapSignedDegrees(Number((event.target as HTMLInputElement).value)) });
    syncCameraOutputs(root, options.getState());
  });

  root.querySelector('[data-ref="auth-camera-pitch"]')?.addEventListener('input', (event) => {
    options.onChange({ pitch: Number((event.target as HTMLInputElement).value) });
    syncCameraOutputs(root, options.getState());
  });

  root.querySelector('[data-ref="auth-camera-planet"]')?.addEventListener('click', () => {
    options.onChange({ horizontalFov: LITTLE_PLANET_HFOV, pitch: LITTLE_PLANET_PITCH });
    syncCameraOutputs(root, options.getState());
  });

  root.querySelector('[data-ref="auth-camera-zoom-in"]')?.addEventListener('click', () => {
    const state = options.getState();
    options.onChange({ horizontalFov: hfovFromZoom(clamp(zoomFromHfov(state.horizontalFov) + 8, 0, 100)) });
    syncCameraOutputs(root, options.getState());
  });

  root.querySelector('[data-ref="auth-camera-zoom-out"]')?.addEventListener('click', () => {
    const state = options.getState();
    options.onChange({ horizontalFov: hfovFromZoom(clamp(zoomFromHfov(state.horizontalFov) - 8, 0, 100)) });
    syncCameraOutputs(root, options.getState());
  });

  root.querySelector('[data-ref="auth-camera-reset"]')?.addEventListener('click', () => {
    options.onReset();
    syncCameraOutputs(root, options.getState());
  });
}

export function refreshAuthoringCameraControls(root: HTMLElement, state: CameraState): void {
  syncCameraOutputs(root, state);
}
