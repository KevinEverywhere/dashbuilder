import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  NodePreviewSlice,
  PreviewDataBundle,
  PreviewDataRequest,
  PreviewNewsRow,
  PreviewRow,
  BUILTIN_PREVIEW_CONTENT_SLICE,
  formatPreviewRowNames,
  generatePreviewData,
  getDefaultPreviewData,
  resolvePreviewContent,
  type PreviewContentDocument,
  type PreviewContentSlice,
} from '@rosettadash/ui-primitives';
import { firstValueFrom } from 'rxjs';

export type PreviewDataSource = 'default' | 'api' | 'file';

@Injectable({ providedIn: 'root' })
export class PreviewDataService {
  private readonly http = inject(HttpClient);

  readonly contentSlice = signal<PreviewContentSlice>(BUILTIN_PREVIEW_CONTENT_SLICE);
  readonly contentDocument = signal<PreviewContentDocument | null>(null);
  readonly bundle = signal<PreviewDataBundle>(getDefaultPreviewData());
  readonly loading = signal(false);
  readonly source = signal<PreviewDataSource>('default');
  readonly selectedTableRow = signal<PreviewRow | null>(null);
  readonly selectedNewsRow = signal<PreviewNewsRow | null>(null);
  readonly selectedTimePreset = signal<string | null>(null);
  /** Ephemeral preview-only values for interactive form fields (not persisted to composite). */
  readonly fieldValues = signal<Record<string, string>>({});

  readonly nodeSlices = computed(() => this.bundle().nodes);

  readonly previewRowPreview = computed(() =>
    formatPreviewRowNames(this.bundle().tableRows),
  );

  async refreshPreviewContentFromFile(): Promise<void> {
    try {
      const raw = await firstValueFrom(
        this.http.get<unknown>('/preview-content.json'),
      );
      const { document, slice } = resolvePreviewContent(raw);
      if (slice.tableRows.length) {
        this.contentDocument.set(document);
        this.contentSlice.set(slice);
        this.bundle.set(generatePreviewData({ contentSlice: slice }));
        this.source.set('file');
        this.syncDefaultSelectedRow(this.bundle());
      }
    } catch {
      // Bundled preview-content.json is used via getDefaultPreviewData().
    }
  }

  async load(request: PreviewDataRequest): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.post<PreviewDataBundle>('/api/preview/data', {
          ...request,
        }),
      );
      this.bundle.set(data);
      this.source.set('api');
      this.syncDefaultSelectedRow(data);
    } catch {
      const fallback = generatePreviewData({
        ...request,
        contentSlice: this.contentSlice(),
      });
      this.bundle.set(fallback);
      this.source.set('default');
      this.syncDefaultSelectedRow(fallback);
    } finally {
      this.loading.set(false);
    }
  }

  previewRowPreviewForNode(nodeId: string): string {
    const slice = this.sliceForNode(nodeId);
    const rows = slice?.tableRows ?? this.bundle().tableRows;
    return formatPreviewRowNames(rows);
  }

  selectTableRow(row: PreviewRow): void {
    this.selectedTableRow.set(row);
  }

  selectNewsRow(row: PreviewNewsRow): void {
    this.selectedNewsRow.set(row);
  }

  selectTimePreset(preset: string): void {
    this.selectedTimePreset.set(preset);
  }

  readFieldValue(nodeId: string, key = 'value'): string {
    return this.fieldValues()[this.fieldKey(nodeId, key)] ?? '';
  }

  hasFieldValue(nodeId: string, key = 'value'): boolean {
    return this.fieldKey(nodeId, key) in this.fieldValues();
  }

  setFieldValue(nodeId: string, value: string, key = 'value'): void {
    const fieldKey = this.fieldKey(nodeId, key);
    this.fieldValues.update((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  }

  private fieldKey(nodeId: string, key: string): string {
    return key === 'value' ? nodeId : `${nodeId}:${key}`;
  }

  sliceForNode(nodeId: string): NodePreviewSlice | undefined {
    return this.bundle().nodes[nodeId];
  }

  /** Replace table rows for one node after a successful live probe. */
  applyProbedTableRows(nodeId: string, sampleRows: Record<string, unknown>[]): void {
    const tableRows = sampleRows.map((row, index) => mapProbeRow(row, index));
    this.bundle.update((current) => ({
      ...current,
      tableRows,
      nodes: {
        ...current.nodes,
        [nodeId]: {
          ...(current.nodes[nodeId] ?? {}),
          tableRows,
          linkedToData: true,
        },
      },
    }));
    if (tableRows[0]) {
      this.selectedTableRow.set(tableRows[0]);
    }
  }

  private syncDefaultSelectedRow(bundle: PreviewDataBundle): void {
    const detailSlice = Object.values(bundle.nodes).find(
      (slice) => slice.linkedToTable && slice.selectedRow,
    );
    this.selectedTableRow.set(detailSlice?.selectedRow ?? bundle.tableRows[0] ?? null);

    const articleSlice = Object.values(bundle.nodes).find(
      (slice) => slice.linkedToTable && slice.selectedNewsRow,
    );
    this.selectedNewsRow.set(articleSlice?.selectedNewsRow ?? bundle.newsRows[0] ?? null);
  }
}

function mapProbeRow(row: Record<string, unknown>, index: number): PreviewRow {
  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return row[key];
      }
    }
    return undefined;
  };

  const amountRaw = pick('amount', 'Amount', 'total', 'value');
  const amount =
    typeof amountRaw === 'number'
      ? amountRaw
      : typeof amountRaw === 'string'
        ? Number(amountRaw.replace(/[^0-9.-]/g, '')) || 0
        : 0;

  return {
    id: String(pick('id', 'ID', 'uuid') ?? `row-${index + 1}`),
    name: String(pick('name', 'Name', 'title', 'label') ?? `Row ${index + 1}`),
    status: String(pick('status', 'Status', 'state') ?? '—'),
    amount,
    date: String(pick('date', 'Date', 'created_at', 'updated_at') ?? '—'),
  };
}
