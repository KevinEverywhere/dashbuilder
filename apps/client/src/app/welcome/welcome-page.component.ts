import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  APP_NAME,
  createEmptyStylingProfile,
  formatStylingProfileSummary,
  getCompatibleDatabaseStackOptions,
  getCompatibleServerStackOptions,
  getStylingAuthoringStackOptions,
  getStylingComponentLibraryStackOptions,
  getStylingFoundationStackOptions,
  normalizeStackProfile,
  normalizeStackStyling,
  resolveStackDatabaseChoiceForUi,
  resolveStackServerChoiceForUi,
  SERVER_STACK_ECOSYSTEM_NOTE,
  type StackDatabaseChoice,
  type StackProfile,
  type StackServerChoice,
  type StackStylingProfile,
  type StylingAuthoringStackChoice,
  type StylingComponentLibraryStackChoice,
  type StylingFoundationStackChoice,
  type UiFrameworkChoice,
  UI_TARGET_GROUPS,
  UI_FRAMEWORK_OPTIONS,
} from '@rosettadash/core';
import { AppNavComponent } from '../shared/app-nav/app-nav.component';
import { AppCollapsibleComponent } from '../shared/app-collapsible/app-collapsible.component';
import { AppMarkdownViewerComponent } from '../shared/app-markdown-viewer/app-markdown-viewer.component';
import { ProjectsApiService } from '../builder/projects-api.service';
import {
  clearBuilderSession,
  hasBuilderSession,
  readActiveStackProfile,
  readBuilderSession,
  writeActiveStackProfile,
  writePendingProjectName,
  writePendingStackProfile,
} from './stack-profile-session';

type WelcomeSection = 'ui' | 'server' | 'database' | 'styling' | 'docs';
type WelcomeConfirmKind = 'stack-change-target' | 'start-fresh-unchanged';
type StackChangeTarget = 'current' | 'fresh';

@Component({
  selector: 'app-welcome-page',
  imports: [AppNavComponent, AppCollapsibleComponent, AppMarkdownViewerComponent],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss',
})
export class WelcomePageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly projectsApi = inject(ProjectsApiService);

  protected readonly appName = APP_NAME;
  protected readonly uiTargetGroups = UI_TARGET_GROUPS;
  protected readonly allUiOptions = UI_FRAMEWORK_OPTIONS;
  protected readonly serverEcosystemNote = SERVER_STACK_ECOSYSTEM_NOTE;

  protected readonly serverOptions = computed(() => {
    const ui = this.uiChoice();
    return ui ? getCompatibleServerStackOptions(ui) : [];
  });
  protected readonly databaseOptions = computed(() => {
    const ui = this.uiChoice();
    return ui ? getCompatibleDatabaseStackOptions(ui) : [];
  });

  protected readonly uiChoice = signal<UiFrameworkChoice | null>(null);
  protected readonly dashboardName = signal('');
  protected readonly serverChoice = signal<StackServerChoice | null>(null);
  protected readonly databaseChoice = signal<StackDatabaseChoice | null>(null);
  protected readonly stylingProfile = signal<StackStylingProfile | null>(null);
  protected readonly openSections = signal<ReadonlySet<WelcomeSection>>(new Set());
  protected readonly confirmDialog = signal<WelcomeConfirmKind | null>(null);

  private readonly isReturningUser = signal(false);
  private baselineProfile: StackProfile | null = null;
  private stackChangeTarget: StackChangeTarget | null = null;
  private pendingStackMutation: (() => void) | null = null;

  protected readonly foundationOptions = computed(() => {
    const ui = this.uiChoice();
    return ui ? getStylingFoundationStackOptions(ui) : [];
  });
  protected readonly componentLibraryOptions = computed(() => {
    const ui = this.uiChoice();
    return ui ? getStylingComponentLibraryStackOptions(ui) : [];
  });
  protected readonly authoringOptions = computed(() => {
    const ui = this.uiChoice();
    return ui ? getStylingAuthoringStackOptions(ui) : [];
  });
  protected readonly showComponentLibrarySection = computed(() => {
    const ui = this.uiChoice();
    if (!ui) {
      return false;
    }
    return getStylingComponentLibraryStackOptions(ui).length > 1;
  });

  protected readonly selectedUiLabel = computed(() => {
    const ui = this.uiChoice();
    if (!ui) {
      return '';
    }
    return this.allUiOptions.find((option) => option.id === ui)?.label ?? '';
  });

  protected readonly stylingSummary = computed(() => {
    const profile = this.stylingProfile();
    return profile ? formatStylingProfileSummary(profile) : '';
  });

  protected readonly serverSummary = computed(() => {
    const server = this.serverChoice();
    if (!server) {
      return '';
    }
    return this.serverOptions().find((option) => option.id === server)?.label ?? '';
  });

  protected readonly databaseSummary = computed(() => {
    const database = this.databaseChoice();
    if (!database) {
      return '';
    }
    return this.databaseOptions().find((option) => option.id === database)?.label ?? '';
  });

  protected readonly showFrameworkPrompt = computed(() => this.uiChoice() === null);

  protected stylingSectionTitle(): string {
    const ui = this.uiChoice();
    if (!ui) {
      return 'Styling';
    }
    if (ui === 'web-components') {
      return 'Styling for Web Components';
    }
    return `Styling for ${this.selectedUiLabel()}`;
  }

  ngOnInit(): void {
    if (hasBuilderSession()) {
      this.isReturningUser.set(true);
      const active = readActiveStackProfile();
      if (active) {
        this.baselineProfile = normalizeStackProfile(active) ?? null;
      }
    }
  }

  protected hasExistingSession(): boolean {
    return hasBuilderSession();
  }

  protected hasUiChoice(): boolean {
    return this.uiChoice() !== null;
  }

  protected canContinue(): boolean {
    if (this.hasExistingSession() && !this.hasUiChoice()) {
      return true;
    }
    if (!this.hasUiChoice()) {
      return false;
    }
    if (this.hasExistingSession()) {
      return true;
    }
    return this.dashboardName().trim().length > 0;
  }

  protected canStartFresh(): boolean {
    if (this.hasExistingSession() && !this.hasUiChoice()) {
      return true;
    }
    return this.hasUiChoice() && this.dashboardName().trim().length > 0;
  }

  protected showDashboardNameField(): boolean {
    return !this.hasExistingSession() || this.hasUiChoice();
  }

  protected isSectionOpen(section: WelcomeSection): boolean {
    return this.openSections().has(section);
  }

  protected toggleSection(section: WelcomeSection): void {
    const next = new Set(this.openSections());
    if (next.has(section)) {
      next.delete(section);
    } else {
      next.add(section);
    }
    this.openSections.set(next);
  }

  protected selectUi(ui: UiFrameworkChoice): void {
    this.requestStackMutation(() => {
      this.uiChoice.set(ui);
      this.applyUiDefaults(ui);
    });
  }

  protected selectServer(server: StackServerChoice): void {
    this.requestStackMutation(() => this.serverChoice.set(server));
  }

  protected selectDatabase(database: StackDatabaseChoice): void {
    this.requestStackMutation(() => this.databaseChoice.set(database));
  }

  protected isFoundationSelected(foundation: StylingFoundationStackChoice): boolean {
    const profile = this.stylingProfile();
    if (foundation === 'none') {
      return (profile?.foundation.length ?? 0) === 0;
    }
    return profile?.foundation.includes(foundation) ?? false;
  }

  protected selectFoundation(foundation: StylingFoundationStackChoice): void {
    this.requestStackMutation(() => {
      const ui = this.uiChoice();
      const current = this.stylingProfile();
      if (!ui || !current) {
        return;
      }
      const next = foundation === 'none' ? [] : [foundation];
      this.stylingProfile.set(normalizeStackStyling(ui, { ...current, foundation: next }));
    });
  }

  protected isComponentLibrarySelected(library: StylingComponentLibraryStackChoice): boolean {
    if (library === 'none') {
      return !this.stylingProfile()?.componentLibrary;
    }
    return this.stylingProfile()?.componentLibrary === library;
  }

  protected selectComponentLibrary(library: StylingComponentLibraryStackChoice): void {
    this.requestStackMutation(() => {
      const ui = this.uiChoice();
      const current = this.stylingProfile();
      if (!ui || !current) {
        return;
      }
      this.stylingProfile.set(
        normalizeStackStyling(ui, {
          ...current,
          componentLibrary: library === 'none' ? undefined : library,
        }),
      );
    });
  }

  protected isAuthoringSelected(authoring: StylingAuthoringStackChoice): boolean {
    const profile = this.stylingProfile();
    if (authoring === 'none') {
      return (profile?.authoring.length ?? 0) === 0;
    }
    return profile?.authoring.includes(authoring) ?? false;
  }

  protected selectAuthoring(authoring: StylingAuthoringStackChoice): void {
    this.requestStackMutation(() => {
      const ui = this.uiChoice();
      const current = this.stylingProfile();
      if (!ui || !current) {
        return;
      }
      const next = authoring === 'none' ? [] : [authoring];
      this.stylingProfile.set(normalizeStackStyling(ui, { ...current, authoring: next }));
    });
  }

  protected setInlineStyles(enabled: boolean): void {
    this.requestStackMutation(() => {
      const ui = this.uiChoice();
      const current = this.stylingProfile();
      if (!ui || !current) {
        return;
      }
      this.stylingProfile.set(
        normalizeStackStyling(ui, {
          ...current,
          inlineStyles: enabled,
        }),
      );
    });
  }

  protected requestContinue(): void {
    void this.continueToBuilder();
  }

  protected requestStartFresh(): void {
    if (this.isReturningUser() && !this.isStackDirty()) {
      this.confirmDialog.set('start-fresh-unchanged');
      return;
    }
    void this.continueToBuilder({ fresh: true });
  }

  protected confirmStackChangeTarget(target: StackChangeTarget): void {
    this.stackChangeTarget = target;
    this.pendingStackMutation?.();
    this.pendingStackMutation = null;
    this.confirmDialog.set(null);
    if (target === 'current') {
      this.captureBaseline();
      void this.persistStackToCurrentProject();
    }
  }

  protected cancelConfirmDialog(): void {
    this.pendingStackMutation = null;
    this.confirmDialog.set(null);
  }

  protected startFreshWithExistingStack(): void {
    this.confirmDialog.set(null);
    void this.continueToBuilder({ fresh: true, useBaselineStack: true });
  }

  protected dismissStartFreshDialog(): void {
    this.confirmDialog.set(null);
    this.resetStackSelectors();
  }

  protected uiSectionSummary(): string {
    return this.hasUiChoice() ? this.selectedUiLabel() : 'Select';
  }

  protected serverSectionSummary(): string {
    if (!this.hasUiChoice()) {
      return 'Select';
    }
    return this.serverSummary() || 'Select';
  }

  protected databaseSectionSummary(): string {
    if (!this.hasUiChoice()) {
      return 'Select';
    }
    return this.databaseSummary() || 'Select';
  }

  protected stylingSectionSummary(): string {
    if (!this.hasUiChoice()) {
      return 'Select';
    }
    return this.stylingSummary() || 'Select';
  }

  protected isPlaceholderSummary(value: string): boolean {
    return value === 'Select';
  }

  private resetStackSelectors(): void {
    this.uiChoice.set(null);
    this.dashboardName.set('');
    this.serverChoice.set(null);
    this.databaseChoice.set(null);
    this.stylingProfile.set(null);
    this.openSections.set(new Set(['ui']));
  }

  private resetStackSelections(): void {
    this.resetStackSelectors();
    this.baselineProfile = null;
    this.stackChangeTarget = null;
    this.pendingStackMutation = null;
  }

  protected async continueToBuilder(options?: {
    fresh?: boolean;
    useBaselineStack?: boolean;
  }): Promise<void> {
    const fresh = options?.fresh ?? false;
    const useBaselineStack = options?.useBaselineStack ?? false;

    if (useBaselineStack) {
      if (!this.baselineProfile) {
        return;
      }
    } else if (fresh) {
      if (!this.canStartFresh()) {
        return;
      }
    } else if (!this.canContinue()) {
      return;
    }

    const profile = this.resolveStackProfileForNavigation({
      fresh,
      useBaselineStack,
    });
    if (!profile) {
      return;
    }

    if (fresh) {
      clearBuilderSession();
    }

    if (this.hasUiChoice() || fresh || !hasBuilderSession()) {
      writePendingStackProfile(profile);
      writeActiveStackProfile(profile);
    }

    const trimmedName = this.dashboardName().trim();
    if (trimmedName && (!hasBuilderSession() || fresh)) {
      writePendingProjectName(trimmedName);
    }

    if (hasBuilderSession() && this.hasUiChoice() && !fresh) {
      void this.persistStackToCurrentProject(trimmedName || undefined);
    }

    void this.router.navigate(['/builder']);
  }

  private requestStackMutation(mutate: () => void): void {
    if (!this.isReturningUser() || !this.baselineProfile) {
      mutate();
      return;
    }

    if (this.stackChangeTarget === 'fresh') {
      mutate();
      return;
    }

    if (this.stackChangeTarget === 'current') {
      mutate();
      void this.persistStackToCurrentProject();
      return;
    }

    mutate();
    if (!this.hasUiChoice()) {
      return;
    }

    const nextProfile = normalizeStackProfile(this.buildProfile());
    if (JSON.stringify(nextProfile) === JSON.stringify(this.baselineProfile)) {
      return;
    }

    this.resetStackSelectors();
    this.pendingStackMutation = mutate;
    this.confirmDialog.set('stack-change-target');
  }

  private async persistStackToCurrentProject(projectName?: string): Promise<void> {
    const session = readBuilderSession();
    const profile = this.hasUiChoice() ? normalizeStackProfile(this.buildProfile()) : null;
    if (!session || !profile) {
      return;
    }

    try {
      await firstValueFrom(
        this.projectsApi.updateProject(session.projectId, {
          stackProfile: profile,
          ...(projectName ? { name: projectName } : {}),
        }),
      );
    } catch {
      // API may be down; keep the chosen stack locally so export and resume stay in sync.
    }
    writeActiveStackProfile(profile);
  }

  private resolveStackProfileForNavigation(options?: {
    fresh?: boolean;
    useBaselineStack?: boolean;
  }): StackProfile | null {
    if (options?.useBaselineStack && this.baselineProfile) {
      return normalizeStackProfile(this.baselineProfile) ?? null;
    }
    if (this.hasUiChoice()) {
      return normalizeStackProfile(this.buildProfile()) ?? null;
    }
    if (this.hasExistingSession() && this.baselineProfile && !options?.fresh) {
      return normalizeStackProfile(this.baselineProfile) ?? null;
    }
    return null;
  }

  private isStackDirty(): boolean {
    if (!this.baselineProfile || !this.hasUiChoice()) {
      return false;
    }
    return JSON.stringify(this.buildProfile()) !== JSON.stringify(this.baselineProfile);
  }

  private captureBaseline(): void {
    if (!this.hasUiChoice()) {
      this.baselineProfile = null;
      return;
    }
    this.baselineProfile = this.buildProfile();
  }

  private applyUiDefaults(ui: UiFrameworkChoice): void {
    this.serverChoice.set(resolveStackServerChoiceForUi(ui, this.serverChoice()));
    this.databaseChoice.set(resolveStackDatabaseChoiceForUi(ui, this.databaseChoice()));
    this.stylingProfile.set(createEmptyStylingProfile());
  }

  private buildProfile(): StackProfile {
    const ui = this.uiChoice();
    if (!ui) {
      throw new Error('UI framework must be selected before building a stack profile');
    }
    return {
      ui,
      server: this.serverChoice() ?? 'none',
      database: this.databaseChoice() ?? 'none',
      styling: this.stylingProfile() ?? createEmptyStylingProfile(),
    };
  }

  private hydrateFromProfile(profile: StackProfile): void {
    this.uiChoice.set(profile.ui);
    this.serverChoice.set(resolveStackServerChoiceForUi(profile.ui, profile.server ?? null));
    this.databaseChoice.set(resolveStackDatabaseChoiceForUi(profile.ui, profile.database ?? null));
    this.stylingProfile.set(
      normalizeStackStyling(profile.ui, profile.styling ?? createEmptyStylingProfile()),
    );
  }
}
