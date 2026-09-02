<script lang="ts">
  import { wrapSignedDegrees } from '@rosettadash/core';

  const MIN_HFOV = 30;
  const MAX_HFOV = 360;
  const PLANET_ZONE_HFOV = 125;
  const MIN_FOCAL_MM = 8;
  const MAX_FOCAL_MM = 200;

  let {
    yaw,
    pitch,
    horizontalFov,
    disabled = false,
    onYawChange,
    onPitchChange,
    onHorizontalFovChange,
    onReset,
    onLittlePlanetPreset,
  }: {
    yaw: number;
    pitch: number;
    horizontalFov: number;
    disabled?: boolean;
    onYawChange?: (value: number) => void;
    onPitchChange?: (value: number) => void;
    onHorizontalFovChange?: (value: number) => void;
    onReset?: () => void;
    onLittlePlanetPreset?: () => void;
  } = $props();

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

  const zoom = $derived(zoomFromHfov(horizontalFov));
  const focalLength = $derived(focalLengthFromHfov(horizontalFov));
  const inPlanetZone = $derived(horizontalFov > PLANET_ZONE_HFOV);

  function stepZoom(delta: number): void {
    onHorizontalFovChange?.(hfovFromZoom(clamp(zoom + delta, 0, 100)));
  }

  function onZoomChange(value: string): void {
    onHorizontalFovChange?.(hfovFromZoom(+value));
  }

  function onFocalChange(value: string): void {
    onHorizontalFovChange?.(hfovFromFocalLength(+value));
  }
</script>

<div class="da-authoring-camera" aria-label="Camera framing controls">
  <div class="da-authoring-camera__header">
    <h4 class="da-authoring-camera__title">Camera framing</h4>
    <div class="da-authoring-camera__actions">
      <button
        type="button"
        class="da-authoring-camera__preset"
        {disabled}
        onclick={() => onLittlePlanetPreset?.()}
      >
        Little planet
      </button>
      <button
        type="button"
        class="da-authoring-camera__step"
        disabled={disabled || zoom >= 100}
        onclick={() => stepZoom(8)}
      >
        Zoom in
      </button>
      <button
        type="button"
        class="da-authoring-camera__step"
        disabled={disabled || zoom <= 0}
        onclick={() => stepZoom(-8)}
      >
        Zoom out
      </button>
      <button type="button" class="da-authoring-camera__reset" {disabled} onclick={() => onReset?.()}>
        Reset
      </button>
    </div>
  </div>

  <label class="da-authoring-camera__row">
    <span class="da-authoring-camera__label">
      Zoom
      <span class="da-authoring-camera__hint">left = zoom out toward little-planet · right = zoom in</span>
    </span>
    <input
      type="range"
      min="0"
      max="100"
      step="0.5"
      value={zoom}
      {disabled}
      oninput={(event) => onZoomChange((event.currentTarget as HTMLInputElement).value)}
    />
    <output class="da-authoring-camera__value">{zoom.toFixed(1)}%</output>
  </label>

  <label class="da-authoring-camera__row">
    <span class="da-authoring-camera__label">
      Focal length
      <span class="da-authoring-camera__hint">35mm full-frame equivalent · longer = zoom in</span>
    </span>
    <input
      type="range"
      min={MIN_FOCAL_MM}
      max={MAX_FOCAL_MM}
      step="0.5"
      value={focalLength}
      {disabled}
      oninput={(event) => onFocalChange((event.currentTarget as HTMLInputElement).value)}
    />
    <output class="da-authoring-camera__value">{focalLength.toFixed(1)}mm</output>
  </label>

  <label class="da-authoring-camera__row">
    <span class="da-authoring-camera__label">
      Horizontal FOV
      <span class="da-authoring-camera__hint">
        {inPlanetZone ? 'little-planet zone (125°–360°)' : 'below 125° = normal rectilinear'}
      </span>
    </span>
    <input
      type="range"
      min={MIN_HFOV}
      max={MAX_HFOV}
      step="1"
      value={horizontalFov}
      {disabled}
      oninput={(event) =>
        onHorizontalFovChange?.(+(event.currentTarget as HTMLInputElement).value)}
    />
    <output class="da-authoring-camera__value">{horizontalFov.toFixed(0)}°</output>
  </label>

  <label class="da-authoring-camera__row">
    <span class="da-authoring-camera__label">Yaw</span>
    <input
      type="range"
      min="-180"
      max="180"
      step="0.5"
      value={yaw}
      {disabled}
      oninput={(event) =>
        onYawChange?.(wrapSignedDegrees(+(event.currentTarget as HTMLInputElement).value))}
    />
    <output class="da-authoring-camera__value">{yaw.toFixed(1)}°</output>
  </label>

  <label class="da-authoring-camera__row">
    <span class="da-authoring-camera__label">
      Pitch
      <span class="da-authoring-camera__hint">down = ground in center for little-planet</span>
    </span>
    <input
      type="range"
      min="-85"
      max="85"
      step="0.5"
      value={pitch}
      {disabled}
      oninput={(event) => onPitchChange?.(+(event.currentTarget as HTMLInputElement).value)}
    />
    <output class="da-authoring-camera__value">{pitch.toFixed(1)}°</output>
  </label>

  <p class="da-note da-authoring-camera__note">
    {#if inPlanetZone}
      Little-planet active. Keep your subject on the <strong>ring</strong> of the disk (horizon), not the
      center — the center is the ground below the camera. Use Yaw to rotate them around the ring; stretched
      heads usually mean the subject is too close to the disk center.
    {:else}
      To match VLC little-planet: click <strong>Little planet</strong>, or drag Zoom all the way
      <strong>left</strong> (0%) and Pitch down to −85°.
    {/if}
  </p>
</div>
