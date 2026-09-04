import { getContext, setContext } from 'svelte';
import { scoutAiProviderReady, type ConsumerSecretsSnapshot, type EnvFieldDefinition } from '@rosettadash/core';
import {
  atlasAiFields,
  atlasAllSecretFields,
  atlasIntegrationFields,
  createAtlasSecretsStore,
  integrationKeyStatus,
  isAtlasKeyConfigured,
  resolveAtlasGoogleMapsKey,
  resolveAtlasMapTilerKey,
  resolveAtlasSecret,
  maplibreTileUrlForStore,
  GOOGLE_MAPS_API_KEY,
  MAPTILER_API_KEY,
} from './atlas-secrets';

export interface ConsumerSecretsContextValue {
  readonly loaded: boolean;
  readonly rememberKeys: boolean;
  readonly saveMessage: string | null;
  readonly integrationFields: EnvFieldDefinition[];
  readonly aiFields: EnvFieldDefinition[];
  getDraftValue: (envKey: string) => string;
  setDraftValue: (envKey: string, value: string) => void;
  setRememberKeys: (remember: boolean) => void;
  save: () => Promise<void>;
  clearAll: () => Promise<void>;
  hasConfiguredKey: (envKey: string) => boolean;
  resolveSecret: (envKey: string) => string;
  readonly scoutAiReady: boolean;
  readonly googleMapsApiKey: string;
  readonly mapTilerApiKey: string;
  readonly maplibreTileUrl?: string;
  stackKeyStatus: (envKeys: string[]) => Array<{ envKey: string; configured: boolean }>;
}

const ConsumerSecretsKey = Symbol('ConsumerSecrets');

export function provideConsumerSecrets(): ConsumerSecretsContextValue {
  const store = createAtlasSecretsStore();
  let loaded = $state(false);
  let saveMessage = $state<string | null>(null);
  let draftValues = $state<Record<string, string>>({});
  let snapshot = $state<ConsumerSecretsSnapshot>({
    settings: store.getSettings(),
    secretKeys: [],
  });

  store.subscribe((next) => {
    snapshot = next;
  });

  function syncDraftFromStore() {
    const next: Record<string, string> = {};
    for (const field of atlasAllSecretFields()) {
      next[field.envKey] = store.getValue(field.envKey);
    }
    draftValues = next;
  }

  void store.initialize().then(() => {
    loaded = true;
    syncDraftFromStore();
  });

  function getDraftValue(envKey: string) {
    return draftValues[envKey] ?? '';
  }

  function setDraftValue(envKey: string, value: string) {
    draftValues = { ...draftValues, [envKey]: value };
  }

  function setRememberKeys(remember: boolean) {
    store.setRememberKeys(remember);
  }

  async function save() {
    for (const field of atlasAllSecretFields()) {
      store.setSecretValue(field.envKey, draftValues[field.envKey] ?? '');
    }
    await store.save();
    saveMessage = 'Keys saved in this browser.';
    window.setTimeout(() => {
      saveMessage = null;
    }, 4000);
  }

  async function clearAll() {
    store.clearAll();
    syncDraftFromStore();
    saveMessage = 'Cleared keys from this browser.';
    window.setTimeout(() => {
      saveMessage = null;
    }, 4000);
  }

  function hasConfiguredKey(envKey: string) {
    return isAtlasKeyConfigured(store, envKey);
  }

  function resolveSecret(envKey: string) {
    return resolveAtlasSecret(store, envKey);
  }

  const value: ConsumerSecretsContextValue = {
    get loaded() {
      return loaded;
    },
    get rememberKeys() {
      return snapshot.settings.rememberKeys;
    },
    get saveMessage() {
      return saveMessage;
    },
    integrationFields: atlasIntegrationFields(),
    aiFields: atlasAiFields(),
    getDraftValue,
    setDraftValue,
    setRememberKeys,
    save,
    clearAll,
    hasConfiguredKey,
    resolveSecret,
    get scoutAiReady() {
      return scoutAiProviderReady(hasConfiguredKey, resolveSecret);
    },
    get googleMapsApiKey() {
      return resolveAtlasGoogleMapsKey(store);
    },
    get mapTilerApiKey() {
      return resolveAtlasMapTilerKey(store);
    },
    get maplibreTileUrl() {
      return maplibreTileUrlForStore(store);
    },
    stackKeyStatus: (envKeys: string[]) => integrationKeyStatus(store, envKeys),
  };

  setContext(ConsumerSecretsKey, value);
  return value;
}

export function useConsumerSecrets(): ConsumerSecretsContextValue {
  const context = getContext<ConsumerSecretsContextValue>(ConsumerSecretsKey);
  if (!context) {
    throw new Error('useConsumerSecrets must be used within provideConsumerSecrets');
  }
  return context;
}

export { GOOGLE_MAPS_API_KEY, MAPTILER_API_KEY };
