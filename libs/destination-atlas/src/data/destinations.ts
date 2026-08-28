import type { Destination, DestinationContinentId, DestinationHistoricStat } from '../types.js';

export { DESTINATION_CONTINENT_OPTIONS } from '../types.js';
export type { DestinationContinentId } from '../types.js';

/** Calendar years in the mock visitor series. */
export const DESTINATION_HISTORY_YEARS = [
  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024,
] as const;

export function historicYearsForPreset(preset: string): number[] {
  const years = [...DESTINATION_HISTORY_YEARS];
  if (preset === '1y') {
    return years.slice(-1);
  }
  if (preset === '5y') {
    return years.slice(-5);
  }
  return years;
}

/**
 * Demo-grade international overnight-visitor guesstimates.
 * Anchored on a 2019 peak and 2024 current, with a COVID trough in 2020–21.
 * Not official arrivals statistics.
 */
function historicVisitorSeries(peak2019: number, current2024: number): DestinationHistoricStat[] {
  const covidFactor: Record<number, number> = {
    2020: 0.2,
    2021: 0.34,
    2022: 0.58,
    2023: 0.84,
  };
  return DESTINATION_HISTORY_YEARS.map((year) => {
    let visitors: number;
    if (year === 2024) {
      visitors = current2024;
    } else if (year === 2019) {
      visitors = peak2019;
    } else if (year < 2019) {
      const t = (year - 2015) / 4;
      visitors = Math.round(peak2019 * (0.76 + t * 0.24));
    } else {
      visitors = Math.round(peak2019 * (covidFactor[year] ?? 0.84));
    }
    return { year, visitors };
  });
}

interface DestinationSeed {
  id: string;
  name: string;
  region: DestinationContinentId;
  lat: number;
  lng: number;
  youtubeId: string;
  peak2019: number;
  current2024: number;
  labels?: Record<string, string>;
  travelRating: number;
  hubDistanceKm: number;
  avgTripPriceUsd: number;
}

function fromSeed(seed: DestinationSeed): Destination {
  return {
    id: seed.id,
    name: seed.name,
    region: seed.region,
    lat: seed.lat,
    lng: seed.lng,
    youtubeId: seed.youtubeId,
    visitorsCurrent: seed.current2024,
    visitorsHistoric: historicVisitorSeries(seed.peak2019, seed.current2024),
    labels: seed.labels,
    travelRating: seed.travelRating,
    hubDistanceKm: seed.hubDistanceKm,
    avgTripPriceUsd: seed.avgTripPriceUsd,
  };
}

/** Five cities per inhabited continent (30 total). YouTube-only — no shipped 360° / VR sources. */
const DESTINATION_SEEDS: DestinationSeed[] = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    region: 'asia',
    lat: 35.6762,
    lng: 139.6503,
    youtubeId: 'D6RjVfUym6Q',
    peak2019: 14_240_000,
    current2024: 15_800_000,
    labels: { es: 'Tokio', fr: 'Tokyo', ja: '東京' },
    travelRating: 4.8,
    hubDistanceKm: 40,
    avgTripPriceUsd: 3200,
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    region: 'asia',
    lat: 13.7563,
    lng: 100.5018,
    youtubeId: 'tShApc1jGPk',
    peak2019: 22_800_000,
    current2024: 22_000_000,
    labels: { th: 'กรุงเทพมหานคร' },
    travelRating: 4.5,
    hubDistanceKm: 28,
    avgTripPriceUsd: 1600,
  },
  {
    id: 'singapore',
    name: 'Singapore',
    region: 'asia',
    lat: 1.3521,
    lng: 103.8198,
    youtubeId: 'Qu8F8D3PR2U',
    peak2019: 19_100_000,
    current2024: 16_500_000,
    labels: { zh: '新加坡' },
    travelRating: 4.7,
    hubDistanceKm: 20,
    avgTripPriceUsd: 2400,
  },
  {
    id: 'seoul',
    name: 'Seoul',
    region: 'asia',
    lat: 37.5665,
    lng: 126.978,
    youtubeId: 'w-m4UON2Hlk',
    peak2019: 17_500_000,
    current2024: 16_200_000,
    labels: { ko: '서울' },
    travelRating: 4.6,
    hubDistanceKm: 55,
    avgTripPriceUsd: 2100,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    region: 'asia',
    lat: 19.076,
    lng: 72.8777,
    youtubeId: 'DFQO7Zn-KM4',
    peak2019: 5_200_000,
    current2024: 6_000_000,
    labels: { hi: 'मुंबई' },
    travelRating: 4.2,
    hubDistanceKm: 30,
    avgTripPriceUsd: 1400,
  },
  {
    id: 'paris',
    name: 'Paris',
    region: 'europe',
    lat: 48.8566,
    lng: 2.3522,
    youtubeId: '_XwP2ldJOJs',
    peak2019: 19_100_000,
    current2024: 12_100_000,
    labels: { es: 'París', fr: 'Paris' },
    travelRating: 4.6,
    hubDistanceKm: 25,
    avgTripPriceUsd: 2800,
  },
  {
    id: 'london',
    name: 'London',
    region: 'europe',
    lat: 51.5074,
    lng: -0.1278,
    youtubeId: '5aocR5-gXPo',
    peak2019: 21_700_000,
    current2024: 20_300_000,
    labels: { fr: 'Londres', es: 'Londres' },
    travelRating: 4.5,
    hubDistanceKm: 22,
    avgTripPriceUsd: 3000,
  },
  {
    id: 'rome',
    name: 'Rome',
    region: 'europe',
    lat: 41.9028,
    lng: 12.4964,
    youtubeId: 'tYHbA9BMU9Q',
    peak2019: 10_300_000,
    current2024: 11_200_000,
    labels: { it: 'Roma', es: 'Roma', fr: 'Rome' },
    travelRating: 4.6,
    hubDistanceKm: 32,
    avgTripPriceUsd: 2300,
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    region: 'europe',
    lat: 41.3874,
    lng: 2.1686,
    youtubeId: 'AdkWedQHnKY',
    peak2019: 9_500_000,
    current2024: 12_000_000,
    labels: { es: 'Barcelona', ca: 'Barcelona' },
    travelRating: 4.5,
    hubDistanceKm: 15,
    avgTripPriceUsd: 2200,
  },
  {
    id: 'berlin',
    name: 'Berlin',
    region: 'europe',
    lat: 52.52,
    lng: 13.405,
    youtubeId: '1qitNAzhxQk',
    peak2019: 14_000_000,
    current2024: 13_500_000,
    labels: { de: 'Berlin' },
    travelRating: 4.4,
    hubDistanceKm: 18,
    avgTripPriceUsd: 2100,
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    region: 'africa',
    lat: 31.6295,
    lng: -7.9811,
    youtubeId: 'BKQTQzECCzc',
    peak2019: 2_400_000,
    current2024: 2_900_000,
    labels: { fr: 'Marrakech', ar: 'مراكش' },
    travelRating: 4.5,
    hubDistanceKm: 2100,
    avgTripPriceUsd: 1900,
  },
  {
    id: 'cairo',
    name: 'Cairo',
    region: 'africa',
    lat: 30.0444,
    lng: 31.2357,
    youtubeId: 'WF1_KSmqtvI',
    peak2019: 5_800_000,
    current2024: 6_500_000,
    labels: { ar: 'القاهرة', fr: 'Le Caire' },
    travelRating: 4.3,
    hubDistanceKm: 22,
    avgTripPriceUsd: 1500,
  },
  {
    id: 'cape-town',
    name: 'Cape Town',
    region: 'africa',
    lat: -33.9249,
    lng: 18.4241,
    youtubeId: 'BSxV9nUfDAU',
    peak2019: 2_100_000,
    current2024: 2_400_000,
    labels: { af: 'Kaapstad' },
    travelRating: 4.7,
    hubDistanceKm: 20,
    avgTripPriceUsd: 2100,
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    region: 'africa',
    lat: -1.2921,
    lng: 36.8219,
    youtubeId: 'RXWjAdAVZRE',
    peak2019: 1_500_000,
    current2024: 1_800_000,
    labels: { sw: 'Nairobi' },
    travelRating: 4.2,
    hubDistanceKm: 18,
    avgTripPriceUsd: 1700,
  },
  {
    id: 'lagos',
    name: 'Lagos',
    region: 'africa',
    lat: 6.5244,
    lng: 3.3792,
    youtubeId: 'LZJ000F-CLc',
    peak2019: 1_200_000,
    current2024: 1_600_000,
    travelRating: 4.0,
    hubDistanceKm: 22,
    avgTripPriceUsd: 1600,
  },
  {
    id: 'new-york',
    name: 'New York City',
    region: 'north-america',
    lat: 40.7128,
    lng: -74.006,
    youtubeId: 'AdIwEvr6-vk',
    peak2019: 13_500_000,
    current2024: 13_300_000,
    labels: { es: 'Nueva York', fr: 'New York' },
    travelRating: 4.3,
    hubDistanceKm: 15,
    avgTripPriceUsd: 2600,
  },
  {
    id: 'mexico-city',
    name: 'Mexico City',
    region: 'north-america',
    lat: 19.4326,
    lng: -99.1332,
    youtubeId: 'VF-dBUHjIc8',
    peak2019: 6_800_000,
    current2024: 7_400_000,
    labels: { es: 'Ciudad de México' },
    travelRating: 4.4,
    hubDistanceKm: 8,
    avgTripPriceUsd: 1400,
  },
  {
    id: 'toronto',
    name: 'Toronto',
    region: 'north-america',
    lat: 43.6532,
    lng: -79.3832,
    youtubeId: 'yNun-Rs-OU4',
    peak2019: 4_500_000,
    current2024: 4_900_000,
    travelRating: 4.3,
    hubDistanceKm: 25,
    avgTripPriceUsd: 2200,
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    region: 'north-america',
    lat: 34.0522,
    lng: -118.2437,
    youtubeId: '3ecyAHQDsIU',
    peak2019: 7_200_000,
    current2024: 7_500_000,
    labels: { es: 'Los Ángeles' },
    travelRating: 4.2,
    hubDistanceKm: 30,
    avgTripPriceUsd: 2500,
  },
  {
    id: 'vancouver',
    name: 'Vancouver',
    region: 'north-america',
    lat: 49.2827,
    lng: -123.1207,
    youtubeId: 'SYzzp-khjiQ',
    peak2019: 4_100_000,
    current2024: 4_400_000,
    travelRating: 4.5,
    hubDistanceKm: 12,
    avgTripPriceUsd: 2400,
  },
  {
    id: 'cusco',
    name: 'Cusco',
    region: 'south-america',
    lat: -13.5319,
    lng: -71.9675,
    youtubeId: '1La4QzGeaaQ',
    peak2019: 1_620_000,
    current2024: 1_450_000,
    labels: { es: 'Cuzco' },
    travelRating: 4.7,
    hubDistanceKm: 5800,
    avgTripPriceUsd: 2400,
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    region: 'south-america',
    lat: -22.9068,
    lng: -43.1729,
    youtubeId: 'm4pT1j2-c-s',
    peak2019: 2_300_000,
    current2024: 2_800_000,
    labels: { pt: 'Rio de Janeiro', es: 'Río de Janeiro' },
    travelRating: 4.4,
    hubDistanceKm: 20,
    avgTripPriceUsd: 1800,
  },
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    region: 'south-america',
    lat: -34.6037,
    lng: -58.3816,
    youtubeId: 'O_xXKUQVu2Q',
    peak2019: 2_700_000,
    current2024: 3_100_000,
    labels: { es: 'Buenos Aires' },
    travelRating: 4.5,
    hubDistanceKm: 5,
    avgTripPriceUsd: 1700,
  },
  {
    id: 'bogota',
    name: 'Bogotá',
    region: 'south-america',
    lat: 4.711,
    lng: -74.0721,
    youtubeId: '-CSMfkbM2QY',
    peak2019: 1_400_000,
    current2024: 1_900_000,
    labels: { es: 'Bogotá' },
    travelRating: 4.2,
    hubDistanceKm: 12,
    avgTripPriceUsd: 1500,
  },
  {
    id: 'santiago',
    name: 'Santiago',
    region: 'south-america',
    lat: -33.4489,
    lng: -70.6693,
    youtubeId: 'w6uoJ1fUBpM',
    peak2019: 1_800_000,
    current2024: 2_100_000,
    labels: { es: 'Santiago' },
    travelRating: 4.3,
    hubDistanceKm: 18,
    avgTripPriceUsd: 1600,
  },
  {
    id: 'sydney',
    name: 'Sydney',
    region: 'oceania',
    lat: -33.8688,
    lng: 151.2093,
    youtubeId: '_9g4OLdUkvU',
    peak2019: 4_800_000,
    current2024: 4_200_000,
    travelRating: 4.4,
    hubDistanceKm: 8800,
    avgTripPriceUsd: 4100,
  },
  {
    id: 'melbourne',
    name: 'Melbourne',
    region: 'oceania',
    lat: -37.8136,
    lng: 144.9631,
    youtubeId: 'Prz2VJOdtEE',
    peak2019: 3_200_000,
    current2024: 2_900_000,
    travelRating: 4.5,
    hubDistanceKm: 22,
    avgTripPriceUsd: 3800,
  },
  {
    id: 'auckland',
    name: 'Auckland',
    region: 'oceania',
    lat: -36.8509,
    lng: 174.7645,
    youtubeId: 'XcsVwkZawOU',
    peak2019: 2_900_000,
    current2024: 2_700_000,
    travelRating: 4.4,
    hubDistanceKm: 22,
    avgTripPriceUsd: 3600,
  },
  {
    id: 'queenstown',
    name: 'Queenstown',
    region: 'oceania',
    lat: -45.0312,
    lng: 168.6626,
    youtubeId: 'JzTy9pLj9Uc',
    peak2019: 1_100_000,
    current2024: 1_300_000,
    travelRating: 4.8,
    hubDistanceKm: 480,
    avgTripPriceUsd: 3900,
  },
  {
    id: 'honolulu',
    name: 'Honolulu',
    region: 'oceania',
    lat: 21.3069,
    lng: -157.8583,
    youtubeId: 'saRic7RKpdo',
    peak2019: 6_500_000,
    current2024: 6_100_000,
    travelRating: 4.4,
    hubDistanceKm: 12,
    avgTripPriceUsd: 3200,
  },
];

/** Sample destinations — current + 10-year historic visitor guesstimates for proof apps. */
export const MOCK_DESTINATIONS: Destination[] = DESTINATION_SEEDS.map(fromSeed);

export function getDestinationById(id: string): Destination | undefined {
  return MOCK_DESTINATIONS.find((d) => d.id === id);
}

export function formatVisitorCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}K`;
  }
  return String(n);
}
