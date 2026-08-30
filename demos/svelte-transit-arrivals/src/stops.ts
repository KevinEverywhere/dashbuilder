export interface TransitStop {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const TRANSIT_STOPS: TransitStop[] = [
  { id: 'place-north', label: 'North Station', lat: 42.3662, lng: -71.0631 },
  { id: 'place-sstat', label: 'South Station', lat: 42.3519, lng: -71.0552 },
  { id: 'place-pktrm', label: 'Park Street', lat: 42.3564, lng: -71.0624 },
  { id: 'place-bbsta', label: 'Back Bay', lat: 42.3473, lng: -71.0755 },
];

export function getTransitStop(
  id: string,
  stops: TransitStop[] = TRANSIT_STOPS,
): TransitStop | undefined {
  return stops.find((stop) => stop.id === id);
}
