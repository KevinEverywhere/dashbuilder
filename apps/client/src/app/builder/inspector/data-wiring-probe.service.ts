import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { DataWiringReport } from '@rosettadash/core';
import { firstValueFrom } from 'rxjs';

export interface DataSourceProbeRequest {
  sourceType: string;
  connectionUrl: string;
  table?: string;
  collection?: string;
  anonKey?: string;
  username?: string;
  password?: string;
  limit?: number;
}

export interface DataSourceProbeResponse {
  ok: boolean;
  message: string;
  rowCount?: number;
  sampleRows?: Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class DataWiringProbeService {
  private readonly http = inject(HttpClient);

  probe(request: DataSourceProbeRequest): Promise<DataSourceProbeResponse> {
    return firstValueFrom(
      this.http.post<DataSourceProbeResponse>('/api/preview/probe-source', request),
    );
  }

  buildProbeRequest(
    report: DataWiringReport,
    connectionUrl: string,
    anonKey: string,
    options?: { username?: string; password?: string },
  ): DataSourceProbeRequest | null {
    if (!report.sourceNodeType) {
      return null;
    }
    return {
      sourceType: report.sourceNodeType,
      connectionUrl: connectionUrl.trim(),
      table: report.tableName,
      collection: report.collectionName,
      anonKey: anonKey.trim() || undefined,
      username: options?.username?.trim() || undefined,
      password: options?.password,
      limit: 5,
    };
  }
}
