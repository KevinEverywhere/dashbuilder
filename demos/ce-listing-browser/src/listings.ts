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

export const MAX_LISTINGS_PER_CITY = 10;

const STATUS_SYMBOL: Record<ListingStatus, string> = {
  'For sale': '●',
  Pending: '◐',
};

interface ListingSeed {
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

const SEEDS: ListingSeed[] = [
  { id: 'sf-castro', title: 'Castro walk-up', city: 'San Francisco', lat: 37.7609, lng: -122.435, price: 1_285_000, beds: 2, status: 'For sale', listed: '2026-07-12' },
  { id: 'sf-valencia', title: 'Valencia loft', city: 'San Francisco', lat: 37.7598, lng: -122.421, price: 975_000, beds: 1, status: 'Pending', listed: '2026-06-28' },
  { id: 'sf-sunset', title: 'Sunset bungalow', city: 'San Francisco', lat: 37.7533, lng: -122.494, price: 1_620_000, beds: 3, status: 'For sale', listed: '2026-08-02' },
  { id: 'sf-mission', title: 'Mission flat', city: 'San Francisco', lat: 37.7599, lng: -122.4148, price: 1_145_000, beds: 2, status: 'For sale', listed: '2026-05-18' },
  { id: 'sf-noe', title: 'Noe Valley cottage', city: 'San Francisco', lat: 37.7506, lng: -122.432, price: 1_890_000, beds: 3, status: 'Pending', listed: '2026-04-09' },
  { id: 'sf-richmond', title: 'Richmond Edwardian', city: 'San Francisco', lat: 37.7798, lng: -122.483, price: 1_410_000, beds: 3, status: 'For sale', listed: '2026-03-22' },
  { id: 'sf-pacific', title: 'Pacific Heights view', city: 'San Francisco', lat: 37.7925, lng: -122.438, price: 2_350_000, beds: 4, status: 'For sale', listed: '2026-07-01' },
  { id: 'sf-bernal', title: 'Bernal hill house', city: 'San Francisco', lat: 37.7389, lng: -122.416, price: 1_335_000, beds: 2, status: 'Pending', listed: '2026-02-14' },
  { id: 'sf-potrero', title: 'Potrero live/work', city: 'San Francisco', lat: 37.7576, lng: -122.398, price: 1_080_000, beds: 1, status: 'For sale', listed: '2026-08-16' },
  { id: 'sf-hayes', title: 'Hayes Valley condo', city: 'San Francisco', lat: 37.7765, lng: -122.424, price: 899_000, beds: 1, status: 'Pending', listed: '2025-12-31' },

  { id: 'atx-east', title: 'East 6th bungalow', city: 'Austin', lat: 30.2612, lng: -97.7245, price: 625_000, beds: 3, status: 'For sale', listed: '2026-07-19' },
  { id: 'atx-domain', title: 'Domain condo', city: 'Austin', lat: 30.4002, lng: -97.7258, price: 489_000, beds: 2, status: 'Pending', listed: '2026-06-14' },
  { id: 'atx-southcon', title: 'South Congress cottage', city: 'Austin', lat: 30.248, lng: -97.7501, price: 710_000, beds: 3, status: 'For sale', listed: '2026-08-05' },
  { id: 'atx-hyde', title: 'Hyde Park bungalow', city: 'Austin', lat: 30.3048, lng: -97.725, price: 575_000, beds: 2, status: 'For sale', listed: '2026-05-03' },
  { id: 'atx-mueller', title: 'Mueller modern', city: 'Austin', lat: 30.2968, lng: -97.703, price: 640_000, beds: 3, status: 'Pending', listed: '2026-04-21' },
  { id: 'atx-zilker', title: 'Zilker bungalow', city: 'Austin', lat: 30.2669, lng: -97.772, price: 820_000, beds: 3, status: 'For sale', listed: '2026-03-11' },
  { id: 'atx-clarksville', title: 'Clarksville shotgun', city: 'Austin', lat: 30.2764, lng: -97.759, price: 695_000, beds: 2, status: 'For sale', listed: '2026-07-27' },
  { id: 'atx-cesar', title: 'East Cesar Chavez', city: 'Austin', lat: 30.2576, lng: -97.719, price: 540_000, beds: 2, status: 'Pending', listed: '2026-02-08' },
  { id: 'atx-barton', title: 'Barton Hills ranch', city: 'Austin', lat: 30.2512, lng: -97.787, price: 915_000, beds: 4, status: 'For sale', listed: '2026-06-02' },
  { id: 'atx-crestview', title: 'Crestview midcentury', city: 'Austin', lat: 30.3412, lng: -97.724, price: 560_000, beds: 3, status: 'Pending', listed: '2025-11-18' },

  { id: 'lis-alfama', title: 'Alfama tiled house', city: 'Lisbon', lat: 38.7129, lng: -9.1327, price: 748_000, beds: 3, status: 'For sale', listed: '2026-05-30' },
  { id: 'lis-chiado', title: 'Chiado apartment', city: 'Lisbon', lat: 38.7106, lng: -9.1427, price: 520_000, beds: 2, status: 'For sale', listed: '2026-07-08' },
  { id: 'lis-belem', title: 'Belém view flat', city: 'Lisbon', lat: 38.6968, lng: -9.206, price: 610_000, beds: 2, status: 'Pending', listed: '2026-08-11' },
  { id: 'lis-bairro', title: 'Bairro Alto walk-up', city: 'Lisbon', lat: 38.7122, lng: -9.1465, price: 465_000, beds: 1, status: 'For sale', listed: '2026-04-16' },
  { id: 'lis-graca', title: 'Graça terrace', city: 'Lisbon', lat: 38.7196, lng: -9.1308, price: 690_000, beds: 3, status: 'Pending', listed: '2026-03-29' },
  { id: 'lis-principe', title: 'Príncipe Real salon', city: 'Lisbon', lat: 38.7164, lng: -9.1492, price: 880_000, beds: 3, status: 'For sale', listed: '2026-06-07' },
  { id: 'lis-alcantara', title: 'Alcântara loft', city: 'Lisbon', lat: 38.7038, lng: -9.175, price: 495_000, beds: 2, status: 'For sale', listed: '2026-07-23' },
  { id: 'lis-estrela', title: 'Estrela garden flat', city: 'Lisbon', lat: 38.7111, lng: -9.159, price: 575_000, beds: 2, status: 'Pending', listed: '2026-02-19' },
  { id: 'lis-santos', title: 'Santos warehouse', city: 'Lisbon', lat: 38.7064, lng: -9.154, price: 540_000, beds: 1, status: 'For sale', listed: '2026-08-20' },
  { id: 'lis-avenidas', title: 'Avenidas Novas flat', city: 'Lisbon', lat: 38.7352, lng: -9.146, price: 430_000, beds: 2, status: 'Pending', listed: '2025-10-05' },

  { id: 'tyo-shibuya', title: 'Shibuya studio', city: 'Tokyo', lat: 35.6595, lng: 139.7004, price: 420_000, beds: 1, status: 'For sale', listed: '2026-06-21' },
  { id: 'tyo-setagaya', title: 'Setagaya family house', city: 'Tokyo', lat: 35.6462, lng: 139.6533, price: 890_000, beds: 3, status: 'Pending', listed: '2026-07-25' },
  { id: 'tyo-shimokita', title: 'Shimokitazawa walk-up', city: 'Tokyo', lat: 35.6616, lng: 139.667, price: 510_000, beds: 1, status: 'For sale', listed: '2026-05-12' },
  { id: 'tyo-nakameguro', title: 'Nakameguro riverside', city: 'Tokyo', lat: 35.6442, lng: 139.699, price: 760_000, beds: 2, status: 'For sale', listed: '2026-08-08' },
  { id: 'tyo-koenji', title: 'Kōenji wooden house', city: 'Tokyo', lat: 35.7056, lng: 139.649, price: 455_000, beds: 2, status: 'Pending', listed: '2026-04-04' },
  { id: 'tyo-kichijoji', title: 'Kichijōji garden flat', city: 'Tokyo', lat: 35.7031, lng: 139.58, price: 680_000, beds: 3, status: 'For sale', listed: '2026-03-17' },
  { id: 'tyo-meguro', title: 'Meguro maisonette', city: 'Tokyo', lat: 35.6333, lng: 139.716, price: 720_000, beds: 2, status: 'For sale', listed: '2026-07-04' },
  { id: 'tyo-jiyugaoka', title: 'Jiyūgaoka townhouse', city: 'Tokyo', lat: 35.6076, lng: 139.669, price: 835_000, beds: 3, status: 'Pending', listed: '2026-02-26' },
  { id: 'tyo-sangen', title: 'Sangenjaya studio', city: 'Tokyo', lat: 35.6435, lng: 139.6698, price: 390_000, beds: 1, status: 'For sale', listed: '2026-06-09' },
  { id: 'tyo-daikan', title: 'Daikanyama loft', city: 'Tokyo', lat: 35.648, lng: 139.703, price: 940_000, beds: 2, status: 'Pending', listed: '2025-09-14' },
];

export const LISTINGS: Listing[] = SEEDS;

export function filterListings(city: string, listings: Listing[] = LISTINGS): Listing[] {
  const rows = city ? listings.filter((listing) => listing.city === city) : listings;
  if (!city) {
    return CITIES.flatMap((entry) =>
      rows.filter((listing) => listing.city === entry.value).slice(0, MAX_LISTINGS_PER_CITY),
    );
  }
  return rows.slice(0, MAX_LISTINGS_PER_CITY);
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function statusSymbol(status: ListingStatus): string {
  return STATUS_SYMBOL[status];
}

/** `7/12` in the current year; `12/31/25` otherwise. */
export function formatListed(isoDate: string, now: Date = new Date()): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === now.getFullYear()) {
    return `${month}/${day}`;
  }
  return `${month}/${day}/${String(year).slice(-2)}`;
}
