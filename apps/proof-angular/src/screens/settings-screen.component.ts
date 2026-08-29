import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { roleLabel } from '../lib/roles';
import { isSettingFieldTarget, type SettingsHighlightTarget } from '../lib/settings-highlight';
import { AtlasStateService } from '../services/atlas-state.service';
import { ThemeService } from '../services/theme.service';
import { ConsumerSecretsService } from '../services/consumer-secrets.service';
import { AtlasContextControlsComponent } from '../components/atlas-context-controls.component';
import { ThemeToggleComponent } from '../components/theme-toggle.component';
import { CollapsibleComponent } from '../components/collapsible.component';
import { ByokFieldsSectionComponent } from '../components/byok-fields-section.component';
import { DaBoundTextareaInputComponent } from '../components/proof-form-fields.component';

const FEEDBACK_MESSAGE = 'Hope you like the app, please leave comments on github.';

@Component({
  selector: 'da-settings-screen',
  standalone: true,
  imports: [
    AtlasContextControlsComponent,
    ThemeToggleComponent,
    CollapsibleComponent,
    ByokFieldsSectionComponent,
    DaBoundTextareaInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="da-panel da-settings-panel">
      <div class="da-settings-head">
        <h2>Settings</h2>
        <da-theme-toggle
          #themeToggle
          [theme]="theme.theme()"
          [class.rd-highlight-target]="atlas.highlightTarget() === 'theme'"
          (themeChange)="theme.setTheme($event)"
        />
      </div>

      <div #preferencesRef class="da-settings-preferences">
        <da-atlas-context-controls
          [locale]="atlas.locale()"
          [userRole]="atlas.userRole()"
          [mapProvider]="atlas.mapProvider()"
          [selectedId]="atlas.selectedId()"
          [highlightField]="settingFieldHighlight()"
          (localeChange)="atlas.setLocale($event)"
          (userRoleChange)="atlas.setUserRole($event)"
          (mapProviderChange)="atlas.setMapProvider($event)"
          (selectedIdChange)="atlas.setSelectedId($event)"
        />
      </div>

      <div
        #integrationsRef
        [class.rd-highlight-target]="atlas.highlightTarget() === 'integrations'"
      >
        <da-collapsible
          [panelTitle]="'Integration keys (BYOK)'"
          [panelSummary]="'Google Maps, MapTiler, News API'"
          class="da-byok-collapsible"
          [open]="integrationsOpen()"
          (openChange)="integrationsOpen.set($event)"
        >
          <da-byok-fields-section
            [userRole]="atlas.userRole()"
            [fields]="secrets.integrationFields"
            gateLabel="Integration keys (BYOK)"
            gateStatusText="Admin can manage API keys for maps, news, and Stack"
            [gateHiddenStatusText]="
              'Integration keys are read-only for ' +
              roleLabel(atlas.userRole()) +
              '. Switch to Admin to configure BYOK.'
            "
          />
        </da-collapsible>
      </div>

      <div #aiRef [class.rd-highlight-target]="atlas.highlightTarget() === 'ai'">
        <da-collapsible
          [panelTitle]="'AI providers (BYOK)'"
          [panelSummary]="'OpenAI, Anthropic, Gemini, Azure, Ollama'"
          class="da-byok-collapsible"
          [open]="aiOpen()"
          (openChange)="aiOpen.set($event)"
        >
          <da-byok-fields-section
            [userRole]="atlas.userRole()"
            [fields]="secrets.aiFields"
            gateLabel="AI providers (BYOK)"
            gateStatusText="Admin can manage AI provider keys"
            [gateHiddenStatusText]="
              'AI keys are read-only for ' +
              roleLabel(atlas.userRole()) +
              '. Switch to Admin to configure BYOK.'
            "
          />
        </da-collapsible>
      </div>

      <div
        #feedbackRef
        class="da-settings-feedback"
        [class.rd-highlight-target]="atlas.highlightTarget() === 'feedback'"
      >
        <da-bound-textarea-input
          [fieldLabel]="'Feedback'"
          placeholder="This is a demonstration, and feedback is not functional here."
          [rows]="4"
          [value]="feedbackDraft()"
          (valueChange)="feedbackDraft.set($event)"
        />
        <div class="da-settings-feedback__actions">
          <button type="button" class="rd-button" (click)="submitFeedback()">Submit feedback</button>
        </div>
        @if (feedbackSent()) {
          <p class="da-settings-feedback__msg">{{ feedbackMessage }}</p>
        }
      </div>
    </section>
  `,
})
export class SettingsScreenComponent {
  readonly roleLabel = roleLabel;

  readonly atlas = inject(AtlasStateService);
  readonly theme = inject(ThemeService);
  readonly secrets = inject(ConsumerSecretsService);

  readonly feedbackMessage = FEEDBACK_MESSAGE;
  readonly feedbackDraft = signal('');
  readonly feedbackSent = signal(false);
  readonly integrationsOpen = signal(false);
  readonly aiOpen = signal(false);

  private readonly preferencesRef = viewChild<ElementRef<HTMLElement>>('preferencesRef');
  private readonly integrationsRef = viewChild<ElementRef<HTMLElement>>('integrationsRef');
  private readonly aiRef = viewChild<ElementRef<HTMLElement>>('aiRef');
  private readonly feedbackRef = viewChild<ElementRef<HTMLElement>>('feedbackRef');
  private readonly themeToggleRef = viewChild<ElementRef<HTMLElement>>('themeToggle');

  constructor() {
    effect(() => {
      const target = this.atlas.highlightTarget();
      if (!target) {
        return;
      }

      if (target === 'integrations') {
        this.integrationsOpen.set(true);
      }
      if (target === 'ai') {
        this.aiOpen.set(true);
      }

      queueMicrotask(() => {
        const scrollTarget = this.resolveScrollTarget(target);
        scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => this.atlas.setHighlightTarget(null), 2400);
      });
    });
  }

  settingFieldHighlight() {
    const target = this.atlas.highlightTarget();
    return isSettingFieldTarget(target) ? target : null;
  }

  submitFeedback(): void {
    this.feedbackSent.set(true);
    this.feedbackDraft.set('');
  }

  private resolveScrollTarget(target: SettingsHighlightTarget): HTMLElement | null {
    if (!target) {
      return null;
    }
    if (target === 'theme') {
      return this.themeToggleRef()?.nativeElement ?? null;
    }
    if (target === 'integrations') {
      return this.integrationsRef()?.nativeElement ?? null;
    }
    if (target === 'ai') {
      return this.aiRef()?.nativeElement ?? null;
    }
    if (target === 'feedback') {
      return this.feedbackRef()?.nativeElement ?? null;
    }
    if (isSettingFieldTarget(target)) {
      return (
        this.preferencesRef()?.nativeElement.querySelector(`[data-setting="${target}"]`) ?? null
      );
    }
    return this.preferencesRef()?.nativeElement ?? null;
  }
}
