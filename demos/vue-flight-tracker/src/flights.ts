import type { Airport } from './airports';

export interface Aircraft {
  id: string;
  callsign: string;
  country: string;
  lat: number;
  lng: number;
  onGround: boolean;
  altitudeFt: number;
  speedKts: number;
  sample: boolean;
}

export interface FlightSnapshot {
  aircraft: Aircraft[];
  sample: boolean;
}

interface OpenSkyResponse {
  states?: Array<Array<string | number | boolean | null>> | null;
}

const BOX_DEG = 1.2;
const MS_TO_KTS = 1.94384;
const M_TO_FT = 3.28084;

const SAMPLE_OFFSETS: Array<{
  dlat: number;
  dlng: number;
  callsign: string;
  country: string;
  alt: number;
  kts: number;
  onGround?: boolean;
}> = [
  { dlat: 0.18, dlng: -0.22, callsign: 'UAL112', country: 'United States', alt: 11200, kts: 428 },
  { dlat: -0.12, dlng: 0.31, callsign: 'BAW284', country: 'United Kingdom', alt: 9800, kts: 402 },
  { dlat: 0.34, dlng: 0.08, callsign: 'AFR019', country: 'France', alt: 14600, kts: 455 },
  { dlat: -0.28, dlng: -0.14, callsign: 'DAL441', country: 'United States', alt: 7200, kts: 318 },
  { dlat: 0.07, dlng: 0.41, callsign: 'JAL016', country: 'Japan', alt: 0, kts: 18, onGround: true },
  { dlat: -0.41, dlng: 0.19, callsign: 'QFA12', country: 'Australia', alt: 18900, kts: 488 },
];

function clampLat(value: number): number {
  return Math.min(90, Math.max(-90, value));
}

function formatCallsign(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function sampleAircraft(airport: Airport): Aircraft[] {
  return SAMPLE_OFFSETS.map((row, index) => ({
    id: `${airport.id}-sample-${index}`,
    callsign: row.callsign,
    country: row.country,
    lat: airport.lat + row.dlat,
    lng: airport.lng + row.dlng,
    onGround: Boolean(row.onGround),
    altitudeFt: row.alt,
    speedKts: row.kts,
    sample: true,
  }));
}

function parseStates(states: Array<Array<string | number | boolean | null>>): Aircraft[] {
  const planes: Aircraft[] = [];
  for (const state of states) {
    const lon = asNumber(state[5]);
    const lat = asNumber(state[6]);
    if (lat == null || lon == null) {
      continue;
    }
    const icao = typeof state[0] === 'string' ? state[0] : `${lat},${lon}`;
    const altitudeM = asNumber(state[13]) ?? 0;
    const velocityMs = asNumber(state[10]) ?? 0;
    planes.push({
      id: icao,
      callsign: formatCallsign(state[1], icao.toUpperCase()),
      country: typeof state[2] === 'string' && state[2] ? state[2] : 'Unknown',
      lat,
      lng: lon,
      onGround: state[8] === true,
      altitudeFt: Math.round(altitudeM * M_TO_FT),
      speedKts: Math.round(velocityMs * MS_TO_KTS),
      sample: false,
    });
  }
  return planes;
}

export async function fetchAirportTraffic(
  airport: Airport,
  signal?: AbortSignal,
): Promise<FlightSnapshot> {
  const lamin = clampLat(airport.lat - BOX_DEG);
  const lamax = clampLat(airport.lat + BOX_DEG);
  const lomin = airport.lng - BOX_DEG;
  const lomax = airport.lng + BOX_DEG;
  const params = new URLSearchParams({
    lamin: String(lamin),
    lomin: String(lomin),
    lamax: String(lamax),
    lomax: String(lomax),
  });

  try {
    const response = await fetch(`/opensky/api/states/all?${params}`, { signal });
    if (!response.ok) {
      throw new Error(`OpenSky request failed (${response.status})`);
    }
    const body = (await response.json()) as OpenSkyResponse;
    return { aircraft: parseStates(body.states ?? []), sample: false };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return { aircraft: sampleAircraft(airport), sample: true };
  }
}
