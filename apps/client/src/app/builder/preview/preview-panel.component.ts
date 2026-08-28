import { Component, computed, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Binding, ComponentNode, DomainContext } from '@rosettadash/core';
import { resolvePresentationDimensions } from '@rosettadash/core';
import { AppSelectComponent } from '../../shared/app-select/app-select.component';
import { computeCanvasContentBounds } from '../canvas/canvas-viewport';
import { BuilderStateService } from '../builder-state.service';
import { PreviewDataService } from './preview-data.service';
import { PreviewNodeComponent } from './preview-node.component';

const PREVIEW_LOAD_DEBOUNCE_MS = 200;

const PREVIEW_TYPE_MIN_HEIGHT: Record<string, number> = {
  'visual.table': 220,
  'visual.chart.line': 200,
  'visual.chart.bar': 200,
  'visual.chart.pie': 200,
  'visual.kpi': 120,
  'visual.detail': 160,
  'visual.input.select': 120,
  'visual.input.date-range': 120,
  'domain.time-preset': 120,
};

function estimatePreviewNodeHeight(node: ComponentNode): number {
  const presentation = resolvePresentationDimensions(node);
  if (presentation) {
    return presentation.height;
  }
  const layoutHeight = node.layout?.height ?? 72;
  const typeMinimum = PREVIEW_TYPE_MIN_HEIGHT[node.type] ?? layoutHeight;
  return Math.max(layoutHeight, typeMinimum);
}

interface PreviewNodePayload {
  id: string;
  type: string;
  properties: Record<string, unknown>;
}

interface PreviewLoadPayload {
  projectName?: string;
  compositeName?: string;
  dateRangePreset: string;
  domainContext?: {
    client?: DomainContext['client'];
    project?: DomainContext['project'];
    defaultTimeRange?: DomainContext['defaultTimeRange'];
  };
  limit: number;
  nodes: PreviewNodePayload[];
  bindings: Binding[];
}

@Component({
  selector: 'app-preview-panel',
  imports: [FormsModule, PreviewNodeComponent, AppSelectComponent],
  templateUrl: './preview-panel.component.html',
  styleUrl: './preview-panel.component.scss',
})
export class PreviewPanelComponent {
  protected readonly state = inject(BuilderStateService);
  protected readonly previewData = inject(PreviewDataService);

  protected readonly previewRoleOptions = computed(() => this.state.previewRoleOptions());

  protected readonly previewRoleSelectOptions = computed(() =>
    this.previewRoleOptions().map((role) => ({ value: role.id, label: role.name })),
  );

  protected readonly sortedPreviewNodes = computed(() =>
    [...this.state.previewNodes()].sort((left, right) => {
      const leftY = left.layout?.y ?? 0;
      const rightY = right.layout?.y ?? 0;
      if (leftY !== rightY) {
        return leftY - rightY;
      }
      return (left.layout?.x ?? 0) - (right.layout?.x ?? 0);
    }),
  );

  protected readonly previewContentBounds = computed(() =>
    computeCanvasContentBounds(this.state.previewNodes(), estimatePreviewNodeHeight),
  );

  protected readonly dashboardBanner = computed(() => {
    const composite = this.state.composite();
    if (!composite?.templateId) {
      return null;
    }
    return {
      name: composite.name,
      description: composite.description,
      templateId: composite.templateId,
    };
  });

  private readonly previewLoadFingerprint = computed(() => {
    const project = this.state.project();
    const composite = this.state.composite();
    const domainContext = composite?.domainContext;
    const nodes = this.state.nodes();
    const dateRangeNode = nodes.find((node) => node.type === 'visual.input.date-range');
    const timePresetNode = nodes.find((node) => node.type === 'domain.time-preset');
    const preset =
      this.previewData.selectedTimePreset() ??
      (typeof dateRangeNode?.properties['preset'] === 'string'
        ? dateRangeNode.properties['preset']
        : typeof timePresetNode?.properties['defaultPreset'] === 'string'
          ? timePresetNode.properties['defaultPreset']
          : domainContext?.defaultTimeRange ?? 'last-7-days');

    return JSON.stringify({
      projectName: project?.name,
      compositeName: composite?.name,
      dateRangePreset: preset,
      domainContext,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        properties: node.properties,
      })),
      bindings: this.state.bindings(),
    });
  });

  constructor() {
    effect((onCleanup) => {
      if (this.state.workspaceMode() !== 'preview') {
        return;
      }

      this.previewLoadFingerprint();
      const timer = setTimeout(() => {
        void this.previewData.load(this.buildPreviewLoadPayload());
      }, PREVIEW_LOAD_DEBOUNCE_MS);

      onCleanup(() => clearTimeout(timer));
    });
  }

  protected updatePreviewRole(roleId: string): void {
    this.state.setPreviewRoleId(roleId);
  }

  protected isFullscreenNode(node: ComponentNode): boolean {
    return resolvePresentationDimensions(node)?.fullscreen === true;
  }

  protected previewNodeWidth(node: ComponentNode): number {
    return resolvePresentationDimensions(node)?.width ?? node.layout?.width ?? 220;
  }

  protected previewNodeHeight(node: ComponentNode): number {
    return estimatePreviewNodeHeight(node);
  }

  private buildPreviewLoadPayload(): PreviewLoadPayload {
    const project = this.state.project();
    const composite = this.state.composite();
    const domainContext = composite?.domainContext;
    const nodes = this.state.nodes();
    const dateRangeNode = nodes.find((node) => node.type === 'visual.input.date-range');
    const timePresetNode = nodes.find((node) => node.type === 'domain.time-preset');
    const preset =
      this.previewData.selectedTimePreset() ??
      (typeof dateRangeNode?.properties['preset'] === 'string'
        ? dateRangeNode.properties['preset']
        : typeof timePresetNode?.properties['defaultPreset'] === 'string'
          ? timePresetNode.properties['defaultPreset']
          : domainContext?.defaultTimeRange ?? 'last-7-days');

    return {
      projectName: project?.name,
      compositeName: composite?.name,
      dateRangePreset: preset,
      domainContext: domainContext
        ? {
            client: domainContext.client,
            project: domainContext.project,
            defaultTimeRange: domainContext.defaultTimeRange,
          }
        : undefined,
      limit: 10,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        properties: node.properties,
      })),
      bindings: this.state.bindings(),
    };
  }
}
