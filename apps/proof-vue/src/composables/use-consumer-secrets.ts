import { computed, inject, provide, ref, type App, type InjectionKey } from 'vue';
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
  resolveAtlasGoogleMapsKey,
  resolveAtlasMapTilerKey,
  resolveAtlasSecret,
  maplibreTileUrlForStore,
  GOOGLE_MAPS_API_KEY,
  MAPTILER_API_KEY,
} from '../lib/atlas-secrets';

export interface ConsumerSecretsContextValue {
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

export const ConsumerSecretsKey: InjectionKey<ConsumerSecretsContextValue> = Symbol('ConsumerSecrets');

export function provideConsumerSecrets(app?: App) {
  const store = createAtlasSecretsStore();
  const loaded = ref(false);
  const saveMessage = ref<string | null>(null);
  const draftValues = ref<Record<string, string>>({});
  const snapshot = ref<ConsumerSecretsSnapshot>({
    settings: store.getSettings(),
    secretKeys: [],
  });

  store.subscribe((next) => {
    snapshot.value = next;
  });

  void store.initialize().then(() => {
    loaded.value = true;
    syncDraftFromStore();
  });

  function syncDraftFromStore() {
    const next: Record<string, string> = {};
    for (const field of atlasAllSecretFields()) {
      next[field.envKey] = store.getValue(field.envKey);
    }
    draftValues.value = next;
  }

  function getDraftValue(envKey: string) {
    return draftValues.value[envKey] ?? '';
  }

  function setDraftValue(envKey: string, value: string) {
    draftValues.value = { ...draftValues.value, [envKey]: value };
  }

  function setRememberKeys(remember: boolean) {
    store.setRememberKeys(remember);
  }

  async function save() {
    for (const field of atlasAllSecretFields()) {
      store.setSecretValue(field.envKey, draftValues.value[field.envKey] ?? '');
    }
    await store.save();
    saveMessage.value = 'Keys saved in this browser.';
    window.setTimeout(() => {
      saveMessage.value = null;
    }, 4000);
  }

  async function clearAll() {
    store.clearAll();
    syncDraftFromStore();
    saveMessage.value = 'Cleared keys from this browser.';
    window.setTimeout(() => {
      saveMessage.value = null;
    }, 4000);
  }

  function hasConfiguredKey(envKey: string) {
    return isAtlasKeyConfigured(store, envKey);
  }

  function resolveSecret(envKey: string) {
    return resolveAtlasSecret(store, envKey);
  }

  const scoutAiReady = computed(() => scoutAiProviderReady(hasConfiguredKey, resolveSecret));

  const value: ConsumerSecretsContextValue = {
    get loaded() {
      return loaded.value;
    },
    get rememberKeys() {
      return snapshot.value.settings.rememberKeys;
    },
    get saveMessage() {
      return saveMessage.value;
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
      return scoutAiReady.value;
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

  if (app) {
    app.provide(ConsumerSecretsKey, value);
  } else {
    provide(ConsumerSecretsKey, value);
  }

  return value;
}

export function useConsumerSecrets(): ConsumerSecretsContextValue {
  const context = inject(ConsumerSecretsKey);
  if (!context) {
    throw new Error('useConsumerSecrets must be used within provideConsumerSecrets');
  }
  return context;
}

export { GOOGLE_MAPS_API_KEY, MAPTILER_API_KEY };
