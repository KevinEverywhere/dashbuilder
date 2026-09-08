<script module lang="ts">
  export const SETTINGS_SOURCE = `<SettingsScreen>
  <header><h2>Settings</h2><ThemeToggle /></header>
  <AtlasContextControls highlightField={…}>
    <AppLanguageSelect locales={DEFAULT_APP_LOCALES} value={locale} onLocaleChange={…} />
  </AtlasContextControls>
  <Collapsible title="Integration keys (BYOK)">…</Collapsible>
  <Collapsible title="AI providers (BYOK)">…</Collapsible>
  <TextareaInput label="Feedback" />
</SettingsScreen>`;
</script>

<script lang="ts">
  import type { GeoMapProvider } from '@destination-atlas';
  import BoundTextInput from '../components/BoundTextInput.svelte';
  import BoundTextareaInput from '../components/BoundTextareaInput.svelte';
  import AtlasContextControls from '../components/AtlasContextControls.svelte';
  import Collapsible from '../components/Collapsible.svelte';
  import RoleGatePanel from '../components/RoleGatePanel.svelte';
  import NewsFeedAdminSection from '../components/NewsFeedAdminSection.svelte';
  import ThemeToggle from '../components/ThemeToggle.svelte';
  import { useConsumerSecrets } from '../lib/consumer-secrets.svelte';
  import type { ThemePreference } from '../lib/theme-preference.svelte';
  import { roleLabel, type AtlasUserRole } from '../lib/roles';
  import { isSettingFieldTarget, type SettingsHighlightTarget } from '../lib/settings-highlight';

  const FEEDBACK_MESSAGE = 'Hope you like the app, please leave comments on github.';

  let {
    locale,
    userRole,
    mapProvider,
    selectedId,
    highlightTarget,
    theme,
    onLocaleChange,
    onUserRoleChange,
    onMapProviderChange,
    onSelectedIdChange,
    onHighlightTargetChange,
    onThemeChange,
  }: {
    locale: string;
    userRole: AtlasUserRole;
    mapProvider: GeoMapProvider;
    selectedId: string;
    highlightTarget: SettingsHighlightTarget;
    theme: ThemePreference;
    onLocaleChange?: (locale: string) => void;
    onUserRoleChange?: (role: AtlasUserRole) => void;
    onMapProviderChange?: (provider: GeoMapProvider) => void;
    onSelectedIdChange?: (id: string) => void;
    onHighlightTargetChange?: (target: SettingsHighlightTarget) => void;
    onThemeChange?: (theme: ThemePreference) => void;
  } = $props();

  const secrets = useConsumerSecrets();
  let preferencesRef = $state<HTMLElement | null>(null);
  let themeRef = $state<HTMLElement | null>(null);
  let integrationsRef = $state<HTMLElement | null>(null);
  let aiRef = $state<HTMLElement | null>(null);
  let feedbackRef = $state<HTMLElement | null>(null);
  let integrationsOpen = $state(false);
  let aiOpen = $state(false);
  let feedbackDraft = $state('');
  let feedbackSent = $state(false);

  const settingFieldHighlight = $derived(
    isSettingFieldTarget(highlightTarget) ? highlightTarget : null,
  );

  $effect(() => {
    const target = highlightTarget;
    if (!target) {
      return;
    }

    const scrollTarget =
      target === 'theme'
        ? themeRef
        : target === 'integrations'
          ? integrationsRef
          : target === 'ai'
            ? aiRef
            : target === 'feedback'
              ? feedbackRef
              : isSettingFieldTarget(target)
                ? preferencesRef?.querySelector(`[data-setting="${target}"]`)
                : preferencesRef;

    scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (target === 'integrations') integrationsOpen = true;
    if (target === 'ai') aiOpen = true;

    const timer = window.setTimeout(() => onHighlightTargetChange?.(null), 2400);
    return () => window.clearTimeout(timer);
  });

  function submitFeedback() {
    feedbackSent = true;
    feedbackDraft = '';
  }
</script>

<section class="da-panel da-settings-panel">
  <div class="da-settings-head">
    <h2>Settings</h2>
    <div bind:this={themeRef} class:rd-highlight-target={highlightTarget === 'theme'}>
      <ThemeToggle {theme} onChange={onThemeChange} />
    </div>
  </div>

  <div bind:this={preferencesRef} class="da-settings-preferences">
    <AtlasContextControls
      {locale}
      {userRole}
      {mapProvider}
      {selectedId}
      highlightField={settingFieldHighlight}
      onLocaleChange={onLocaleChange}
      onUserRoleChange={onUserRoleChange}
      onMapProviderChange={onMapProviderChange}
      onSelectedIdChange={onSelectedIdChange}
    />
  </div>

  <Collapsible
    panelTitle="News feeds (admin)"
    panelSummary="Google News RSS cache refresh"
    class="da-byok-collapsible"
  >
    <NewsFeedAdminSection {userRole} />
  </Collapsible>

  <div
    bind:this={integrationsRef}
    class:rd-highlight-target={highlightTarget === 'integrations'}
  >
    <Collapsible
      panelTitle="Integration keys (BYOK)"
      panelSummary="Google Maps, MapTiler, optional keys"
      open={integrationsOpen}
      class="da-byok-collapsible"
      onOpenChange={(open) => (integrationsOpen = open)}
    >
      <RoleGatePanel
        gateLabel="Integration keys (BYOK)"
        currentRole={userRole}
        allowedRoles={['admin']}
        statusText="Admin can manage API keys for maps, integrations, and Stack"
        hiddenStatusText={`Integration keys are read-only for ${roleLabel(userRole)}. Switch to Admin to configure BYOK.`}
      >
        {#if !secrets.loaded}<p class="da-note">Loading encrypted key vault…</p>{/if}
        <div class="da-byok-fields">
          {#each secrets.integrationFields as field (field.id)}
            <div class="da-byok-field">
              <BoundTextInput
                fieldLabel={field.label}
                placeholder={field.placeholder}
                inputType="password"
                value={secrets.getDraftValue(field.envKey)}
                onValueChange={(value) => secrets.setDraftValue(field.envKey, value)}
              />
              <p class="da-byok-field__desc">{field.description}</p>
              <p class="da-byok-field__meta">
                Env key: <code>{field.envKey}</code>
                {#if secrets.hasConfiguredKey(field.envKey)}
                  <span class="da-byok-field__status da-byok-field__status--ok">configured</span>
                {:else}
                  <span class="da-byok-field__status">not set</span>
                {/if}
              </p>
            </div>
          {/each}
        </div>
        <label class="da-byok-remember">
          <input
            type="checkbox"
            checked={secrets.rememberKeys}
            onchange={(event) => secrets.setRememberKeys((event.currentTarget as HTMLInputElement).checked)}
          />
          Remember keys in this browser (localStorage + encryption)
        </label>
        <div class="da-byok-actions">
          <button type="button" class="rd-button" disabled={!secrets.loaded} onclick={() => void secrets.save()}>
            Save keys
          </button>
          <button type="button" class="rd-button rd-button--ghost" onclick={() => void secrets.clearAll()}>
            Clear keys
          </button>
        </div>
        {#if secrets.saveMessage}<p class="da-byok-save-msg">{secrets.saveMessage}</p>{/if}
      </RoleGatePanel>
    </Collapsible>
  </div>

  <div bind:this={aiRef} class:rd-highlight-target={highlightTarget === 'ai'}>
    <Collapsible
      panelTitle="AI providers (BYOK)"
      panelSummary="OpenAI, Anthropic, Gemini, Azure, Ollama"
      open={aiOpen}
      class="da-byok-collapsible"
      onOpenChange={(open) => (aiOpen = open)}
    >
      <RoleGatePanel
        gateLabel="AI providers (BYOK)"
        currentRole={userRole}
        allowedRoles={['admin']}
        statusText="Admin can manage AI provider keys"
        hiddenStatusText={`AI keys are read-only for ${roleLabel(userRole)}. Switch to Admin to configure BYOK.`}
      >
        {#if !secrets.loaded}<p class="da-note">Loading encrypted key vault…</p>{/if}
        <div class="da-byok-fields">
          {#each secrets.aiFields as field (field.id)}
            <div class="da-byok-field">
              <BoundTextInput
                fieldLabel={field.label}
                placeholder={field.placeholder}
                inputType={field.sensitive ? 'password' : 'text'}
                value={secrets.getDraftValue(field.envKey)}
                onValueChange={(value) => secrets.setDraftValue(field.envKey, value)}
              />
              <p class="da-byok-field__desc">{field.description}</p>
              <p class="da-byok-field__meta">
                Env key: <code>{field.envKey}</code>
                {#if field.optional}<span class="da-byok-field__optional">optional</span>{/if}
                {#if secrets.hasConfiguredKey(field.envKey)}
                  <span class="da-byok-field__status da-byok-field__status--ok">configured</span>
                {:else if field.sensitive}
                  <span class="da-byok-field__status">not set</span>
                {/if}
              </p>
            </div>
          {/each}
        </div>
        <label class="da-byok-remember">
          <input
            type="checkbox"
            checked={secrets.rememberKeys}
            onchange={(event) => secrets.setRememberKeys((event.currentTarget as HTMLInputElement).checked)}
          />
          Remember keys in this browser (localStorage + encryption)
        </label>
        <div class="da-byok-actions">
          <button type="button" class="rd-button" disabled={!secrets.loaded} onclick={() => void secrets.save()}>
            Save keys
          </button>
          <button type="button" class="rd-button rd-button--ghost" onclick={() => void secrets.clearAll()}>
            Clear keys
          </button>
        </div>
        {#if secrets.saveMessage}<p class="da-byok-save-msg">{secrets.saveMessage}</p>{/if}
      </RoleGatePanel>
    </Collapsible>
  </div>

  <div
    bind:this={feedbackRef}
    class={['da-settings-feedback', highlightTarget === 'feedback' ? 'rd-highlight-target' : '']
      .filter(Boolean)
      .join(' ')}
  >
    <BoundTextareaInput
      fieldLabel="Feedback"
      placeholder="This is a demonstration, and feedback is not functional here."
      value={feedbackDraft}
      onValueChange={(value) => (feedbackDraft = value)}
    />
    <div class="da-settings-feedback__actions">
      <button type="button" class="rd-button" onclick={submitFeedback}>Submit feedback</button>
    </div>
    {#if feedbackSent}<p class="da-settings-feedback__msg">{FEEDBACK_MESSAGE}</p>{/if}
  </div>
</section>
