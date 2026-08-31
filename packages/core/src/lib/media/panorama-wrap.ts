/** Positive remainder so a drag can cross 0 without a jump. */
export function wrapPeriod(value: number, period: number): number {
  if (!(period > 0) || !Number.isFinite(value)) {
    return 0;
  }
  return ((value % period) + period) % period;
}

/**
 * CSS `background-position: N%` is not a 360 unwrap: 0% and 100% are the
 * same alignment, so wrapping percent offset skips about one viewport.
 * Pan in pixels and wrap on the painted image width instead.
 */
export function headingFromPanOffset(offsetPx: number, imageWidth: number): number {
  if (!(imageWidth > 0)) {
    return 0;
  }
  return Math.round((wrapPeriod(offsetPx, imageWidth) / imageWidth) * 360) % 360;
}

export function formatPanHeading(degrees: number): string {
  return `${wrapPeriod(degrees, 360)}°`;
}

/** Map any heading onto (-180, 180] — Destination Atlas yaw sliders. */
export function wrapSignedDegrees(value: number): number {
  const wrapped = wrapPeriod(value + 180, 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
}
