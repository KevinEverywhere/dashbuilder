import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  NodePreviewSlice,
  PreviewDataBundle,
  PreviewDataRequest,
  PreviewNewsRow,
  PreviewRow,
  getDefaultPreviewData,
} from '@rosettadash/ui-primitives';
import { firstValueFrom } from 'rxjs';

export type PreviewDataSource = 'default' | 'api';

@Injectable({ providedIn: 'root' })
export class PreviewDataService {
  private readonly http = inject(HttpClient);

  readonly bundle = signal<PreviewDataBundle>(getDefaultPreviewData());
  readonly loading = signal(false);
  readonly source = signal<PreviewDataSource>('default');
  readonly selectedTableRow = signal<PreviewRow | null>(null);
  readonly selectedNewsRow = signal<PreviewNewsRow | null>(null);
  readonly selectedTimePreset = signal<string | null>(null);
  /** Ephemeral preview-only values for interactive form fields (not persisted to composite). */
  readonly fieldValues = signal<Record<string, string>>({});

  readonly nodeSlices = computed(() => this.bundle().nodes);

  async load(request: PreviewDataRequest): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.post<PreviewDataBundle>('/api/preview/data', request),
      );
      this.bundle.set(data);
      this.source.set('api');
      this.syncDefaultSelectedRow(data);
    } catch {
      const fallback = getDefaultPreviewData();
      this.bundle.set(fallback);
      this.source.set('default');
      this.syncDefaultSelectedRow(fallback);
    } finally {
      this.loading.set(false);
    }
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
