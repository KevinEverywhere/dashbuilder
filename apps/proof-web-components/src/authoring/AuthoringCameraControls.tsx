/** Full-frame horizontal reference for focal-length display. */
const SENSOR_WIDTH_MM = 36;
const MIN_HFOV = 30;
const MAX_HFOV = 360;
/** VLC-style little planet: max zoom-out + look straight down at nadir. */
export const LITTLE_PLANET_HFOV = MAX_HFOV;
export const LITTLE_PLANET_PITCH = -85;
const PLANET_ZONE_HFOV = 125;
const MIN_FOCAL_MM = 8;
const MAX_FOCAL_MM = 200;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** 0 = widest (little-planet), 100 = tightest (telephoto). Log scale across full FOV range. */
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

type SliderRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled?: boolean;
  hint?: string;
  onChange: (value: number) => void;
};

function SliderRow({ label, value, min, max, step, unit, disabled, hint, onChange }: SliderRowProps) {
  return (
    <label className="da-authoring-camera__row">
      <span className="da-authoring-camera__label">
        {label}
        {hint ? <span className="da-authoring-camera__hint">{hint}</span> : null}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output className="da-authoring-camera__value">
        {Number.isFinite(value) ? value.toFixed(step < 1 ? 1 : 0) : '—'}
        {unit}
      </output>
    </label>
  );
}

type Props = {
  yaw: number;
  pitch: number;
  horizontalFov: number;
  disabled?: boolean;
  onYawChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  onHorizontalFovChange: (value: number) => void;
  onReset?: () => void;
  onLittlePlanetPreset?: () => void;
};

export function AuthoringCameraControls({
  yaw,
  pitch,
  horizontalFov,
  disabled = false,
  onYawChange,
  onPitchChange,
  onHorizontalFovChange,
  onReset,
  onLittlePlanetPreset,
}: Props) {
  const zoom = zoomFromHfov(horizontalFov);
  const focalLength = focalLengthFromHfov(horizontalFov);
  const inPlanetZone = horizontalFov > PLANET_ZONE_HFOV;

  const stepZoom = (delta: number) => {
    onHorizontalFovChange(hfovFromZoom(clamp(zoom + delta, 0, 100)));
  };

  return (
    <div className="da-authoring-camera" aria-label="Camera framing controls">
      <div className="da-authoring-camera__header">
        <h4 className="da-authoring-camera__title">Camera framing</h4>
        <div className="da-authoring-camera__actions">
          {onLittlePlanetPreset ? (
            <button
              type="button"
              className="da-authoring-camera__preset"
              disabled={disabled}
              onClick={onLittlePlanetPreset}
            >
              Little planet
            </button>
          ) : null}
          <button type="button" className="da-authoring-camera__step" disabled={disabled || zoom >= 100} onClick={() => stepZoom(8)}>
            Zoom in
          </button>
          <button type="button" className="da-authoring-camera__step" disabled={disabled || zoom <= 0} onClick={() => stepZoom(-8)}>
            Zoom out
          </button>
          {onReset ? (
            <button type="button" className="da-authoring-camera__reset" disabled={disabled} onClick={onReset}>
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <SliderRow
        label="Zoom"
        value={zoom}
        min={0}
        max={100}
        step={0.5}
        unit="%"
        disabled={disabled}
        hint="left = zoom out toward little-planet · right = zoom in"
        onChange={(nextZoom) => onHorizontalFovChange(hfovFromZoom(nextZoom))}
      />
      <SliderRow
        label="Focal length"
        value={focalLength}
        min={MIN_FOCAL_MM}
        max={MAX_FOCAL_MM}
        step={0.5}
        unit="mm"
        disabled={disabled}
        hint="35mm full-frame equivalent · longer = zoom in"
        onChange={(nextFocal) => onHorizontalFovChange(hfovFromFocalLength(nextFocal))}
      />
      <SliderRow
        label="Horizontal FOV"
        value={horizontalFov}
        min={MIN_HFOV}
        max={MAX_HFOV}
        step={1}
        unit="°"
        disabled={disabled}
        hint={inPlanetZone ? 'little-planet zone (125°–360°)' : 'below 125° = normal rectilinear'}
        onChange={onHorizontalFovChange}
      />
      <SliderRow
        label="Yaw"
        value={yaw}
        min={-180}
        max={180}
        step={0.5}
        unit="°"
        disabled={disabled}
        onChange={onYawChange}
      />
      <SliderRow
        label="Pitch"
        value={pitch}
        min={-85}
        max={85}
        step={0.5}
        unit="°"
        disabled={disabled}
        hint="down = ground in center for little-planet"
        onChange={onPitchChange}
      />

      <p className="da-note da-authoring-camera__note">
        {inPlanetZone ? (
          <>
            Little-planet active. Keep your subject on the <strong>ring</strong> of the disk (horizon), not
            the center — the center is the ground below the camera. Use Yaw to rotate them around the ring;
            stretched heads usually mean the subject is too close to the disk center.
          </>
        ) : (
          <>
            To match VLC little-planet: click <strong>Little planet</strong>, or drag Zoom all the way{' '}
            <strong>left</strong> (0%) and Pitch down to −85°.
          </>
        )}
      </p>
    </div>
  );
}
