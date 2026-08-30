export type ListingStatus = 'For sale' | 'Pending';

export interface Listing {
  id: string;
  title: string;
  city: string;
  lat: number;
  lng: number;
  price: number;
  beds: number;
  status: ListingStatus;
  listed: string;
}

export const CITIES = [
  { value: 'San Francisco', label: 'San Francisco' },
  { value: 'Austin', label: 'Austin' },
  { value: 'Lisbon', label: 'Lisbon' },
  { value: 'Tokyo', label: 'Tokyo' },
] as const;

export const LISTINGS: Listing[] = [
  {
    id: 'sf-castro',
    title: 'Castro walk-up',
    city: 'San Francisco',
    lat: 37.7609,
    lng: -122.435,
    price: 1_285_000,
    beds: 2,
    status: 'For sale',
    listed: '2026-07-12',
  },
  {
    id: 'sf-valencia',
    title: 'Valencia loft',
    city: 'San Francisco',
    lat: 37.7598,
    lng: -122.421,
    price: 975_000,
    beds: 1,
    status: 'Pending',
    listed: '2026-06-28',
  },
  {
    id: 'sf-sunset',
    title: 'Sunset bungalow',
    city: 'San Francisco',
    lat: 37.7533,
    lng: -122.494,
    price: 1_620_000,
    beds: 3,
    status: 'For sale',
    listed: '2026-08-02',
  },
  {
    id: 'atx-east',
    title: 'East 6th bungalow',
    city: 'Austin',
    lat: 30.2612,
    lng: -97.7245,
    price: 625_000,
    beds: 3,
    status: 'For sale',
    listed: '2026-07-19',
  },
  {
    id: 'atx-domain',
    title: 'Domain condo',
    city: 'Austin',
    lat: 30.4002,
    lng: -97.7258,
    price: 489_000,
    beds: 2,
    status: 'Pending',
    listed: '2026-06-14',
  },
  {
    id: 'lis-alfama',
    title: 'Alfama tiled house',
    city: 'Lisbon',
    lat: 38.7129,
    lng: -9.1327,
    price: 748_000,
    beds: 3,
    status: 'For sale',
    listed: '2026-05-30',
  },
  {
    id: 'lis-chiado',
    title: 'Chiado apartment',
    city: 'Lisbon',
    lat: 38.7106,
    lng: -9.1427,
    price: 520_000,
    beds: 2,
    status: 'For sale',
    listed: '2026-07-08',
  },
  {
    id: 'lis-belem',
    title: 'Belém view flat',
    city: 'Lisbon',
    lat: 38.6968,
    lng: -9.206,
    price: 610_000,
    beds: 2,
    status: 'Pending',
    listed: '2026-08-11',
  },
  {
    id: 'tyo-shibuya',
    title: 'Shibuya studio',
    city: 'Tokyo',
    lat: 35.6595,
    lng: 139.7004,
    price: 420_000,
    beds: 1,
    status: 'For sale',
    listed: '2026-06-21',
  },
  {
    id: 'tyo-setagaya',
    title: 'Setagaya family house',
    city: 'Tokyo',
    lat: 35.6462,
    lng: 139.6533,
    price: 890_000,
    beds: 3,
    status: 'Pending',
    listed: '2026-07-25',
  },
];

export function filterListings(city: string, listings: Listing[] = LISTINGS): Listing[] {
  if (!city) {
    return listings;
  }
  return listings.filter((listing) => listing.city === city);
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
