import { TRANSIT_STOPS } from './stops';

export interface TransitPrediction {
  id: string;
  route: string;
  headsign: string;
  status: string;
  minutes: number;
  time: string;
}

export type PredictionSource = 'live' | 'sample';

interface MbtaResource {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string; type?: string } | null }>;
}

interface MbtaResponse {
  data?: MbtaResource[];
  included?: MbtaResource[];
}

const MBTA_PREDICTIONS_URL = 'https://api-v3.mbta.com/predictions';

const SAMPLE_BY_STOP: Record<string, Array<Omit<TransitPrediction, 'id'>>> = {
  'place-north': [
    { route: 'Orange', headsign: 'Oak Grove', status: 'On time', minutes: 3, time: '2:14 PM' },
    { route: 'Orange', headsign: 'Forest Hills', status: 'Boarding', minutes: 1, time: '2:12 PM' },
    { route: 'CR-Fitchburg', headsign: 'Wachusett', status: 'On time', minutes: 11, time: '2:22 PM' },
    { route: 'CR-Newburyport', headsign: 'Rockport', status: 'Delayed', minutes: 18, time: '2:29 PM' },
  ],
  'place-sstat': [
    { route: 'Red', headsign: 'Alewife', status: 'On time', minutes: 2, time: '2:13 PM' },
    { route: 'Red', headsign: 'Ashmont', status: 'On time', minutes: 5, time: '2:16 PM' },
    { route: 'SL1', headsign: 'Logan Airport', status: 'Approaching', minutes: 4, time: '2:15 PM' },
    { route: 'CR-Providence', headsign: 'Wickford Junction', status: 'On time', minutes: 14, time: '2:25 PM' },
  ],
  'place-pktrm': [
    { route: 'Red', headsign: 'Alewife', status: 'On time', minutes: 1, time: '2:12 PM' },
    { route: 'Green-B', headsign: 'Boston College', status: 'On time', minutes: 4, time: '2:15 PM' },
    { route: 'Green-C', headsign: 'Cleveland Circle', status: 'Delayed', minutes: 8, time: '2:19 PM' },
    { route: 'Green-E', headsign: 'Heath Street', status: 'On time', minutes: 6, time: '2:17 PM' },
  ],
  'place-bbsta': [
    { route: 'Orange', headsign: 'Oak Grove', status: 'On time', minutes: 2, time: '2:13 PM' },
    { route: 'Orange', headsign: 'Forest Hills', status: 'On time', minutes: 7, time: '2:18 PM' },
    { route: 'CR-Worcester', headsign: 'Worcester', status: 'On time', minutes: 16, time: '2:27 PM' },
    { route: 'CR-Providence', headsign: 'South Station', status: 'Approaching', minutes: 3, time: '2:14 PM' },
  ],
};

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function includedLabel(resource: MbtaResource | undefined): string {
  if (!resource?.attributes) {
    return '';
  }
  return (
    readString(resource.attributes.headsign) ||
    readString(resource.attributes.short_name) ||
    readString(resource.attributes.long_name) ||
    resource.id
  );
}

function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function minutesUntil(iso: string): number {
  const ms = Date.parse(iso) - Date.now();
  if (Number.isNaN(ms)) {
    return 0;
  }
  return Math.max(0, Math.round(ms / 60_000));
}

function statusFrom(attributes: Record<string, unknown>, minutes: number): string {
  const explicit = readString(attributes.status);
  if (explicit) {
    return explicit;
  }
  if (minutes <= 0) {
    return 'Due';
  }
  if (minutes <= 1) {
    return 'Approaching';
  }
  return 'On time';
}

export function samplePredictions(stopId: string): TransitPrediction[] {
  const rows = SAMPLE_BY_STOP[stopId] ?? SAMPLE_BY_STOP[TRANSIT_STOPS[0].id];
  return rows.map((row, index) => ({
    ...row,
    id: `${stopId}-sample-${index}`,
  }));
}

export function parseMbtaPredictions(payload: MbtaResponse): TransitPrediction[] {
  const included = new Map(
    (payload.included ?? []).map((resource) => [`${resource.type}:${resource.id}`, resource]),
  );

  return (payload.data ?? [])
    .map((item) => {
      const departure = readString(item.attributes?.departure_time) || readString(item.attributes?.arrival_time);
      if (!departure) {
        return null;
      }
      const routeId = item.relationships?.route?.data?.id ?? '';
      const tripId = item.relationships?.trip?.data?.id ?? '';
      const route = included.get(`route:${routeId}`);
      const trip = included.get(`trip:${tripId}`);
      const minutes = minutesUntil(departure);
      return {
        id: item.id,
        route: includedLabel(route) || routeId || 'Route',
        headsign: includedLabel(trip) || 'Outbound',
        status: statusFrom(item.attributes ?? {}, minutes),
        minutes,
        time: formatClock(departure),
      } satisfies TransitPrediction;
    })
    .filter((row): row is TransitPrediction => row !== null)
    .slice(0, 8);
}

export async function fetchMbtaPredictions(
  stopId: string,
  signal?: AbortSignal,
): Promise<TransitPrediction[]> {
  const url = new URL(MBTA_PREDICTIONS_URL);
  url.searchParams.set('filter[stop]', stopId);
  url.searchParams.set('include', 'route,trip');
  url.searchParams.set('sort', 'departure_time');
  url.searchParams.set('page[limit]', '8');

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`MBTA request failed (${response.status})`);
  }
  return parseMbtaPredictions((await response.json()) as MbtaResponse);
}

export async function loadPredictions(
  stopId: string,
  signal?: AbortSignal,
): Promise<{ rows: TransitPrediction[]; source: PredictionSource }> {
  try {
    const rows = await fetchMbtaPredictions(stopId, signal);
    if (rows.length === 0) {
      return { rows: samplePredictions(stopId), source: 'sample' };
    }
    return { rows, source: 'live' };
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    return { rows: samplePredictions(stopId), source: 'sample' };
  }
}
