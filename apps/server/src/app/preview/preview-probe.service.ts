export interface DataSourceProbeRequest {
  sourceType: string;
  connectionUrl: string;
  table?: string;
  collection?: string;
  anonKey?: string;
  /** Opt-in probe credentials — not stored server-side. */
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

export interface DataSourceProbeResult {
  ok: boolean;
  message: string;
  rowCount?: number;
  sampleRows?: Record<string, unknown>[];
}

const DEFAULT_LIMIT = 5;

export async function probeDataSource(
  request: DataSourceProbeRequest,
): Promise<DataSourceProbeResult> {
  const limit = Math.min(Math.max(request.limit ?? DEFAULT_LIMIT, 1), 25);

  if (!request.connectionUrl?.trim()) {
    return { ok: false, message: 'Connection URL is required.' };
  }

  switch (request.sourceType) {
    case 'infra.postgresql':
      return probePostgres(request, limit);
    case 'infra.mysql':
      return { ok: false, message: 'MySQL live probe is not implemented yet — wiring structure was checked.' };
    case 'infra.mongodb':
      return { ok: false, message: 'MongoDB live probe is not implemented yet — wiring structure was checked.' };
    case 'infra.supabase':
      return probeSupabase(request, limit);
    default:
      return { ok: false, message: `Unsupported source type "${request.sourceType}".` };
  }
}

async function probePostgres(
  request: DataSourceProbeRequest,
  limit: number,
): Promise<DataSourceProbeResult> {
  const table = request.table?.trim();
  if (!table) {
    return { ok: false, message: 'Table name is required for PostgreSQL probe.' };
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    return { ok: false, message: 'Table name contains invalid characters.' };
  }

  let pg: typeof import('pg');
  try {
    pg = await import('pg');
  } catch {
    return {
      ok: false,
      message: 'PostgreSQL driver (pg) is not installed on the builder server.',
    };
  }

  const client = new pg.Client({
    connectionString: request.connectionUrl.trim(),
    ...(request.username?.trim() ? { user: request.username.trim() } : {}),
    ...(request.password !== undefined ? { password: request.password } : {}),
    connectionTimeoutMillis: 8_000,
  });

  try {
    await client.connect();
    const result = await client.query(`SELECT * FROM ${table} LIMIT $1`, [limit]);
    const sampleRows = result.rows as Record<string, unknown>[];
    return {
      ok: true,
      message: `Connected and read ${sampleRows.length} row(s) from "${table}".`,
      rowCount: sampleRows.length,
      sampleRows,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PostgreSQL connection failed.';
    return { ok: false, message };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function probeSupabase(
  request: DataSourceProbeRequest,
  limit: number,
): Promise<DataSourceProbeResult> {
  const table = request.table?.trim();
  const baseUrl = request.connectionUrl.trim().replace(/\/+$/, '');
  const anonKey = request.anonKey?.trim();

  if (!table) {
    return { ok: false, message: 'Table name is required for Supabase probe.' };
  }
  if (!anonKey) {
    return { ok: false, message: 'Supabase anon key is required for REST probe.' };
  }

  const url = `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=*&limit=${limit}`;
  try {
    const response = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        message: `Supabase REST ${response.status}: ${body.slice(0, 200)}`,
      };
    }
    const sampleRows = (await response.json()) as Record<string, unknown>[];
    return {
      ok: true,
      message: `Supabase returned ${sampleRows.length} row(s) from "${table}".`,
      rowCount: sampleRows.length,
      sampleRows,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase request failed.';
    return { ok: false, message };
  }
}
