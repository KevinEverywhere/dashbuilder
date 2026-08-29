import { useEffect, useRef, useState } from 'react';
import { Collapsible } from '@rosettadash/react/layout/collapsible';
import { RoleGate } from '@rosettadash/react/domain/role-gate';
import { TextInput } from '@rosettadash/react/visual/input/text';
import { TextareaInput } from '@rosettadash/react/visual/input/textarea';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import { useConsumerSecrets } from '../state/consumer-secrets-context';
import { AtlasContextControls } from '../components/AtlasContextControls';
import { ThemeToggle, type ThemePreference } from '../lib/theme';
import { roleLabel } from '../lib/roles';
import { isSettingFieldTarget } from '../lib/settings-highlight';

export const SETTINGS_SOURCE = `<SettingsScreen>
  <header><h2>Settings</h2><ThemeToggle /></header>
  <AtlasContextControls highlightField={…}>
    <AppLanguageSelect locales={DEFAULT_APP_LOCALES} value={locale} onLocaleChange={…} />
  </AtlasContextControls>
  <Collapsible title="Integration keys (BYOK)">…</Collapsible>
  <Collapsible title="AI providers (BYOK)">…</Collapsible>
  <TextareaInput label="Feedback" />
</SettingsScreen>`;

const FEEDBACK_MESSAGE = 'Hope you like the app, please leave comments on github.';

type Props = Pick<
  AtlasContext,
  | 'locale'
  | 'userRole'
  | 'setLocale'
  | 'setUserRole'
  | 'mapProvider'
  | 'setMapProvider'
  | 'selectedId'
  | 'setSelectedId'
  | 'highlightTarget'
  | 'setHighlightTarget'
> & {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

export function SettingsScreen({
  locale,
  userRole,
  setLocale,
  setUserRole,
  mapProvider,
  setMapProvider,
  selectedId,
  setSelectedId,
  highlightTarget,
  setHighlightTarget,
  theme,
  setTheme,
}: Props) {
  const preferencesRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLLabelElement>(null);
  const integrationsRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const secrets = useConsumerSecrets();
  const [integrationsOpen, setIntegrationsOpen] = useState(highlightTarget === 'integrations');
  const [aiOpen, setAiOpen] = useState(highlightTarget === 'ai');
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const settingFieldHighlight = isSettingFieldTarget(highlightTarget) ? highlightTarget : null;

  useEffect(() => {
    if (!highlightTarget) {
      return undefined;
    }

    const scrollTarget =
      highlightTarget === 'theme'
        ? themeRef.current
        : highlightTarget === 'integrations'
          ? integrationsRef.current
          : highlightTarget === 'ai'
            ? aiRef.current
            : highlightTarget === 'feedback'
              ? feedbackRef.current
              : isSettingFieldTarget(highlightTarget)
                ? preferencesRef.current?.querySelector(`[data-setting="${highlightTarget}"]`)
                : preferencesRef.current;

    scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (highlightTarget === 'integrations') {
      setIntegrationsOpen(true);
    }
    if (highlightTarget === 'ai') {
      setAiOpen(true);
    }

    const timer = window.setTimeout(() => setHighlightTarget(null), 2400);
    return () => window.clearTimeout(timer);
  }, [highlightTarget, setHighlightTarget]);

  const submitFeedback = () => {
    setFeedbackSent(true);
    setFeedbackDraft('');
  };

  return (
    <section className="da-panel da-settings-panel">
      <div className="da-settings-head">
        <h2>Settings</h2>
        <ThemeToggle
          ref={themeRef}
          theme={theme}
          onChange={setTheme}
          className={highlightTarget === 'theme' ? 'rd-highlight-target' : undefined}
        />
      </div>

      <div ref={preferencesRef} className="da-settings-preferences">
        <AtlasContextControls
          locale={locale}
          setLocale={setLocale}
          userRole={userRole}
          setUserRole={setUserRole}
          mapProvider={mapProvider}
          setMapProvider={setMapProvider}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          highlightField={settingFieldHighlight}
        />
      </div>

      <div
        ref={integrationsRef}
        className={highlightTarget === 'integrations' ? 'rd-highlight-target' : undefined}
      >
        <Collapsible
          title="Integration keys (BYOK)"
          summary="Google Maps, MapTiler, News API"
          open={integrationsOpen}
          onOpenChange={setIntegrationsOpen}
          className="da-byok-collapsible"
        >
          <RoleGate
            label="Integration keys (BYOK)"
            currentRole={userRole}
            allowedRoles={['admin']}
            statusText="Admin can manage API keys for maps, news, and Stack"
            hiddenStatusText={`Integration keys are read-only for ${roleLabel(userRole)}. Switch to Admin to configure BYOK.`}
          >
            {!secrets.loaded ? <p className="da-note">Loading encrypted key vault…</p> : null}
            <div className="da-byok-fields">
              {secrets.integrationFields.map((field) => (
                <div key={field.id} className="da-byok-field">
                  <TextInput
                    label={field.label}
                    placeholder={field.placeholder}
                    inputType="password"
                    value={secrets.getDraftValue(field.envKey)}
                    onChange={(value) => secrets.setDraftValue(field.envKey, value)}
                  />
                  <p className="da-byok-field__desc">{field.description}</p>
                  <p className="da-byok-field__meta">
                    Env key: <code>{field.envKey}</code>
                    {secrets.hasConfiguredKey(field.envKey) ? (
                      <span className="da-byok-field__status da-byok-field__status--ok">configured</span>
                    ) : (
                      <span className="da-byok-field__status">not set</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
            <label className="da-byok-remember">
              <input
                type="checkbox"
                checked={secrets.rememberKeys}
                onChange={(event) => secrets.setRememberKeys(event.target.checked)}
              />
              Remember keys in this browser (localStorage + encryption)
            </label>
            <div className="da-byok-actions">
              <button type="button" className="rd-button" onClick={() => void secrets.save()} disabled={!secrets.loaded}>
                Save keys
              </button>
              <button type="button" className="rd-button rd-button--ghost" onClick={() => void secrets.clearAll()}>
                Clear keys
              </button>
            </div>
            {secrets.saveMessage ? <p className="da-byok-save-msg">{secrets.saveMessage}</p> : null}
          </RoleGate>
        </Collapsible>
      </div>

      <div ref={aiRef} className={highlightTarget === 'ai' ? 'rd-highlight-target' : undefined}>
        <Collapsible
          title="AI providers (BYOK)"
          summary="OpenAI, Anthropic, Gemini, Azure, Ollama"
          open={aiOpen}
          onOpenChange={setAiOpen}
          className="da-byok-collapsible"
        >
          <RoleGate
            label="AI providers (BYOK)"
            currentRole={userRole}
            allowedRoles={['admin']}
            statusText="Admin can manage AI provider keys"
            hiddenStatusText={`AI keys are read-only for ${roleLabel(userRole)}. Switch to Admin to configure BYOK.`}
          >
            {!secrets.loaded ? <p className="da-note">Loading encrypted key vault…</p> : null}
            <div className="da-byok-fields">
              {secrets.aiFields.map((field) => (
                <div key={field.id} className="da-byok-field">
                  <TextInput
                    label={field.label}
                    placeholder={field.placeholder}
                    inputType={field.sensitive ? 'password' : 'text'}
                    value={secrets.getDraftValue(field.envKey)}
                    onChange={(value) => secrets.setDraftValue(field.envKey, value)}
                  />
                  <p className="da-byok-field__desc">{field.description}</p>
                  <p className="da-byok-field__meta">
                    Env key: <code>{field.envKey}</code>
                    {field.optional ? <span className="da-byok-field__optional">optional</span> : null}
                    {secrets.hasConfiguredKey(field.envKey) ? (
                      <span className="da-byok-field__status da-byok-field__status--ok">configured</span>
                    ) : field.sensitive ? (
                      <span className="da-byok-field__status">not set</span>
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
            <label className="da-byok-remember">
              <input
                type="checkbox"
                checked={secrets.rememberKeys}
                onChange={(event) => secrets.setRememberKeys(event.target.checked)}
              />
              Remember keys in this browser (localStorage + encryption)
            </label>
            <div className="da-byok-actions">
              <button type="button" className="rd-button" onClick={() => void secrets.save()} disabled={!secrets.loaded}>
                Save keys
              </button>
              <button type="button" className="rd-button rd-button--ghost" onClick={() => void secrets.clearAll()}>
                Clear keys
              </button>
            </div>
            {secrets.saveMessage ? <p className="da-byok-save-msg">{secrets.saveMessage}</p> : null}
          </RoleGate>
        </Collapsible>
      </div>

      <div
        ref={feedbackRef}
        className={[
          'da-settings-feedback',
          highlightTarget === 'feedback' ? 'rd-highlight-target' : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <TextareaInput
          label="Feedback"
          placeholder="This is a demonstration, and feedback is not functional here."
          rows={4}
          value={feedbackDraft}
          onChange={setFeedbackDraft}
        />
        <div className="da-settings-feedback__actions">
          <button type="button" className="rd-button" onClick={submitFeedback}>
            Submit feedback
          </button>
        </div>
        {feedbackSent ? <p className="da-settings-feedback__msg">{FEEDBACK_MESSAGE}</p> : null}
      </div>
    </section>
  );
}
