/** BCP-47 locale option for app-level i18n (developer-owned translations). */
export interface AppLocaleOption {
  code: string;
  label: string;
  nativeLabel?: string;
}

/** Supported 2D map backends — developer selects via component `provider` prop. */
export type GeoMapProvider = 'maplibre' | 'leaflet' | 'google-maps';

export interface GeoMapProviderInfo {
  id: GeoMapProvider;
  label: string;
  costSummary: string;
  apiKeyRequired: boolean;
  notes: string;
}

export const GEO_MAP_PROVIDERS: GeoMapProviderInfo[] = [
  {
    id: 'leaflet',
    label: 'Leaflet',
    costSummary: 'OSS engine; tile costs depend on provider (OSM has usage policies)',
    apiKeyRequired: false,
    notes: 'Recommended default — lightweight raster maps with reliable rendering.',
  },
  {
    id: 'maplibre',
    label: 'MapLibre GL',
    costSummary: 'OSS engine; vector tiles often via paid/free-tier host (e.g. MapTiler)',
    apiKeyRequired: true,
    notes: 'Modern vector maps; tiles often need a third-party key.',
  },
  {
    id: 'google-maps',
    label: 'Google Maps',
    costSummary: 'Free tier then usage-based billing',
    apiKeyRequired: true,
    notes: 'Strong geocoding and POI data; Google branding and Terms of Service apply.',
  },
];

export interface DestinationHistoricStat {
  year: number;
  visitors: number;
}

/** Inhabited continents used by Destination Atlas (no Antarctica). */
export type DestinationContinentId =
  | 'africa'
  | 'asia'
  | 'europe'
  | 'north-america'
  | 'south-america'
  | 'oceania';

export const DESTINATION_CONTINENT_OPTIONS: { value: DestinationContinentId; label: string }[] = [
  { value: 'africa', label: 'Africa' },
  { value: 'asia', label: 'Asia' },
  { value: 'europe', label: 'Europe' },
  { value: 'north-america', label: 'North America' },
  { value: 'south-america', label: 'South America' },
  { value: 'oceania', label: 'Oceania' },
];

/** Mock destination row for Destination Atlas proof apps. */
export interface Destination {
  id: string;
  name: string;
  /** Continent id — same values as DESTINATION_CONTINENT_OPTIONS. */
  region: DestinationContinentId;
  lat: number;
  lng: number;
  youtubeId?: string;
  /** When `equirect`, show 360° tooling; default flat for standard video. */
  videoProjection?: 'flat' | 'equirect';
  equirectUrl?: string;
  /** Shipped 360° source video for Authoring (CORS-readable URL). */
  equirectVideoUrl?: string;
  visitorsCurrent: number;
  visitorsHistoric: DestinationHistoricStat[];
  /** Optional per-locale labels — wired by developer i18n, not RosettaDash chrome. */
  labels?: Record<string, string>;
  /** Average traveler rating (1–5) for analytics views. */
  travelRating?: number;
  /** Distance from a reference hub airport in km. */
  hubDistanceKm?: number;
  /** Typical packaged trip price in USD. */
  avgTripPriceUsd?: number;
}

export type { DestinationAtlasScreenId } from '@rosettadash/core';
import {
  atlasScreenVisibleInNav,
  type DestinationAtlasScreenId,
} from '@rosettadash/core';

export interface DestinationAtlasScreen {
  id: DestinationAtlasScreenId;
  label: string;
  description: string;
}

export const DESTINATION_ATLAS_SCREENS: DestinationAtlasScreen[] = [
  {
    id: 'about',
    label: 'About',
    description: 'Proof app purpose, runtime guides, and how to run Storybook.',
  },
  {
    id: 'overview',
    label: 'Overview',
    description: 'Current KPIs and historic visitor trends.',
  },
  {
    id: 'destinations',
    label: 'Destinations',
    description: 'Searchable table with detail panel and filters.',
  },
  {
    id: 'maps',
    label: 'Maps',
    description: '2D map and 3D globe — switch panels without leaving the tab.',
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Flat YouTube embeds; 360° destinations route to Authoring (library autoload + extract).',
  },
  {
    id: 'intel',
    label: 'News',
    description:
      'Destination-scoped headlines from Google News RSS via the builder API (~24h cache).',
  },
  {
    id: 'authoring',
    label: 'Authoring',
    description:
      'Upload source video (flat or 360°); record trim range; preview crop or sphere POV; ffmpeg.wasm extract.',
  },
  {
    id: 'plan',
    label: 'Plan',
    description: 'Trip planning forms and role-gated collaboration.',
  },
  {
    id: 'views',
    label: 'Views',
    description: 'Hidden route stub — advanced chart demos (not in nav).',
  },
  {
    id: 'stack',
    label: 'Stack',
    description: 'Read-only infra configuration demo.',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'App base language and client-side integration keys (BYOK).',
  },
];

/** Screens shown in the proof-app tab bar. Views stays hidden (DAS-164); News (intel) is visible. */
export const DESTINATION_ATLAS_NAV_SCREENS = DESTINATION_ATLAS_SCREENS.filter((screen) =>
  atlasScreenVisibleInNav(screen.id),
);

export const DEFAULT_APP_LOCALES: AppLocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
];
