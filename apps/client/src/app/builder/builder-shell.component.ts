import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { canEnterBuilder } from '../welcome/stack-profile-session';
import { AppNavComponent } from '../shared/app-nav/app-nav.component';
import { BuilderAssistanceService } from './builder-assistance.service';
import { BuilderAuthGateComponent } from './builder-auth-gate.component';
import { BuilderAuthService } from './builder-auth.service';
import { BuilderProjectService } from './builder-project.service';
import { BuilderViewportGateComponent } from './builder-viewport-gate.component';
import { BuilderStateService, WorkspaceMode } from './builder-state.service';
import { DisplayAvailabilityService } from './display-availability.service';
import { BuilderWorkspaceLayoutService } from './builder-workspace-layout.service';
import { CanvasComponent } from './canvas/canvas.component';
import { ExportWizardComponent } from './export/export-wizard.component';
import { AiDrawerComponent } from './ai/ai-drawer.component';
import { AiAssistService } from './ai/ai-assist.service';
import { CreationWizardComponent } from './creation-wizard/creation-wizard.component';
import { CreationWizardService } from './creation-wizard/creation-wizard.service';
import { AdminFeatureFlagsService } from '../admin/admin-feature-flags.service';
import { ContentLibraryService } from '../admin/content-library.service';
import { InspectorComponent } from './inspector/inspector.component';
import { PaletteComponent } from './palette/palette.component';
import { PreviewPanelComponent } from './preview/preview-panel.component';
import { PreviewDataService } from './preview/preview-data.service';

@Component({
  selector: 'app-builder-shell',
  imports: [
    PaletteComponent,
    CanvasComponent,
    PreviewPanelComponent,
    InspectorComponent,
    ExportWizardComponent,
    AiDrawerComponent,
    CreationWizardComponent,
    BuilderAuthGateComponent,
    BuilderViewportGateComponent,
    AppNavComponent,
  ],
  templateUrl: './builder-shell.component.html',
  styleUrl: './builder-shell.component.scss',
})
export class BuilderShellComponent implements OnInit {
  private readonly projectService = inject(BuilderProjectService);
  private readonly router = inject(Router);
  protected readonly auth = inject(BuilderAuthService);
  protected readonly state = inject(BuilderStateService);
  protected readonly viewport = inject(DisplayAvailabilityService);
  protected readonly layout = inject(BuilderWorkspaceLayoutService);
  protected readonly featureFlags = inject(AdminFeatureFlagsService);
  protected readonly contentLibrary = inject(ContentLibraryService);
  protected readonly creationWizard = inject(CreationWizardService);
  protected readonly assistance = inject(BuilderAssistanceService);
  private readonly aiAssist = inject(AiAssistService);
  private readonly previewData = inject(PreviewDataService);

  protected readonly exportWizardOpen = signal(false);
  protected readonly aiDrawerOpen = signal(false);

  protected stackSummary(): string {
    const profile = this.state.project()?.stackProfile;
    if (!profile?.ui) {
      return '';
    }
    const server = profile.server && profile.server !== 'none' ? profile.server : 'UI only';
    return `${profile.ui} · ${server}`;
  }

  async ngOnInit(): Promise<void> {
    if (!canEnterBuilder()) {
      void this.router.navigate(['/']);
      return;
    }

    if (this.viewport.blocked()) {
      return;
    }

    await this.auth.initialize();
    this.featureFlags.initialize();
    this.contentLibrary.initialize();
    void this.previewData.refreshPreviewContentFromFile();
    if (this.auth.authenticated()) {
      await this.projectService.initialize();
      if (this.creationWizard.shouldAutoShowWelcomeBanner()) {
        this.creationWizard.showWelcomeBanner.set(true);
      }
    }
  }

  protected async onLogin(apiKey: string): Promise<void> {
    const ok = await this.auth.login(apiKey);
    if (ok) {
      await this.projectService.initialize();
    }
  }

  protected save(): void {
    void this.projectService.save();
  }

  protected saveToLibrary(): void {
    if (this.state.nodes().length === 0) {
      return;
    }
    const composite = this.state.buildCompositePayload();
    const label = composite.name?.trim() || 'Untitled dashboard';
    this.contentLibrary.saveComposite({
      label,
      composite,
      stackProfile: this.state.project()?.stackProfile ?? null,
    });
  }

  protected setWorkspaceMode(mode: WorkspaceMode): void {
    this.state.setWorkspaceMode(mode);
  }

  protected openCreationWizard(): void {
    this.creationWizard.openWizard();
  }

  protected toggleHowItWorksAssistance(): void {
    this.assistance.toggleHowItWorksAssistance();
  }

  protected async onCreationWizardAi(prompt: string): Promise<void> {
    this.openAiDrawer();
    await this.aiAssist.initialize();
    await this.aiAssist.sendPrompt(prompt);
  }

  protected openExportWizard(): void {
    this.exportWizardOpen.set(true);
  }

  protected closeExportWizard(): void {
    this.exportWizardOpen.set(false);
  }

  protected openAiDrawer(): void {
    this.aiDrawerOpen.set(true);
  }

  protected closeAiDrawer(): void {
    this.aiDrawerOpen.set(false);
  }

  protected undo(): void {
    this.state.undo();
  }

  protected redo(): void {
    this.state.redo();
  }

  protected onPaletteSplitterPointerDown(event: PointerEvent): void {
    if (this.layout.compact()) {
      return;
    }
    event.preventDefault();
    this.layout.beginPanelResize('palette', event.clientX);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onInspectorSplitterPointerDown(event: PointerEvent): void {
    if (this.layout.compact()) {
      return;
    }
    event.preventDefault();
    this.layout.beginPanelResize('inspector', event.clientX);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onSplitterPointerMove(event: PointerEvent): void {
    if (!this.layout.resizing()) {
      return;
    }
    this.layout.updatePanelResize(event.clientX);
  }

  protected onSplitterPointerUp(): void {
    this.layout.endPanelResize();
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (
      this.auth.checking() ||
      (this.auth.authEnabled() && !this.auth.authenticated()) ||
      this.state.loading() ||
      this.exportWizardOpen() ||
      this.aiDrawerOpen() ||
      this.creationWizard.open()
    ) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    const mod = event.metaKey || event.ctrlKey;
    if (!mod) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
      return;
    }

    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      this.redo();
      return;
    }

    if (key === 'y') {
      event.preventDefault();
      this.redo();
    }
  }

  protected statusLabel(): string {
    if (this.state.loading()) {
      return 'Loading…';
    }
    if (this.state.saveStatus() === 'saving') {
      return 'Saving…';
    }
    if (this.state.saveStatus() === 'saved') {
      return 'Saved';
    }
    if (this.state.saveStatus() === 'error') {
      return this.state.errorMessage() ?? 'Save failed';
    }
    if (this.state.dirty()) {
      return 'Unsaved changes';
    }
    return 'Ready';
  }
}
