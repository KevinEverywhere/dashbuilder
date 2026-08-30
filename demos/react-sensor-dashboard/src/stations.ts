export interface SensorStation {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const SENSOR_STATIONS: SensorStation[] = [
  { id: 'los-angeles', label: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { id: 'new-york', label: 'New York', lat: 40.7128, lng: -74.006 },
  { id: 'london', label: 'London', lat: 51.5074, lng: -0.1278 },
  { id: 'delhi', label: 'Delhi', lat: 28.6139, lng: 77.209 },
  { id: 'tokyo', label: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { id: 'mexico-city', label: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  { id: 'paris', label: 'Paris', lat: 48.8566, lng: 2.3522 },
  { id: 'beijing', label: 'Beijing', lat: 39.9042, lng: 116.4074 },
];

export function getSensorStation(
  id: string,
  stations: SensorStation[] = SENSOR_STATIONS,
): SensorStation | undefined {
  return stations.find((station) => station.id === id);
}
