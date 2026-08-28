import {
  buildMapTilerStyleUrl,
  canonicalConsumerSecretKey,
  CONSUMER_AI_FIELDS,
  CONSUMER_INTEGRATION_FIELDS,
  ConsumerSecretsStore,
  GOOGLE_MAPS_API_KEY,
  MAPTILER_API_KEY,
  NEWS_API_KEY,
  resolveConsumerSecret,
  resolveGoogleMapsApiKey,
  type EnvFieldDefinition,
} from '@rosettadash/core';
import { getViteBuildEnv } from './build-env';

export { GOOGLE_MAPS_API_KEY, MAPTILER_API_KEY, NEWS_API_KEY, CONSUMER_INTEGRATION_FIELDS };

export function createAtlasSecretsStore(): ConsumerSecretsStore {
  return new ConsumerSecretsStore();
}

export function resolveAtlasSecret(
  store: ConsumerSecretsStore,
  envKey: string,
): string {
  return resolveConsumerSecret(envKey, store, { buildEnv: getViteBuildEnv() });
}

export function resolveAtlasGoogleMapsKey(store: ConsumerSecretsStore): string {
  return resolveGoogleMapsApiKey(store, { buildEnv: getViteBuildEnv() });
}

export function resolveAtlasMapTilerKey(store: ConsumerSecretsStore): string {
  return resolveAtlasSecret(store, MAPTILER_API_KEY);
}

export function resolveAtlasNewsKey(store: ConsumerSecretsStore): string {
  return resolveAtlasSecret(store, NEWS_API_KEY);
}

export function maplibreTileUrlForStore(store: ConsumerSecretsStore): string | undefined {
  const mapTilerKey = resolveAtlasMapTilerKey(store);
  return mapTilerKey ? buildMapTilerStyleUrl(mapTilerKey) : undefined;
}

export function integrationKeyStatus(
  store: ConsumerSecretsStore,
  envKeys: string[],
): Array<{ envKey: string; configured: boolean }> {
  return envKeys.map((envKey) => ({
    envKey,
    configured: isAtlasKeyConfigured(store, envKey),
  }));
}

export function isAtlasKeyConfigured(store: ConsumerSecretsStore, envKey: string): boolean {
  const canonical = canonicalConsumerSecretKey(envKey);
  if (resolveAtlasSecret(store, canonical)) {
    return true;
  }
  return store.hasSecretValue(canonical);
}

export function atlasIntegrationFields(): EnvFieldDefinition[] {
  return CONSUMER_INTEGRATION_FIELDS;
}

export function atlasAiFields(): EnvFieldDefinition[] {
  return CONSUMER_AI_FIELDS;
}

export function atlasAllSecretFields(): EnvFieldDefinition[] {
  return [...atlasIntegrationFields(), ...atlasAiFields()];
}
