import { Injectable, signal, computed, inject } from '@angular/core';
import type { ConsumerSecretsSnapshot, ConsumerSecretsStore, EnvFieldDefinition } from '@rosettadash/core';
import { scoutAiProviderReady } from '@rosettadash/core';
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
} from '../lib/atlas-secrets';

@Injectable({ providedIn: 'root' })
export class ConsumerSecretsService {
  private readonly store: ConsumerSecretsStore = createAtlasSecretsStore();

  readonly loaded = signal(false);
  readonly saveMessage = signal<string | null>(null);
  readonly draftValues = signal<Record<string, string>>({});
  readonly snapshot = signal<ConsumerSecretsSnapshot>({
    settings: this.store.getSettings(),
    secretKeys: [],
  });

  readonly integrationFields = atlasIntegrationFields();
  readonly aiFields = atlasAiFields();
  readonly rememberKeys = computed(() => this.snapshot().settings.rememberKeys);

  readonly scoutAiReady = computed(() =>
    scoutAiProviderReady(
      (key) => this.hasConfiguredKey(key),
      (key) => this.resolveSecret(key),
    ),
  );

  readonly googleMapsApiKey = computed(() => resolveAtlasGoogleMapsKey(this.store));
  readonly mapTilerApiKey = computed(() => resolveAtlasMapTilerKey(this.store));
  readonly maplibreTileUrl = computed(() => maplibreTileUrlForStore(this.store));

  constructor() {
    this.store.subscribe((next) => this.snapshot.set(next));
    void this.store.initialize().then(() => {
      this.loaded.set(true);
      this.syncDraftFromStore();
    });
  }

  getDraftValue(envKey: string): string {
    return this.draftValues()[envKey] ?? '';
  }

  setDraftValue(envKey: string, value: string): void {
    this.draftValues.update((current) => ({ ...current, [envKey]: value }));
  }

  setRememberKeys(remember: boolean): void {
    this.store.setRememberKeys(remember);
  }

  hasConfiguredKey(envKey: string): boolean {
    return isAtlasKeyConfigured(this.store, envKey);
  }

  resolveSecret(envKey: string): string {
    return resolveAtlasSecret(this.store, envKey);
  }

  stackKeyStatus(envKeys: string[]): Array<{ envKey: string; configured: boolean }> {
    return integrationKeyStatus(this.store, envKeys);
  }

  async save(): Promise<void> {
    for (const field of atlasAllSecretFields()) {
      this.store.setSecretValue(field.envKey, this.draftValues()[field.envKey] ?? '');
    }
    await this.store.save();
    this.saveMessage.set('Keys saved in this browser.');
    window.setTimeout(() => this.saveMessage.set(null), 4000);
  }

  async clearAll(): Promise<void> {
    this.store.clearAll();
    this.syncDraftFromStore();
    this.saveMessage.set('Cleared keys from this browser.');
    window.setTimeout(() => this.saveMessage.set(null), 4000);
  }

  private syncDraftFromStore(): void {
    const next: Record<string, string> = {};
    for (const field of atlasAllSecretFields()) {
      next[field.envKey] = this.store.getValue(field.envKey);
    }
    this.draftValues.set(next);
  }
}
