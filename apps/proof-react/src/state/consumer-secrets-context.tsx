import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  scoutAiProviderReady,
  type ConsumerSecretsSnapshot,
  type ConsumerSecretsStore,
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

const ConsumerSecretsContext = createContext<ConsumerSecretsContextValue | null>(null);

export function ConsumerSecretsProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createAtlasSecretsStore(), []);
  const [loaded, setLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [snapshot, setSnapshot] = useState<ConsumerSecretsSnapshot>(() => ({
    settings: store.getSettings(),
    secretKeys: [],
  }));

  useEffect(() => store.subscribe(setSnapshot), [store]);

  useEffect(() => {
    let cancelled = false;
    void store.initialize().then(() => {
      if (!cancelled) {
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const syncDraftFromStore = useCallback(() => {
    const next: Record<string, string> = {};
    for (const field of atlasAllSecretFields()) {
      next[field.envKey] = store.getValue(field.envKey);
    }
    setDraftValues(next);
  }, [store]);

  useEffect(() => {
    if (loaded) {
      syncDraftFromStore();
    }
  }, [loaded, syncDraftFromStore]);

  const getDraftValue = useCallback(
    (envKey: string) => draftValues[envKey] ?? '',
    [draftValues],
  );

  const setDraftValue = useCallback((envKey: string, value: string) => {
    setDraftValues((current) => ({ ...current, [envKey]: value }));
  }, []);

  const setRememberKeys = useCallback(
    (remember: boolean) => {
      store.setRememberKeys(remember);
    },
    [store],
  );

  const save = useCallback(async () => {
    for (const field of atlasAllSecretFields()) {
      store.setSecretValue(field.envKey, draftValues[field.envKey] ?? '');
    }
    await store.save();
    setSaveMessage('Keys saved in this browser.');
    window.setTimeout(() => setSaveMessage(null), 4000);
  }, [draftValues, store]);

  const clearAll = useCallback(async () => {
    store.clearAll();
    syncDraftFromStore();
    setSaveMessage('Cleared keys from this browser.');
    window.setTimeout(() => setSaveMessage(null), 4000);
  }, [store, syncDraftFromStore]);

  const hasConfiguredKey = useCallback(
    (envKey: string) => isAtlasKeyConfigured(store, envKey),
    [store],
  );

  const resolveSecret = useCallback(
    (envKey: string) => resolveAtlasSecret(store, envKey),
    [store],
  );

  const scoutAiReady = useMemo(
    () => scoutAiProviderReady(hasConfiguredKey, resolveSecret),
    [hasConfiguredKey, resolveSecret, snapshot],
  );

  const value = useMemo<ConsumerSecretsContextValue>(
    () => ({
      loaded,
      rememberKeys: snapshot.settings.rememberKeys,
      saveMessage,
      integrationFields: atlasIntegrationFields(),
      aiFields: atlasAiFields(),
      getDraftValue,
      setDraftValue,
      setRememberKeys,
      save,
      clearAll,
      hasConfiguredKey,
      resolveSecret,
      scoutAiReady,
      googleMapsApiKey: resolveAtlasGoogleMapsKey(store),
      mapTilerApiKey: resolveAtlasMapTilerKey(store),
      maplibreTileUrl: maplibreTileUrlForStore(store),
      stackKeyStatus: (envKeys: string[]) => integrationKeyStatus(store, envKeys),
    }),
    [
      loaded,
      snapshot,
      saveMessage,
      getDraftValue,
      setDraftValue,
      setRememberKeys,
      save,
      clearAll,
      hasConfiguredKey,
      resolveSecret,
      scoutAiReady,
      store,
    ],
  );

  return <ConsumerSecretsContext.Provider value={value}>{children}</ConsumerSecretsContext.Provider>;
}

export function useConsumerSecrets(): ConsumerSecretsContextValue {
  const context = useContext(ConsumerSecretsContext);
  if (!context) {
    throw new Error('useConsumerSecrets must be used within ConsumerSecretsProvider');
  }
  return context;
}

export { GOOGLE_MAPS_API_KEY, MAPTILER_API_KEY };
