import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  defaultComponentRegistry,
  nodeHasRowsetDataInput,
  resolveDataWiring,
  type DataWiringReport,
} from '@rosettadash/core';
import { EnvironmentConfigService } from '../../environment/environment-config.service';
import { BuilderStateService } from '../builder-state.service';
import { PreviewDataService } from '../preview/preview-data.service';
import { DataWiringProbeService } from './data-wiring-probe.service';

export interface CanvasRowsetSource {
  nodeId: string;
  nodeLabel: string;
  typeLabel: string;
  portId: string;
  portName: string;
}

@Component({
  selector: 'app-data-wiring-panel',
  imports: [FormsModule],
  templateUrl: './data-wiring-panel.component.html',
  styleUrl: './data-wiring-panel.component.scss',
})
export class DataWiringPanelComponent {
  private readonly state = inject(BuilderStateService);
  private readonly envConfig = inject(EnvironmentConfigService);
  private readonly probeService = inject(DataWiringProbeService);
  private readonly previewData = inject(PreviewDataService);

  protected readonly useProbeCredentials = signal(false);
  protected readonly probeUsername = signal('');
  protected readonly probePassword = signal('');
  protected readonly connectionUrlDraft = signal('');
  protected readonly anonKeyDraft = signal('');
  protected readonly probing = signal(false);
  protected readonly probeMessage = signal<string | null>(null);
  protected readonly probeOk = signal<boolean | null>(null);
  protected readonly lastVerifiedAt = signal<string | null>(null);
  protected readonly connectMessage = signal<string | null>(null);

  protected readonly node = computed(() => this.state.selectedNode());
  protected readonly showPanel = computed(() => {
    const node = this.node();
    return node ? nodeHasRowsetDataInput(defaultComponentRegistry, node.type) : false;
  });

  protected readonly wiringReport = computed((): DataWiringReport | null => {
    const node = this.node();
    if (!node) {
      return null;
    }
    return resolveDataWiring(
      this.state.nodes(),
      this.state.bindings(),
      defaultComponentRegistry,
      node.id,
    );
  });

  protected readonly canvasRowsetSources = computed((): CanvasRowsetSource[] =>
    this.state
      .nodes()
      .filter((candidate) => candidate.id !== this.node()?.id)
      .flatMap((candidate) => {
        const definition = defaultComponentRegistry.get(candidate.type);
        const rowsetOutputs =
          definition?.outputs.filter((port) => port.dataType === 'rowset') ?? [];
        if (!rowsetOutputs.length) {
          return [];
        }
        const typeLabel = definition?.label ?? candidate.type;
        return rowsetOutputs.map((port) => ({
          nodeId: candidate.id,
          nodeLabel: candidate.label,
          typeLabel,
          portId: port.id,
          portName: port.name,
        }));
      }),
  );

  protected readonly previewRowPreview = computed(() => {
    const node = this.node();
    if (!node) {
      return this.previewData.previewRowPreview();
    }
    return this.previewData.previewRowPreviewForNode(node.id);
  });

  protected readonly showingLiveData = computed(() => {
    const node = this.node();
    if (!node) {
      return false;
    }
    return this.previewData.sliceForNode(node.id)?.linkedToData === true;
  });

  constructor() {
    effect(() => {
      const report = this.wiringReport();
      const nodeId = this.node()?.id ?? '';
      if (!report || !nodeId) {
        return;
      }
      this.resetProbeResult();
      this.connectMessage.set(null);
      const urlKey = report.connectionEnvKey;
      this.connectionUrlDraft.set(urlKey ? this.envConfig.getValue(urlKey) : '');
      const anonKey = report.anonKeyEnvKey;
      this.anonKeyDraft.set(anonKey ? this.envConfig.getValue(anonKey) : '');
      this.useProbeCredentials.set(false);
      this.probeUsername.set('');
      this.probePassword.set('');
    });
  }

  protected sourceTypeLabel(type?: string): string {
    if (!type) {
      return '';
    }
    return defaultComponentRegistry.get(type)?.label ?? type;
  }

  protected connectSource(source: CanvasRowsetSource): void {
    const node = this.node();
    if (!node) {
      return;
    }

    const result = this.state.connectBinding(
      source.nodeId,
      source.portId,
      node.id,
      'data',
    );

    if (result.ok) {
      this.connectMessage.set(
        `Connected ${source.nodeLabel}.${source.portName} → ${node.label}.data`,
      );
      return;
    }

    this.connectMessage.set(result.error ?? 'Could not connect.');
  }

  protected wiringStatusLabel(report: DataWiringReport): string {
    if (this.probeOk() === true && report.status === 'ready') {
      return 'Verified';
    }
    switch (report.status) {
      case 'ready':
        return 'Wired — not verified';
      case 'incomplete':
        return 'Incomplete wiring';
      default:
        return 'Not wired';
    }
  }

  protected wiringStatusClass(report: DataWiringReport): string {
    if (this.probeOk() === true && report.status === 'ready') {
      return 'data-wiring__status--verified';
    }
    if (report.status === 'ready') {
      return 'data-wiring__status--ready';
    }
    if (report.status === 'incomplete') {
      return 'data-wiring__status--incomplete';
    }
    return 'data-wiring__status--unwired';
  }

  protected onConnectionUrlInput(value: string): void {
    this.connectionUrlDraft.set(value);
    this.resetProbeResult();
  }

  protected onAnonKeyInput(value: string): void {
    this.anonKeyDraft.set(value);
    this.resetProbeResult();
  }

  protected toggleProbeCredentials(enabled: boolean): void {
    this.useProbeCredentials.set(enabled);
    if (!enabled) {
      this.probeUsername.set('');
      this.probePassword.set('');
    }
    this.resetProbeResult();
  }

  protected async verifyWiring(): Promise<void> {
    const node = this.node();
    const report = this.wiringReport();
    if (!node || !report) {
      return;
    }

    if (report.status !== 'ready') {
      this.probeOk.set(false);
      this.probeMessage.set(
        report.issues[0]?.message ?? 'Fix wiring issues before verifying.',
      );
      return;
    }

    const request = this.probeService.buildProbeRequest(
      report,
      this.connectionUrlDraft(),
      this.anonKeyDraft(),
      this.useProbeCredentials()
        ? { username: this.probeUsername(), password: this.probePassword() }
        : undefined,
    );

    if (!request?.connectionUrl) {
      this.probeOk.set(false);
      this.probeMessage.set(
        `Enter ${report.connectionEnvKey ?? 'connection URL'} or set it on the Environment page.`,
      );
      return;
    }

    this.probing.set(true);
    this.probeMessage.set(null);
    this.probeOk.set(null);

    try {
      const result = await this.probeService.probe(request);
      this.probeOk.set(result.ok);
      this.probeMessage.set(result.message);
      if (result.ok) {
        this.lastVerifiedAt.set(new Date().toLocaleString());
        if (result.sampleRows?.length) {
          this.previewData.applyProbedTableRows(node.id, result.sampleRows);
        }
      }
    } catch {
      this.probeOk.set(false);
      this.probeMessage.set('Probe request failed — is the builder server running?');
    } finally {
      this.probing.set(false);
    }
  }

  private resetProbeResult(): void {
    this.probeOk.set(null);
    this.probeMessage.set(null);
    this.lastVerifiedAt.set(null);
  }
}
