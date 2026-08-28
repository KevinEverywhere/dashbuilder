import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import type { Composite, ExportScope, ValidationIssue } from '@rosettadash/core';
import {
  formatStylingProfileSummary,
  getCompatibleDatabaseStackOptions,
  getCompatibleServerStackOptions,
  resolveEffectiveExportTargets,
  resolveEffectiveStylingProfile,
  resolveExportComposite,
  stylingFrameworkLabel,
  type StackDatabaseChoice,
  type StackServerChoice,
} from '@rosettadash/core';
import { firstValueFrom } from 'rxjs';
import { BuilderStateService } from '../builder-state.service';
import {
  ExportApiService,
  ExportBundleResponse,
  ExportValidationErrorBody,
  GeneratedFile,
} from './export-api.service';
import { ExportZipService } from './export-zip.service';

type UiTarget = 'react' | 'angular' | 'vue' | 'svelte' | 'web-components';
type ServerTarget = StackServerChoice;
type DatabaseTarget = StackDatabaseChoice;

interface UiTargetOption {
  id: UiTarget;
  label: string;
  description: string;
}

interface ExportScopeOption {
  id: ExportScope;
  label: string;
  description: string;
}

@Component({
  selector: 'app-export-wizard',
  templateUrl: './export-wizard.component.html',
  styleUrl: './export-wizard.component.scss',
})
export class ExportWizardComponent {
  private readonly state = inject(BuilderStateService);
  private readonly exportApi = inject(ExportApiService);
  private readonly exportZip = inject(ExportZipService);

  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly uiTargetOptions = computed(() => {
    const stackUi = this.state.project()?.stackProfile?.ui;
    if (stackUi) {
      return this.allUiTargetOptions.filter((option) => option.id === stackUi);
    }
    return this.allUiTargetOptions;
  });

  protected readonly serverTargetOptions = computed(() => getCompatibleServerStackOptions(this.uiTarget()));

  protected readonly databaseTargetOptions = computed(() =>
    getCompatibleDatabaseStackOptions(this.uiTarget()),
  );

  private readonly allUiTargetOptions: UiTargetOption[] = [
    { id: 'react', label: 'React', description: 'TSX + hooks' },
    { id: 'angular', label: 'Angular', description: 'Standalone components' },
    { id: 'vue', label: 'Vue', description: 'Composition API SFCs' },
    { id: 'svelte', label: 'Svelte', description: 'Svelte 5 runes + SFCs' },
    {
      id: 'web-components',
      label: 'Web Components',
      description: 'W3C Custom Elements + Shadow DOM',
    },
  ];

  protected readonly exportScopeOptions: ExportScopeOption[] = [
    {
      id: 'full',
      label: 'Full composite',
      description: 'Export the entire canvas graph',
    },
    {
      id: 'single',
      label: 'Selected node',
      description: 'Primary selected node plus upstream dependencies',
    },
    {
      id: 'selection',
      label: 'Selection neighborhood',
      description: 'All selected nodes and binding-connected neighbors',
    },
  ];

  protected readonly loading = signal(false);
  protected readonly downloading = signal(false);
  protected readonly exportScope = signal<ExportScope>('full');
  protected readonly uiTarget = signal<UiTarget>('react');
  protected readonly serverTarget = signal<ServerTarget>('none');
  protected readonly databaseTarget = signal<DatabaseTarget>('none');
  protected readonly bundle = signal<ExportBundleResponse | null>(null);
  protected readonly validationIssues = signal<ValidationIssue[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  private targetsSeededForOpen = false;

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.targetsSeededForOpen = false;
        return;
      }

      if (!this.targetsSeededForOpen) {
        untracked(() => this.seedTargetsFromState());
        this.targetsSeededForOpen = true;
      }

      void this.refreshPreview();
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected setUiTarget(target: UiTarget): void {
    if (this.uiTarget() === target) {
      return;
    }
    this.uiTarget.set(target);
    this.clampInfraTargetsToUi(target);
    void this.refreshPreview();
  }

  protected setServerTarget(target: ServerTarget): void {
    if (this.serverTarget() === target) {
      return;
    }
    this.serverTarget.set(target);
    void this.refreshPreview();
  }

  protected setDatabaseTarget(target: DatabaseTarget): void {
    if (this.databaseTarget() === target) {
      return;
    }
    this.databaseTarget.set(target);
    void this.refreshPreview();
  }

  protected setExportScope(scope: ExportScope): void {
    if (this.exportScope() === scope) {
      return;
    }
    this.exportScope.set(scope);
    void this.refreshPreview();
  }

  protected scopeHint(): string | null {
    const scope = this.exportScope();
    if (scope === 'full') {
      return null;
    }
    const selectedIds = this.state.selectedNodeIds();
    if (selectedIds.length === 0) {
      return 'Select a node on the canvas before exporting with this scope.';
    }
    if (selectedIds.length === 1) {
      const selected = this.state.selectedNode();
      return selected ? `Using canvas selection: ${selected.label}` : null;
    }
    return `Using ${selectedIds.length} selected nodes for export scope.`;
  }

  protected scopeSelectionMissing(): boolean {
    return this.exportScope() !== 'full' && this.state.selectedNodeIds().length === 0;
  }

  protected async refreshPreview(): Promise<void> {
    if (this.scopeSelectionMissing()) {
      this.loading.set(false);
      this.bundle.set(null);
      this.validationIssues.set([]);
      this.errorMessage.set('Select a canvas node for this export scope.');
      return;
    }

    this.loading.set(true);
    this.bundle.set(null);
    this.validationIssues.set([]);
    this.errorMessage.set(null);

    try {
      const composite = this.buildExportComposite();
      const stackProfile = this.state.project()?.stackProfile;
      const response = await firstValueFrom(this.exportApi.generateBundle(composite, stackProfile));
      this.bundle.set(response);
    } catch (error) {
      this.handleExportError(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected async downloadZip(): Promise<void> {
    const current = this.bundle();
    if (!current) {
      return;
    }

    this.downloading.set(true);
    try {
      const composite = this.buildExportComposite();
      const slug = this.exportZip.slugify(composite.name);
      await this.exportZip.download(current.files, `${slug}-export.zip`);
    } finally {
      this.downloading.set(false);
    }
  }

  protected filePaths(files: GeneratedFile[]): string[] {
    return files.map((file) => file.path).sort();
  }

  protected targetsLabel(): string {
    const current = this.bundle();
    const ui = current?.ir.targets.ui ?? this.uiTarget();
    const server = current?.ir.targets.server ?? this.serverTarget();
    const database = current?.ir.targets.database ?? this.databaseTarget();
    const serverLabel = server && server !== 'none' ? server : 'no server';
    const databaseLabel = database && database !== 'none' ? database : 'no database';
    const stylingProfile =
      current?.ir.styles.profile ??
      resolveEffectiveStylingProfile(this.state.project()?.stackProfile, ui);
    const stylingLabel =
      current?.ir.styles.framework != null
        ? stylingFrameworkLabel(current.ir.styles.framework)
        : formatStylingProfileSummary(stylingProfile);
    return `${ui} UI + ${serverLabel} + ${databaseLabel} · ${stylingLabel}`;
  }

  private seedTargetsFromState(): void {
    const project = this.state.project();
    const composite = this.state.composite();
    const targets = resolveEffectiveExportTargets(composite?.exportTargets, project?.stackProfile);
    const allowedUi = this.uiTargetOptions();
    const ui = allowedUi.some((option) => option.id === targets.ui)
      ? targets.ui
      : (allowedUi[0]?.id ?? 'react');

    this.uiTarget.set(ui);
    this.serverTarget.set(targets.server ?? 'none');
    this.databaseTarget.set(targets.database ?? 'none');
    this.clampInfraTargetsToUi(ui);
  }

  private clampInfraTargetsToUi(ui: UiTarget): void {
    const servers = getCompatibleServerStackOptions(ui).map((option) => option.id);
    const databases = getCompatibleDatabaseStackOptions(ui).map((option) => option.id);
    if (!servers.includes(this.serverTarget())) {
      this.serverTarget.set(servers.includes('none') ? 'none' : (servers[0] ?? 'none'));
    }
    if (!databases.includes(this.databaseTarget())) {
      this.databaseTarget.set(databases.includes('none') ? 'none' : (databases[0] ?? 'none'));
    }
  }

  private buildExportComposite(): Composite {
    const payload = this.state.buildCompositePayload();
    const scope = this.exportScope();
    const seedNodeIds = this.state.selectedNodeIds();

    const server = this.serverTarget();
    const database = this.databaseTarget();
    const scoped = resolveExportComposite(
      {
        ...payload,
        exportTargets: {
          ui: this.uiTarget(),
          ...(server !== 'none' ? { server } : {}),
          ...(database !== 'none' ? { database } : {}),
        },
      },
      { scope, seedNodeIds },
    );

    return scoped;
  }

  private handleExportError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      const body = error.error as ExportValidationErrorBody | undefined;
      if (body?.issues?.length) {
        this.validationIssues.set(body.issues);
        this.errorMessage.set(body.message ?? 'Composite validation failed for export');
        return;
      }
    }

    this.errorMessage.set(
      error instanceof Error ? error.message : 'Export preview failed. Is the API running?',
    );
  }
}
