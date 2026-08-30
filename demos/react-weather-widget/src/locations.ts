export interface WeatherLocation {
  id: string;
  label: string;
  meta: string;
  lat: number;
  lng: number;
}

/** Destination Atlas cities, slimmed to id / label / region / coordinates. */
export const DEFAULT_WEATHER_LOCATIONS: WeatherLocation[] = [
  { id: 'tokyo', label: 'Tokyo', meta: 'Asia', lat: 35.6762, lng: 139.6503 },
  { id: 'bangkok', label: 'Bangkok', meta: 'Asia', lat: 13.7563, lng: 100.5018 },
  { id: 'singapore', label: 'Singapore', meta: 'Asia', lat: 1.3521, lng: 103.8198 },
  { id: 'seoul', label: 'Seoul', meta: 'Asia', lat: 37.5665, lng: 126.978 },
  { id: 'mumbai', label: 'Mumbai', meta: 'Asia', lat: 19.076, lng: 72.8777 },
  { id: 'paris', label: 'Paris', meta: 'Europe', lat: 48.8566, lng: 2.3522 },
  { id: 'london', label: 'London', meta: 'Europe', lat: 51.5074, lng: -0.1278 },
  { id: 'rome', label: 'Rome', meta: 'Europe', lat: 41.9028, lng: 12.4964 },
  { id: 'barcelona', label: 'Barcelona', meta: 'Europe', lat: 41.3874, lng: 2.1686 },
  { id: 'berlin', label: 'Berlin', meta: 'Europe', lat: 52.52, lng: 13.405 },
  { id: 'marrakech', label: 'Marrakech', meta: 'Africa', lat: 31.6295, lng: -7.9811 },
  { id: 'cairo', label: 'Cairo', meta: 'Africa', lat: 30.0444, lng: 31.2357 },
  { id: 'cape-town', label: 'Cape Town', meta: 'Africa', lat: -33.9249, lng: 18.4241 },
  { id: 'nairobi', label: 'Nairobi', meta: 'Africa', lat: -1.2921, lng: 36.8219 },
  { id: 'lagos', label: 'Lagos', meta: 'Africa', lat: 6.5244, lng: 3.3792 },
  { id: 'new-york', label: 'New York City', meta: 'North America', lat: 40.7128, lng: -74.006 },
  { id: 'mexico-city', label: 'Mexico City', meta: 'North America', lat: 19.4326, lng: -99.1332 },
  { id: 'toronto', label: 'Toronto', meta: 'North America', lat: 43.6532, lng: -79.3832 },
  { id: 'los-angeles', label: 'Los Angeles', meta: 'North America', lat: 34.0522, lng: -118.2437 },
  { id: 'vancouver', label: 'Vancouver', meta: 'North America', lat: 49.2827, lng: -123.1207 },
  { id: 'cusco', label: 'Cusco', meta: 'South America', lat: -13.5319, lng: -71.9675 },
  { id: 'rio', label: 'Rio de Janeiro', meta: 'South America', lat: -22.9068, lng: -43.1729 },
  { id: 'buenos-aires', label: 'Buenos Aires', meta: 'South America', lat: -34.6037, lng: -58.3816 },
  { id: 'bogota', label: 'Bogotá', meta: 'South America', lat: 4.711, lng: -74.0721 },
  { id: 'santiago', label: 'Santiago', meta: 'South America', lat: -33.4489, lng: -70.6693 },
  { id: 'sydney', label: 'Sydney', meta: 'Oceania', lat: -33.8688, lng: 151.2093 },
  { id: 'melbourne', label: 'Melbourne', meta: 'Oceania', lat: -37.8136, lng: 144.9631 },
  { id: 'auckland', label: 'Auckland', meta: 'Oceania', lat: -36.8509, lng: 174.7645 },
  { id: 'queenstown', label: 'Queenstown', meta: 'Oceania', lat: -45.0312, lng: 168.6626 },
  { id: 'honolulu', label: 'Honolulu', meta: 'Oceania', lat: 21.3069, lng: -157.8583 },
];

export function getWeatherLocation(
  id: string,
  locations: WeatherLocation[] = DEFAULT_WEATHER_LOCATIONS,
): WeatherLocation | undefined {
  return locations.find((location) => location.id === id);
}
