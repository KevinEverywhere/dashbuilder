/**
 * Storybook mount for a live full-stack orders demo (DAS-187).
 *
 * Infra nodes show export-wizard context; the table loads seeded rows from
 * the local parity server via the Storybook Vite `/parity-api` proxy.
 */

import { defaultComponentRegistry } from '@rosettadash/core';

import type { ParityRuntimeId } from '../../libs/destination-atlas/src/data/parity-stack.ts';
import {
  fetchParityOrders,
  parityOrdersEndpoint,
  parityServerLabel,
  parityServerPort,
  PARITY_ORDERS_TABLE,
} from '../../libs/destination-atlas/src/data/parity-stack.ts';
import { renderPaletteDemo } from './palette-catalog/palette-demos.js';
import {
  PARITY_STACK_COMMANDS,
  PARITY_STACK_GUIDE,
  PARITY_SERVER_CONTAINERS,
} from './parity-stack-reference.ts';

export interface FullStackOrdersDemoOptions {
  runtime?: ParityRuntimeId;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInfra(type: string, overrides: Record<string, unknown> = {}): string {
  const definition = defaultComponentRegistry.get(type);
  if (!definition) {
    return `<div class="preview-fallback"><code>${esc(type)}</code></div>`;
  }
  return renderPaletteDemo(type, definition, overrides);
}

function formatCell(value: unknown): string {
  if (value === undefined || value === null) {
    return '—';
  }
  return esc(String(value));
}

function renderOrderRows(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return `<tr><td colspan="4" class="rd-full-stack-orders__empty">No rows yet.</td></tr>`;
  }
  return rows
    .map(
      (row) =>
        `<tr><td>${formatCell(row.name)}</td><td>${formatCell(row.status)}</td>` +
        `<td class="preview-table__numeric">${formatCell(row.amount)}</td>` +
        `<td>${formatCell(row.date)}</td></tr>`,
    )
    .join('');
}

export function mountFullStackOrdersDemo(
  options: FullStackOrdersDemoOptions = {},
): HTMLElement {
  const runtime = options.runtime ?? 'react';
  const liveServer = parityServerLabel(runtime);
  const livePort = parityServerPort(runtime);
  const endpoint = parityOrdersEndpoint(runtime);
  const serverInfraType =
    runtime === 'angular' ? 'infra.server.nest' : 'infra.server.next';

  const root = document.createElement('div');
  root.className = 'rd-full-stack-orders';

  root.innerHTML = `
    <header class="rd-full-stack-orders__header">
      <h2 class="rd-full-stack-orders__title">Full-stack orders (live API)</h2>
      <p class="rd-full-stack-orders__summary">
        UI → generated ${esc(liveServer)} server (:${livePort}) → seeded PostgreSQL
        <code>${esc(PARITY_ORDERS_TABLE)}</code> table. Requires the local parity stack
        (${esc(PARITY_STACK_GUIDE)}).
      </p>
      <p class="rd-full-stack-orders__meta">
        Fetch target: <code>${esc(endpoint)}</code>
        (Storybook dev proxy maps <code>/parity-api</code> → host :${livePort}).
      </p>
    </header>
    <section class="rd-full-stack-orders__infra">
      <h3 class="rd-full-stack-orders__section-title">Export wizard context</h3>
      <div class="rd-full-stack-orders__infra-grid">
        ${renderInfra('infra.env', { envKeys: 'DATABASE_URL, API_KEY' })}
        ${renderInfra('infra.postgresql', {
          tableName: PARITY_ORDERS_TABLE,
          label: 'PostgreSQL (parity seed)',
        })}
        ${renderInfra(serverInfraType, {
          globalPrefix: 'api',
          label: `${liveServer} — live`,
        })}
      </div>
    </section>
    <section class="rd-full-stack-orders__table">
      <h3 class="rd-full-stack-orders__section-title">Live data table</h3>
      <p class="rd-full-stack-orders__status" data-full-stack-status>Loading orders…</p>
      <div class="preview-table" data-full-stack-table>
        <div class="preview-table__header">
          <span>Orders</span>
          <span class="preview-chip">GET /api/${esc(PARITY_ORDERS_TABLE)}</span>
        </div>
        <table>
          <thead>
            <tr><th>Name</th><th>Status</th><th class="preview-table__numeric">Amount</th><th>Date</th></tr>
          </thead>
          <tbody data-full-stack-rows>
            <tr><td colspan="4" class="rd-full-stack-orders__empty">…</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <aside class="rd-full-stack-orders__setup">
      <h3 class="rd-full-stack-orders__section-title">When the table is empty</h3>
      <ol class="rd-full-stack-orders__commands">
        ${PARITY_STACK_COMMANDS.map((command) => `<li><code>${esc(command)}</code></li>`).join('')}
      </ol>
      <p class="rd-full-stack-orders__servers">
        Server containers:
        ${PARITY_SERVER_CONTAINERS.map((entry) => `${esc(entry.label)} :${entry.hostPort}`).join(' · ')}.
      </p>
    </aside>
  `;

  const statusEl = root.querySelector<HTMLElement>('[data-full-stack-status]');
  const rowsEl = root.querySelector<HTMLElement>('[data-full-stack-rows]');

  void fetchParityOrders(runtime).then((result) => {
    if (!statusEl || !rowsEl) {
      return;
    }

    if (result.source === 'live') {
      statusEl.className = 'rd-full-stack-orders__status rd-full-stack-orders__status--live';
      statusEl.textContent = `Live — ${result.rows.length} seeded row(s) from ${result.apiUrl}`;
      rowsEl.innerHTML = renderOrderRows(result.rows);
      return;
    }

    statusEl.className = 'rd-full-stack-orders__status rd-full-stack-orders__status--offline';
    statusEl.textContent =
      `Offline — could not reach ${result.apiUrl}` +
      (result.error ? ` (${result.error}).` : '.') +
      ` Run ${PARITY_STACK_COMMANDS.join(' then ')}.`;
    rowsEl.innerHTML = renderOrderRows([]);
  });

  return root;
}
