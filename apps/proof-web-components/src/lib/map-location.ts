import type { Destination } from '@destination-atlas';
import { MOCK_DESTINATIONS, getDestinationById } from '@destination-atlas';

export interface MapViewTarget {
  lat: number;
  lng: number;
  zoom: number;
  label: string;
}

/** Resolve a free-text location query against mock destinations or lat/lng pairs. */
export function resolveMapLocationQuery(query: string, locale = 'en'): MapViewTarget | null {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = Number(coordMatch[1]);
    const lng = Number(coordMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng, zoom: 8, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    }
  }

  const needle = trimmed.toLowerCase();
  const match = MOCK_DESTINATIONS.find((dest) => {
    const names = [dest.name, dest.labels?.[locale], dest.id].filter(Boolean) as string[];
    return names.some((name) => name.toLowerCase().includes(needle));
  });

  if (match) {
    return destinationMapView(match, locale);
  }

  return null;
}

export function destinationMapView(dest: Destination, locale = 'en'): MapViewTarget {
  const label = dest.labels?.[locale] ?? dest.name;
  return { lat: dest.lat, lng: dest.lng, zoom: 10, label };
}

export function destinationByIdMapView(id: string, locale = 'en'): MapViewTarget | null {
  const dest = getDestinationById(id);
  return dest ? destinationMapView(dest, locale) : null;
}
