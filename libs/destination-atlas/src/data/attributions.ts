import type { GeoMapProvider } from '../types.js';
import { commonsFilePageUrl, getAuthoring360Source } from './authoring-360-sources.js';

/** One screen-visible credit block (maps, video, 360°, WASM, etc.). */
export interface AttributionNotice {
  kind: string;
  summary: string;
  links?: Array<{ label: string; href: string }>;
  license?: string;
}

export function attributionNoticeJson(notice: AttributionNotice): string {
  return JSON.stringify(notice);
}

export const YOUTUBE_PLATFORM_ATTRIBUTION: AttributionNotice = {
  kind: 'Video platform',
  summary:
    'Embedded via YouTube. Playback, ads, and branding are subject to Google Terms of Service.',
  links: [
    { label: 'YouTube Terms of Service', href: 'https://www.youtube.com/t/terms' },
    { label: 'Google Privacy Policy', href: 'https://policies.google.com/privacy' },
  ],
};

export function youtubeVideoAttribution(videoId: string): AttributionNotice {
  return {
    kind: 'Video',
    summary: `YouTube video ${videoId}. Uploader retains copyright; embed subject to YouTube ToS.`,
    links: [
      { label: 'Watch on YouTube', href: `https://www.youtube.com/watch?v=${videoId}` },
      ...(YOUTUBE_PLATFORM_ATTRIBUTION.links ?? []),
    ],
  };
}

export function mapProviderAttribution(provider: GeoMapProvider): AttributionNotice {
  switch (provider) {
    case 'leaflet':
      return {
        kind: 'Map data',
        summary: '© OpenStreetMap contributors. Map engine: Leaflet (BSD-2-Clause).',
        links: [
          { label: 'OpenStreetMap copyright', href: 'https://www.openstreetmap.org/copyright' },
          { label: 'Leaflet', href: 'https://leafletjs.com/' },
        ],
      };
    case 'maplibre':
      return {
        kind: 'Map data',
        summary:
          'Vector map via MapLibre GL (BSD-3-Clause). Tile host terms apply to your configured style URL.',
        links: [
          { label: 'MapLibre', href: 'https://maplibre.org/' },
          { label: 'OpenMapTiles license (common host)', href: 'https://openmaptiles.org/license/' },
        ],
      };
    case 'google-maps':
      return {
        kind: 'Map data',
        summary: '© Google. Subject to Google Maps Platform Terms of Service.',
        links: [
          {
            label: 'Google Maps Platform Terms',
            href: 'https://cloud.google.com/maps-platform/terms',
          },
        ],
      };
    default:
      return {
        kind: 'Map data',
        summary: 'Third-party map tiles and engine terms apply.',
      };
  }
}

export const GLOBE_EQUIRECT_ATTRIBUTION: AttributionNotice = {
  kind: 'Globe texture',
  summary: 'Equirectangular world map from Wikimedia Commons (public domain).',
  links: [
    {
      label: 'Commons file',
      href: 'https://commons.wikimedia.org/wiki/File:Equirectangular_projection_SW.jpg',
    },
    { label: 'Wikimedia Commons licensing', href: 'https://commons.wikimedia.org/wiki/Commons:Licensing' },
  ],
};

/** @deprecated Prefer GLOBE_EQUIRECT_ATTRIBUTION.summary in new UI. */
export const DEFAULT_WORLD_EQUIRECT_ATTRIBUTION = GLOBE_EQUIRECT_ATTRIBUTION.summary;

export const THREE_JS_ATTRIBUTION: AttributionNotice = {
  kind: '3D engine',
  summary: 'Globe and 360° previews rendered with Three.js (MIT).',
  links: [{ label: 'Three.js', href: 'https://threejs.org/' }],
};

export function authoring360Attribution(destinationId: string): AttributionNotice | null {
  const source = getAuthoring360Source(destinationId);
  if (!source) {
    return null;
  }
  return {
    kind: '360° source',
    summary: `${source.label} — ${source.credit}. Encoded from a Wikimedia Commons still.`,
    links: [
      { label: 'Commons file', href: commonsFilePageUrl(source.commonsTitle) },
      { label: 'Wikimedia Commons licensing', href: 'https://commons.wikimedia.org/wiki/Commons:Licensing' },
    ],
    license: source.license,
  };
}

export const FFMPEG_WASM_ATTRIBUTION: AttributionNotice = {
  kind: 'Extract engine',
  summary:
    'Browser transcode via ffmpeg.wasm. FFmpeg is LGPL/GPL depending on build; see project license.',
  links: [
    { label: 'ffmpeg.wasm', href: 'https://ffmpegwasm.netlify.app/' },
    { label: 'FFmpeg licensing', href: 'https://www.ffmpeg.org/legal.html' },
  ],
};

export const MAPILLARY_COMMONS_NOTE =
  'Some Commons stills originate from Mapillary uploads; credit and CC license follow the file page.';
