<script lang="ts">
export const SETTINGS_SOURCE = `<SettingsScreen>
  <header><h2>Settings</h2><ThemeToggle /></header>
  <AtlasContextControls highlightField={…} />
  <Collapsible title="Integration keys (BYOK)">…</Collapsible>
  <Collapsible title="AI providers (BYOK)">…</Collapsible>
  <TextareaInput label="Feedback" />
</SettingsScreen>`;
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GeoMapProvider } from '@destination-atlas';
import BoundTextInput from '../components/BoundTextInput.vue';
import BoundTextareaInput from '../components/BoundTextareaInput.vue';
import AtlasContextControls from '../components/AtlasContextControls.vue';
import Collapsible from '../components/Collapsible.vue';
import RoleGatePanel from '../components/RoleGatePanel.vue';
import ThemeToggle from '../components/ThemeToggle.vue';
import { useConsumerSecrets } from '../composables/use-consumer-secrets';
import type { ThemePreference } from '../composables/use-theme-preference';
import { roleLabel, type AtlasUserRole } from '../lib/roles';
import { isSettingFieldTarget, type SettingsHighlightTarget } from '../lib/settings-highlight';

const FEEDBACK_MESSAGE = 'Hope you like the app, please leave comments on github.';

const props = defineProps<{
  locale: string;
  userRole: AtlasUserRole;
  mapProvider: GeoMapProvider;
  selectedId: string;
  highlightTarget: SettingsHighlightTarget;
  theme: ThemePreference;
}>();

const emit = defineEmits<{
  'update:locale': [string];
  'update:userRole': [AtlasUserRole];
  'update:mapProvider': [GeoMapProvider];
  'update:selectedId': [string];
  'update:highlightTarget': [SettingsHighlightTarget];
  'update:theme': [ThemePreference];
}>();

const secrets = useConsumerSecrets();
const preferencesRef = ref<HTMLElement | null>(null);
const themeRef = ref<HTMLElement | null>(null);
const integrationsRef = ref<HTMLElement | null>(null);
const aiRef = ref<HTMLElement | null>(null);
const feedbackRef = ref<HTMLElement | null>(null);
const integrationsOpen = ref(props.highlightTarget === 'integrations');
const aiOpen = ref(props.highlightTarget === 'ai');
const feedbackDraft = ref('');
const feedbackSent = ref(false);

const settingFieldHighlight = computed(() =>
  isSettingFieldTarget(props.highlightTarget) ? props.highlightTarget : null,
);

watch(
  () => props.highlightTarget,
  (highlightTarget) => {
    if (!highlightTarget) return;

    const scrollTarget =
      highlightTarget === 'theme'
        ? themeRef.value
        : highlightTarget === 'integrations'
          ? integrationsRef.value
          : highlightTarget === 'ai'
            ? aiRef.value
            : highlightTarget === 'feedback'
              ? feedbackRef.value
              : isSettingFieldTarget(highlightTarget)
                ? preferencesRef.value?.querySelector(`[data-setting="${highlightTarget}"]`)
                : preferencesRef.value;

    scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (highlightTarget === 'integrations') integrationsOpen.value = true;
    if (highlightTarget === 'ai') aiOpen.value = true;

    const timer = window.setTimeout(() => emit('update:highlightTarget', null), 2400);
    return () => window.clearTimeout(timer);
  },
  { immediate: true },
);

function submitFeedback() {
  feedbackSent.value = true;
  feedbackDraft.value = '';
}
</script>

<template>
  <section class="da-panel da-settings-panel">
    <div class="da-settings-head">
      <h2>Settings</h2>
      <ThemeToggle
        ref="themeRef"
        :theme="theme"
        :class="highlightTarget === 'theme' ? 'rd-highlight-target' : undefined"
        @change="emit('update:theme', $event)"
      />
    </div>

    <div ref="preferencesRef" class="da-settings-preferences">
      <AtlasContextControls
        :locale="locale"
        :user-role="userRole"
        :map-provider="mapProvider"
        :selected-id="selectedId"
        :highlight-field="settingFieldHighlight"
        @update:locale="emit('update:locale', $event)"
        @update:user-role="emit('update:userRole', $event)"
        @update:map-provider="emit('update:mapProvider', $event)"
        @update:selected-id="emit('update:selectedId', $event)"
      />
    </div>

    <div
      ref="integrationsRef"
      :class="highlightTarget === 'integrations' ? 'rd-highlight-target' : undefined"
    >
      <Collapsible
        panel-title="Integration keys (BYOK)"
        panel-summary="Google Maps, MapTiler, optional keys"
        :open="integrationsOpen"
        class="da-byok-collapsible"
        @open-change="integrationsOpen = $event"
      >
        <RoleGatePanel
          gate-label="Integration keys (BYOK)"
          :current-role="userRole"
          :allowed-roles="['admin']"
          status-text="Admin can manage API keys for maps, integrations, and Stack"
          :hidden-status-text="`Integration keys are read-only for ${roleLabel(userRole)}. Switch to Admin to configure BYOK.`"
        >
          <p v-if="!secrets.loaded" class="da-note">Loading encrypted key vault…</p>
          <div class="da-byok-fields">
            <div v-for="field in secrets.integrationFields" :key="field.id" class="da-byok-field">
              <BoundTextInput
                :field-label="field.label"
                :placeholder="field.placeholder"
                input-type="password"
                :value="secrets.getDraftValue(field.envKey)"
                @update:value="secrets.setDraftValue(field.envKey, $event)"
              />
              <p class="da-byok-field__desc">{{ field.description }}</p>
              <p class="da-byok-field__meta">
                Env key: <code>{{ field.envKey }}</code>
                <span
                  v-if="secrets.hasConfiguredKey(field.envKey)"
                  class="da-byok-field__status da-byok-field__status--ok"
                >
                  configured
                </span>
                <span v-else class="da-byok-field__status">not set</span>
              </p>
            </div>
          </div>
          <label class="da-byok-remember">
            <input
              type="checkbox"
              :checked="secrets.rememberKeys"
              @change="secrets.setRememberKeys(($event.target as HTMLInputElement).checked)"
            />
            Remember keys in this browser (localStorage + encryption)
          </label>
          <div class="da-byok-actions">
            <button type="button" class="rd-button" :disabled="!secrets.loaded" @click="void secrets.save()">
              Save keys
            </button>
            <button type="button" class="rd-button rd-button--ghost" @click="void secrets.clearAll()">
              Clear keys
            </button>
          </div>
          <p v-if="secrets.saveMessage" class="da-byok-save-msg">{{ secrets.saveMessage }}</p>
        </RoleGatePanel>
      </Collapsible>
    </div>

    <div ref="aiRef" :class="highlightTarget === 'ai' ? 'rd-highlight-target' : undefined">
      <Collapsible
        panel-title="AI providers (BYOK)"
        panel-summary="OpenAI, Anthropic, Gemini, Azure, Ollama"
        :open="aiOpen"
        class="da-byok-collapsible"
        @open-change="aiOpen = $event"
      >
        <RoleGatePanel
          gate-label="AI providers (BYOK)"
          :current-role="userRole"
          :allowed-roles="['admin']"
          status-text="Admin can manage AI provider keys"
          :hidden-status-text="`AI keys are read-only for ${roleLabel(userRole)}. Switch to Admin to configure BYOK.`"
        >
          <p v-if="!secrets.loaded" class="da-note">Loading encrypted key vault…</p>
          <div class="da-byok-fields">
            <div v-for="field in secrets.aiFields" :key="field.id" class="da-byok-field">
              <BoundTextInput
                :field-label="field.label"
                :placeholder="field.placeholder"
                :input-type="field.sensitive ? 'password' : 'text'"
                :value="secrets.getDraftValue(field.envKey)"
                @update:value="secrets.setDraftValue(field.envKey, $event)"
              />
              <p class="da-byok-field__desc">{{ field.description }}</p>
              <p class="da-byok-field__meta">
                Env key: <code>{{ field.envKey }}</code>
                <span v-if="field.optional" class="da-byok-field__optional">optional</span>
                <span
                  v-if="secrets.hasConfiguredKey(field.envKey)"
                  class="da-byok-field__status da-byok-field__status--ok"
                >
                  configured
                </span>
                <span v-else-if="field.sensitive" class="da-byok-field__status">not set</span>
              </p>
            </div>
          </div>
          <label class="da-byok-remember">
            <input
              type="checkbox"
              :checked="secrets.rememberKeys"
              @change="secrets.setRememberKeys(($event.target as HTMLInputElement).checked)"
            />
            Remember keys in this browser (localStorage + encryption)
          </label>
          <div class="da-byok-actions">
            <button type="button" class="rd-button" :disabled="!secrets.loaded" @click="void secrets.save()">
              Save keys
            </button>
            <button type="button" class="rd-button rd-button--ghost" @click="void secrets.clearAll()">
              Clear keys
            </button>
          </div>
          <p v-if="secrets.saveMessage" class="da-byok-save-msg">{{ secrets.saveMessage }}</p>
        </RoleGatePanel>
      </Collapsible>
    </div>

    <div
      ref="feedbackRef"
      :class="['da-settings-feedback', highlightTarget === 'feedback' ? 'rd-highlight-target' : undefined].filter(Boolean)"
    >
      <BoundTextareaInput
        field-label="Feedback"
        placeholder="This is a demonstration, and feedback is not functional here."
        :value="feedbackDraft"
        @update:value="feedbackDraft = $event"
      />
      <div class="da-settings-feedback__actions">
        <button type="button" class="rd-button" @click="submitFeedback">Submit feedback</button>
      </div>
      <p v-if="feedbackSent" class="da-settings-feedback__msg">{{ FEEDBACK_MESSAGE }}</p>
    </div>
  </section>
</template>
