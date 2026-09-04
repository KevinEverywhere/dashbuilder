import {
  scoutAiProviderReady,
  type ConsumerSecretsSnapshot,
  type EnvFieldDefinition,
} from '@rosettadash/core';
import {
  atlasAiFields,
  atlasAllSecretFields,
  atlasIntegrationFields,
  createAtlasSecretsStore,
  integrationKeyStatus,
  isAtlasKeyConfigured,
  maplibreTileUrlForStore,
  resolveAtlasGoogleMapsKey,
  resolveAtlasMapTilerKey,
  resolveAtlasSecret,
} from './atlas-secrets';

export interface ConsumerSecretsApi {
  loaded: boolean;
  rememberKeys: boolean;
  saveMessage: string | null;
  integrationFields: EnvFieldDefinition[];
  aiFields: EnvFieldDefinition[];
  getDraftValue: (envKey: string) => string;
  setDraftValue: (envKey: string, value: string) => void;
  setRememberKeys: (remember: boolean) => void;
  save: () => Promise<void>;
  clearAll: () => Promise<void>;
  hasConfiguredKey: (envKey: string) => boolean;
  resolveSecret: (envKey: string) => string;
  scoutAiReady: boolean;
  googleMapsApiKey: string;
  mapTilerApiKey: string;
  maplibreTileUrl?: string;
  stackKeyStatus: (envKeys: string[]) => Array<{ envKey: string; configured: boolean }>;
}

const store = createAtlasSecretsStore();
let loaded = false;
let saveMessage: string | null = null;
let draftValues: Record<string, string> = {};
let snapshot: ConsumerSecretsSnapshot = {
  settings: store.getSettings(),
  secretKeys: [],
};
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function syncDraftFromStore(): void {
  const next: Record<string, string> = {};
  for (const field of atlasAllSecretFields()) {
    next[field.envKey] = store.getValue(field.envKey);
  }
  draftValues = next;
}

store.subscribe((next) => {
  snapshot = next;
  emit();
});

void store.initialize().then(() => {
  loaded = true;
  syncDraftFromStore();
  emit();
});

export function subscribeSecrets(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getConsumerSecrets(): ConsumerSecretsApi {
  const hasConfiguredKey = (envKey: string) => isAtlasKeyConfigured(store, envKey);
  const resolveSecret = (envKey: string) => resolveAtlasSecret(store, envKey);

  return {
    loaded,
    rememberKeys: snapshot.settings.rememberKeys,
    saveMessage,
    integrationFields: atlasIntegrationFields(),
    aiFields: atlasAiFields(),
    getDraftValue: (envKey) => draftValues[envKey] ?? '',
    setDraftValue: (envKey, value) => {
      draftValues = { ...draftValues, [envKey]: value };
    },
    setRememberKeys: (remember) => {
      store.setRememberKeys(remember);
    },
    save: async () => {
      for (const field of atlasAllSecretFields()) {
        store.setSecretValue(field.envKey, draftValues[field.envKey] ?? '');
      }
      await store.save();
      saveMessage = 'Keys saved in this browser.';
      emit();
      window.setTimeout(() => {
        saveMessage = null;
        emit();
      }, 4000);
    },
    clearAll: async () => {
      store.clearAll();
      syncDraftFromStore();
      saveMessage = 'Cleared keys from this browser.';
      emit();
      window.setTimeout(() => {
        saveMessage = null;
        emit();
      }, 4000);
    },
    hasConfiguredKey,
    resolveSecret,
    scoutAiReady: scoutAiProviderReady(hasConfiguredKey, resolveSecret),
    googleMapsApiKey: resolveAtlasGoogleMapsKey(store),
    mapTilerApiKey: resolveAtlasMapTilerKey(store),
    maplibreTileUrl: maplibreTileUrlForStore(store),
    stackKeyStatus: (envKeys) => integrationKeyStatus(store, envKeys),
  };
}
