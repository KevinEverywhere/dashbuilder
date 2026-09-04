import type { EnvFieldDefinition } from './types';

/** Canonical env keys for Destination Atlas / consumer app integrations. */
export const GOOGLE_MAPS_API_KEY = 'GOOGLE_MAPS_API_KEY';
export const MAPTILER_API_KEY = 'MAPTILER_API_KEY';

/** Legacy / demo aliases surfaced in Stack infra panels. */
export const CONSUMER_SECRET_ALIASES: Record<string, string[]> = {
  [GOOGLE_MAPS_API_KEY]: ['GOOGLE_MAPS_KEY', 'VITE_GOOGLE_MAPS_API_KEY'],
  [MAPTILER_API_KEY]: ['VITE_MAPTILER_API_KEY'],
};

export const CONSUMER_INTEGRATION_FIELDS: EnvFieldDefinition[] = [
  {
    id: 'integration-google-maps',
    envKey: GOOGLE_MAPS_API_KEY,
    label: 'Google Maps API key',
    description:
      'Required when geo-map provider is google-maps. Stored in this browser only — never sent to RosettaDash servers.',
    category: 'integration',
    sensitive: true,
    placeholder: 'AIza…',
  },
  {
    id: 'integration-maptiler',
    envKey: MAPTILER_API_KEY,
    label: 'MapTiler API key',
    description:
      'Optional vector tile host for MapLibre GL. Without a key, demo MapLibre tiles are used.',
    category: 'integration',
    sensitive: true,
    placeholder: 'MapTiler key…',
    optional: true,
  },
];

export function canonicalConsumerSecretKey(envKey: string): string {
  for (const field of CONSUMER_INTEGRATION_FIELDS) {
    if (field.envKey === envKey) {
      return field.envKey;
    }
    const aliases = CONSUMER_SECRET_ALIASES[field.envKey];
    if (aliases?.includes(envKey)) {
      return field.envKey;
    }
  }
  return envKey;
}

export function consumerSecretAliases(envKey: string): string[] {
  return CONSUMER_SECRET_ALIASES[envKey] ?? [];
}

export function buildMapTilerStyleUrl(apiKey: string): string {
  return `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(apiKey)}`;
}
