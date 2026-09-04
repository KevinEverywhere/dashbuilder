import {
  buildMapTilerStyleUrl,
  canonicalConsumerSecretKey,
  CONSUMER_INTEGRATION_FIELDS,
  GOOGLE_MAPS_API_KEY,
  MAPTILER_API_KEY,
} from './integration-catalog';
import { resolveConsumerSecret, resolveGoogleMapsApiKey } from './resolve-consumer-secret';

describe('integration-catalog', () => {
  it('lists Destination Atlas integration keys', () => {
    expect(CONSUMER_INTEGRATION_FIELDS.map((field) => field.envKey)).toEqual([
      GOOGLE_MAPS_API_KEY,
      MAPTILER_API_KEY,
    ]);
  });

  it('normalizes legacy aliases to canonical keys', () => {
    expect(canonicalConsumerSecretKey('GOOGLE_MAPS_KEY')).toBe(GOOGLE_MAPS_API_KEY);
    expect(canonicalConsumerSecretKey('VITE_GOOGLE_MAPS_API_KEY')).toBe(GOOGLE_MAPS_API_KEY);
  });

  it('builds MapTiler style URLs', () => {
    expect(buildMapTilerStyleUrl('abc123')).toBe(
      'https://api.maptiler.com/maps/streets-v2/style.json?key=abc123',
    );
  });
});

describe('resolve-consumer-secret', () => {
  it('prefers vault values over build env', () => {
    const value = resolveConsumerSecret(
      GOOGLE_MAPS_API_KEY,
      { getValue: () => 'vault-key' },
      { buildEnv: { VITE_GOOGLE_MAPS_API_KEY: 'build-key' } },
    );
    expect(value).toBe('vault-key');
  });

  it('falls back to VITE build env aliases', () => {
    const value = resolveGoogleMapsApiKey(
      { getValue: () => '' },
      { buildEnv: { VITE_GOOGLE_MAPS_API_KEY: 'from-vite' } },
    );
    expect(value).toBe('from-vite');
  });
});
