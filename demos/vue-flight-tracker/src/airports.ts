export interface Airport {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const AIRPORTS: Airport[] = [
  { id: 'jfk', label: 'JFK — New York', lat: 40.6413, lng: -73.7781 },
  { id: 'lhr', label: 'LHR — London', lat: 51.47, lng: -0.4543 },
  { id: 'lax', label: 'LAX — Los Angeles', lat: 33.9416, lng: -118.4085 },
  { id: 'sfo', label: 'SFO — San Francisco', lat: 37.6213, lng: -122.379 },
  { id: 'cdg', label: 'CDG — Paris', lat: 49.0097, lng: 2.5479 },
];

export function getAirport(id: string, airports: Airport[] = AIRPORTS): Airport | undefined {
  return airports.find((airport) => airport.id === id);
}
