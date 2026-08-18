import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { ComponentNode, isNumericFieldKey, parseRoleGateAllowedRoles, readFormFieldLabel, resolveRoleOptions, roleGateAllowsRole } from '@rosettadash/core';
import { PreviewNewsRow, PreviewRow, PRESET_LABELS } from '@rosettadash/ui-primitives';
import { AppSelectComponent } from '../../shared/app-select/app-select.component';
import { AppCollapsibleComponent } from '../../shared/app-collapsible/app-collapsible.component';
import { BuilderStateService } from '../builder-state.service';
import { ComponentPreviewAdapterRegistry } from './component-preview-adapter.registry';
import { PreviewDataService } from './preview-data.service';
import { PreviewPluginComponent } from './preview-plugin.component';

@Component({
  selector: 'app-preview-node',
  imports: [CurrencyPipe, JsonPipe, PreviewPluginComponent, AppSelectComponent, AppCollapsibleComponent],
  templateUrl: './preview-node.component.html',
  styleUrl: './preview-node.component.scss',
})
export class PreviewNodeComponent {
  readonly node = input.required<ComponentNode>();

  private readonly previewData = inject(PreviewDataService);
  private readonly state = inject(BuilderStateService);
  private readonly previewAdapters = inject(ComponentPreviewAdapterRegistry);

  protected readonly pluginTemplateId = computed(() =>
    this.previewAdapters.getTemplateId(this.node().type),
  );

  constructor() {
    effect((onCleanup) => {
      const node = this.node();
      if (node.type !== 'logic.timer') {
        return;
      }

      this.timerElapsed.set(0);
      if (!this.readBoolean('autoStart', true)) {
        this.timerRemaining.set(0);
        return;
      }

      const mode = this.readString('mode', 'interval');
      const previewStepMs = 1000;

      if (mode === 'countdown') {
        const totalSeconds = Math.max(1, Math.ceil(this.readNumber('durationMs', 30000) / 1000));
        this.timerRemaining.set(totalSeconds);
        const id = window.setInterval(() => {
          this.timerElapsed.update((value) => value + 1);
          this.timerRemaining.update((value) => Math.max(0, value - 1));
        }, previewStepMs);
        onCleanup(() => window.clearInterval(id));
        return;
      }

      const id = window.setInterval(() => {
        this.timerElapsed.update((value) => value + 1);
      }, previewStepMs);
      onCleanup(() => window.clearInterval(id));
    });
  }

  private readonly slice = computed(() =>
    this.previewData.sliceForNode(this.node().id),
  );

  protected readonly linkedToTable = computed(() => this.slice()?.linkedToTable ?? false);

  protected readonly skeletonVisible = computed(() => {
    const slice = this.slice();
    if (slice?.skeletonLoading !== undefined) {
      return slice.skeletonLoading;
    }
    if (slice?.linkedToData) {
      return this.previewData.loading();
    }
    return this.readBoolean('defaultLoading', true);
  });

  protected readonly skeletonVariant = computed(
    () => this.slice()?.skeletonVariant ?? this.readString('variant', 'table'),
  );

  protected readonly skeletonLines = computed(() => {
    const lines = this.slice()?.skeletonLines ?? this.readNumber('lines', 4);
    const count = Math.max(1, Math.min(lines, 8));
    return Array.from({ length: count }, (_, index) => index);
  });

  protected readonly timerElapsed = signal(0);
  protected readonly timerRemaining = signal(0);

  protected readonly timePresetOptions = [
    { id: 'last-7-days', label: PRESET_LABELS['last-7-days'] },
    { id: 'last-30-days', label: PRESET_LABELS['last-30-days'] },
    { id: 'qtd', label: PRESET_LABELS['qtd'] },
  ];

  protected readonly activeTimePreset = computed(
    () =>
      this.previewData.selectedTimePreset() ??
      this.slice()?.activeTimePreset ??
      this.readString('defaultPreset', 'last-7-days'),
  );

  protected readonly tableRows = computed(
    () => this.slice()?.tableRows ?? this.previewData.bundle().tableRows,
  );
  protected readonly newsRows = computed(
    () => this.slice()?.newsRows ?? this.previewData.bundle().newsRows,
  );
  protected readonly selectOptions = computed(
    () => this.previewData.bundle().selectOptions,
  );
  protected readonly chartPoints = computed(
    () => this.slice()?.chartPoints ?? this.previewData.bundle().chartPoints,
  );
  protected readonly kpiValue = computed(() => this.previewData.bundle().kpiValue);
  protected readonly kpiDelta = computed(() => this.previewData.bundle().kpiDelta);
  protected readonly dateRangeLabel = computed(
    () => this.slice()?.dateRangeLabel ?? this.previewData.bundle().dateRangeLabel,
  );
  protected readonly bindingHint = computed(() => {
    const slice = this.slice();
    if (slice?.filteredByDateRange && slice.linkedFromTable) {
      return 'Date range → table → chart';
    }
    if (slice?.filteredByDateRange) {
      return 'Filtered by date range';
    }
    if (slice?.linkedFromTable) {
      return 'Chart uses table rowset';
    }
    return null;
  });

  protected readonly chartMax = computed(() =>
    Math.max(...this.chartPoints().map((point) => point.value), 1),
  );

  protected readonly lineChartPoints = computed(() => {
    const points = this.chartPoints();
    const max = this.chartMax();
    if (points.length < 2) {
      return '';
    }
    return points
      .map((point, index) => {
        const x = index * (220 / (points.length - 1)) + 10;
        const y = 86 - (point.value / max) * 72;
        return `${x},${y}`;
      })
      .join(' ');
  });

  protected readonly pieSlices = computed(() => {
    const points = this.chartPoints();
    const total = points.reduce((sum, point) => sum + point.value, 0) || 1;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    let cumulative = 0;

    return points.map((point, index) => {
      const percent = (point.value / total) * 100;
      const slice = {
        label: point.label,
        percent,
        start: cumulative,
        color: colors[index % colors.length] ?? colors[0],
      };
      cumulative += percent;
      return slice;
    });
  });

  protected readonly pieConicGradient = computed(() => {
    const slices = this.pieSlices();
    if (slices.length === 0) {
      return 'conic-gradient(#d1d5db 0 100%)';
    }
    const stops = slices
      .map((slice) => `${slice.color} ${slice.start}% ${slice.start + slice.percent}%`)
      .join(', ');
    return `conic-gradient(${stops})`;
  });

  protected readonly detailRow = computed(() => {
    const selected = this.previewData.selectedTableRow();
    if (selected) {
      return selected;
    }
    return this.slice()?.selectedRow ?? null;
  });

  protected readonly detailFields = computed(() => {
    const row = this.detailRow();
    if (!row) {
      return [] as Array<{ key: string; value: string }>;
    }
    return Object.entries(row).map(([key, value]) => ({
      key,
      value: String(value ?? ''),
    }));
  });

  protected readonly newsArticleRow = computed(() => {
    const selected = this.previewData.selectedNewsRow();
    if (selected) {
      return selected;
    }
    return this.slice()?.selectedNewsRow ?? null;
  });

  protected readonly newsArticleFields = computed(() => {
    const row = this.newsArticleRow();
    if (!row) {
      return [] as Array<{ key: string; value: string }>;
    }
    const fields: Array<{ key: string; value: string }> = [
      { key: 'Headline', value: row.headline },
      { key: 'Source', value: row.source },
      { key: 'Region', value: row.region },
      { key: 'Published', value: row.publishedAt },
    ];
    if (this.readBoolean('showSummary', true)) {
      fields.push({ key: 'Summary', value: row.summary });
    }
    if (this.readBoolean('showUrl', true)) {
      fields.push({ key: 'URL', value: row.url });
    }
    return fields;
  });

  protected readonly newsSelectOptions = computed(() => {
    switch (this.node().type) {
      case 'visual.news.language-select':
        return [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
        ];
      case 'visual.news.region-select':
        return [
          { label: 'United States', value: 'us' },
          { label: 'United Kingdom', value: 'uk' },
          { label: 'European Union', value: 'eu' },
          { label: 'Global', value: 'global' },
        ];
      case 'visual.news.type-select':
        return [
          { label: 'Headlines', value: 'headlines' },
          { label: 'Business', value: 'business' },
          { label: 'Technology', value: 'technology' },
          { label: 'Sports', value: 'sports' },
          { label: 'Science', value: 'science' },
        ];
      default:
        return this.selectOptions();
    }
  });

  protected selectNewsRow(row: PreviewNewsRow): void {
    this.previewData.selectNewsRow(row);
  }

  protected isSelectedNewsRow(row: PreviewNewsRow): boolean {
    const selected = this.newsArticleRow();
    return !!selected && selected.id === row.id;
  }

  protected selectTableRow(row: PreviewRow): void {
    this.previewData.selectTableRow(row);
  }

  protected selectTimePreset(preset: string): void {
    this.previewData.selectTimePreset(preset);
  }

  protected isActiveTimePreset(preset: string): boolean {
    return this.activeTimePreset() === preset;
  }

  protected isSelectedTableRow(row: PreviewRow): boolean {
    const selected = this.detailRow();
    return !!selected && selected.id === row.id;
  }

  protected readonly roleGateAllowedRoles = computed(() =>
    parseRoleGateAllowedRoles(this.node().properties['roles']),
  );

  protected readonly roleGateVisible = computed(() => {
    if (this.node().type !== 'domain.role-gate') {
      return true;
    }
    return roleGateAllowsRole(this.roleGateAllowedRoles(), this.state.previewRoleId());
  });

  protected readonly roleAssignOptions = computed(() =>
    resolveRoleOptions(this.state.domainContext()?.roles),
  );

  protected readonly roleAssignSelectOptions = computed(() =>
    this.roleAssignOptions().map((role) => ({ value: role.id, label: role.name })),
  );

  protected readFieldLabel(fallback = ''): string {
    return readFormFieldLabel(this.node().properties, this.node().label || fallback);
  }

  protected showsFieldLabel(): boolean {
    return this.readFieldLabel().length > 0;
  }

  protected readString(key: string, fallback = ''): string {
    const value = this.node().properties[key];
    return typeof value === 'string' ? value : fallback;
  }

  protected readNumber(key: string, fallback: number): number {
    const value = this.node().properties[key];
    return typeof value === 'number' ? value : fallback;
  }

  protected readBoolean(key: string, fallback = false): boolean {
    const value = this.node().properties[key];
    return typeof value === 'boolean' ? value : fallback;
  }

  protected formatKpi(value: number): string {
    const format = this.readString('format', 'number');
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (format === 'percent') {
      return `${value}%`;
    }
    return new Intl.NumberFormat('en-US').format(value);
  }

  protected isNumericDetailKey(key: string): boolean {
    return isNumericFieldKey(key);
  }
}
