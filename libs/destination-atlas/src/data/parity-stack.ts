/**
 * Live backend parity stack helpers for Destination Atlas Stack tab (DAS-187).
 *
 * Ports stay in sync with tools/backend-parity/seed-model.mjs and
 * docker/seed/connection.env.
 */

export type ParityRuntimeId =
  | 'web-components'
  | 'react'
  | 'angular'
  | 'vue'
  | 'svelte';

export const PARITY_ORDERS_TABLE = 'orders';

export const PARITY_SERVER_PORTS = {
  nest: 53101,
  express: 53102,
  next: 53103,
  nuxt: 53104,
} as const;

export type ParityServerId = keyof typeof PARITY_SERVER_PORTS;

/** Idiomatic server pairing per front-end runtime (docs/29, parity-composites.mjs). */
export const PARITY_RUNTIME_SERVER: Record<ParityRuntimeId, ParityServerId> = {
  react: 'next',
  angular: 'nest',
  vue: 'nuxt',
  svelte: 'express',
  'web-components': 'express',
};

export interface ParityOrderRow {
  id: string;
  name: string;
  status?: string;
  amount?: string | number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface ParityOrdersResult {
  rows: ParityOrderRow[];
  source: 'live' | 'offline';
  apiUrl: string;
  error?: string;
}

export const PARITY_STACK_SETUP_COMMANDS = [
  'npm run parity:stack:proof:react',
] as const;

export function parityStackSetupHint(): string {
  return `Start the local parity stack (${PARITY_STACK_SETUP_COMMANDS[0]} or parity:stack:proof:angular). See docs/44-backend-parity-stack.md.`;
}

function readViteParityApiUrl(): string | undefined {
  if (typeof import.meta === 'undefined') {
    return undefined;
  }
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  const value = env?.VITE_PARITY_API_URL?.trim();
  return value || undefined;
}

/** Base URL for parity API calls — prefers Vite env, then dev proxy, then localhost. */
export function parityApiBaseUrl(runtime: ParityRuntimeId = 'react'): string {
  const override = readViteParityApiUrl();
  if (override) {
    return override.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return '/parity-api';
  }

  const serverId = PARITY_RUNTIME_SERVER[runtime];
  return `http://127.0.0.1:${PARITY_SERVER_PORTS[serverId]}/api`;
}

export function parityOrdersEndpoint(runtime: ParityRuntimeId = 'react'): string {
  return `${parityApiBaseUrl(runtime)}/${PARITY_ORDERS_TABLE}`;
}

export function parityServerLabel(runtime: ParityRuntimeId): string {
  const id = PARITY_RUNTIME_SERVER[runtime];
  const labels: Record<ParityServerId, string> = {
    nest: 'NestJS',
    express: 'Express',
    next: 'Next.js',
    nuxt: 'Nuxt',
  };
  return labels[id];
}

export function parityServerPort(runtime: ParityRuntimeId): number {
  return PARITY_SERVER_PORTS[PARITY_RUNTIME_SERVER[runtime]];
}

/** Fetch seeded `orders` rows from the idiomatic parity server for this runtime. */
export async function fetchParityOrders(
  runtime: ParityRuntimeId = 'react',
): Promise<ParityOrdersResult> {
  const apiUrl = parityOrdersEndpoint(runtime);

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      throw new Error('Expected a JSON array');
    }
    return {
      rows: body as ParityOrderRow[],
      source: 'live',
      apiUrl,
    };
  } catch (error) {
    return {
      rows: [],
      source: 'offline',
      apiUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
