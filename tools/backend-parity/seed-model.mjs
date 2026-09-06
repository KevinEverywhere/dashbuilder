/**
 * Canonical seed model for the RosettaDash backend parity stack.
 *
 * Every database container is seeded from this one module so that a row in
 * Postgres, MySQL, MongoDB, and Supabase is the same row, and so that the
 * builder's design-time preview data and the container's runtime data can
 * never drift apart.
 *
 * Row data for `orders` and `news_articles` is read out of
 * packages/ui-primitives/preview-content.json — the same file the builder
 * serves as preview content. Editing that file reseeds the containers.
 */

import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const workspaceRoot = join(here, '..', '..');

const previewContentPath = join(
  workspaceRoot,
  'packages',
  'ui-primitives',
  'preview-content.json',
);

/**
 * Scope values the generated export code filters on when a composite carries a
 * domain scope. `packages/core/src/lib/domain/query-scope.ts` hard-codes the
 * column names `client_id`, `project_id`, and `created_at`, so every seeded
 * table carries all three or scoped exports return nothing.
 */
export const SEED_SCOPE = {
  clientId: 'client-northwind',
  projectId: 'project-revenue',
  createdAt: '2026-08-01T00:00:00Z',
};

/** Dev-only password shared by every base user. Never used outside Docker. */
export const BASE_USER_PASSWORD = 'rosettadash-dev';

/** Container credentials. Local dev fixtures — never reuse them anywhere real. */
export const DB_NAME = 'rosettadash';
export const DB_USER = 'rosettadash';
export const DB_PASSWORD = 'rosettadash';

/** Host ports, offset well clear of default installs. */
export const PARITY_PORTS = {
  postgres: 55432,
  mysql: 53306,
  mongo: 57017,
  supabase: 54321,
  serverNest: 53101,
  serverExpress: 53102,
  serverNext: 53103,
  serverNuxt: 53104,
};

/**
 * Listen port inside parity server containers. Deliberately not 3000 — that
 * port belongs to the RosettaDash builder API on the host.
 */
export const PARITY_SERVER_CONTAINER_PORT = 8080;

/** PostgREST listen port inside the local Supabase parity stack (Docker network only). */
export const PARITY_POSTGREST_PORT = 3000;

/** Dev-only PostgREST signing secret. PostgREST requires at least 32 chars. */
export const SUPABASE_JWT_SECRET = 'rosettadash-local-parity-jwt-secret-key';
export const SUPABASE_ANON_ROLE = 'web_anon';

/**
 * The HS256 JWT that PostgREST accepts as a Supabase-style anon key. Derived
 * rather than hard-coded so it stays in step with the secret above, and
 * deterministic so it can be committed and documented.
 */
export const SUPABASE_ANON_KEY = (() => {
  const encode = (value) => Buffer.from(value).toString('base64url');
  const header = encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encode(
    JSON.stringify({
      role: SUPABASE_ANON_ROLE,
      iss: 'rosettadash-local-parity',
      // Fixed far-future expiry keeps the key stable across regenerations.
      exp: 4102444800,
    }),
  );
  const signature = createHmac('sha256', SUPABASE_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
})();

/**
 * Connection strings for the parity containers, as seen from the host.
 *
 * These use 127.0.0.1 rather than localhost on purpose. Docker publishes the
 * ports on IPv4, but Node's fetch resolves localhost to ::1 first, so an HTTP
 * check against localhost fails before it ever reaches the container.
 */
export const PARITY_CONNECTIONS = {
  postgres: `postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${PARITY_PORTS.postgres}/${DB_NAME}`,
  mysql: `mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${PARITY_PORTS.mysql}/${DB_NAME}`,
  mongo: `mongodb://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${PARITY_PORTS.mongo}/${DB_NAME}?authSource=admin`,
  supabase: `http://127.0.0.1:${PARITY_PORTS.supabase}`,
};

/**
 * Builder export API used by parity:generate and parity:check:promises.
 * The builder stays on :3000; override only when yours is elsewhere.
 */
export const BUILDER_API_BASE =
  process.env.PARITY_BUILDER_API ?? 'http://127.0.0.1:3000/api';

/**
 * Roles as documented in docs/05-domain-model.md. Seeded as rows so that role
 * gates and the generated `x-rosettadash-role` guards have something real to
 * resolve against.
 */
export const SEED_ROLES = [
  { id: 'viewer', label: 'Viewer', permissions: 'read:dashboard,export:report' },
  { id: 'editor', label: 'Editor', permissions: 'read:dashboard,write:data,use:forms' },
  { id: 'admin', label: 'Admin', permissions: 'manage:people,manage:roles,manage:settings' },
  { id: 'owner', label: 'Owner', permissions: 'all' },
];

/**
 * Base users. Two per privileged role so tests can prove a role filter
 * actually filters rather than coincidentally returning the only row.
 */
export const SEED_PEOPLE = [
  { id: 'person-owner', email: 'owner@rosettadash.test', displayName: 'Ada Owner', roleId: 'owner' },
  { id: 'person-admin', email: 'admin@rosettadash.test', displayName: 'Bo Admin', roleId: 'admin' },
  { id: 'person-editor', email: 'editor@rosettadash.test', displayName: 'Cy Editor', roleId: 'editor' },
  { id: 'person-editor-2', email: 'editor2@rosettadash.test', displayName: 'Di Editor', roleId: 'editor' },
  { id: 'person-viewer', email: 'viewer@rosettadash.test', displayName: 'El Viewer', roleId: 'viewer' },
  { id: 'person-viewer-2', email: 'viewer2@rosettadash.test', displayName: 'Fi Viewer', roleId: 'viewer' },
];

/** Deterministic stand-in for a password hash. Not a real KDF — dev fixture only. */
export function seedPasswordHash(email) {
  return createHash('sha256').update(`${email}:${BASE_USER_PASSWORD}`).digest('hex');
}

function readPreviewContent() {
  return JSON.parse(readFileSync(previewContentPath, 'utf-8'));
}

const SCOPE_COLUMNS = [
  { key: 'client_id', type: 'text' },
  { key: 'project_id', type: 'text' },
  { key: 'created_at', type: 'timestamp' },
];

function withScope(row) {
  return {
    ...row,
    client_id: SEED_SCOPE.clientId,
    project_id: SEED_SCOPE.projectId,
    created_at: SEED_SCOPE.createdAt,
  };
}

/**
 * Builds the full table set. Returns plain data so each engine generator can
 * render it in its own dialect.
 */
export function buildSeedTables() {
  const preview = readPreviewContent();
  const orders = preview.datasets?.orders?.rows ?? [];
  const news = preview.datasets?.news?.rows ?? [];

  if (orders.length === 0 || news.length === 0) {
    throw new Error(
      `preview-content.json has no orders/news rows to seed (${previewContentPath})`,
    );
  }

  return [
    {
      name: 'roles',
      collection: 'roles',
      primaryKey: 'id',
      columns: [
        { key: 'id', type: 'text' },
        { key: 'label', type: 'text' },
        { key: 'permissions', type: 'text' },
        ...SCOPE_COLUMNS,
      ],
      rows: SEED_ROLES.map((role) =>
        withScope({ id: role.id, label: role.label, permissions: role.permissions }),
      ),
    },
    {
      name: 'people',
      collection: 'people',
      primaryKey: 'id',
      columns: [
        { key: 'id', type: 'text' },
        { key: 'email', type: 'text' },
        { key: 'display_name', type: 'text' },
        { key: 'role_id', type: 'text' },
        { key: 'password_hash', type: 'text' },
        ...SCOPE_COLUMNS,
      ],
      rows: SEED_PEOPLE.map((person) =>
        withScope({
          id: person.id,
          email: person.email,
          display_name: person.displayName,
          role_id: person.roleId,
          password_hash: seedPasswordHash(person.email),
        }),
      ),
    },
    {
      name: 'orders',
      collection: 'orders',
      primaryKey: 'id',
      source: 'preview-content.json → datasets.orders',
      columns: [
        { key: 'id', type: 'text' },
        { key: 'name', type: 'text' },
        { key: 'status', type: 'text' },
        { key: 'amount', type: 'int' },
        { key: 'date', type: 'date' },
        ...SCOPE_COLUMNS,
      ],
      rows: orders.map((row) =>
        withScope({
          id: String(row.id),
          name: row.name,
          status: row.status,
          amount: row.amount,
          date: row.date,
        }),
      ),
    },
    {
      name: 'news_articles',
      collection: 'news_articles',
      primaryKey: 'id',
      source: 'preview-content.json → datasets.news',
      columns: [
        { key: 'id', type: 'text' },
        { key: 'headline', type: 'text' },
        { key: 'source', type: 'text' },
        { key: 'region', type: 'text' },
        { key: 'published_at', type: 'date' },
        { key: 'summary', type: 'text' },
        { key: 'url', type: 'text' },
        ...SCOPE_COLUMNS,
      ],
      rows: news.map((row) =>
        withScope({
          id: String(row.id),
          headline: row.headline,
          source: row.source,
          region: row.region,
          published_at: row.publishedAt,
          summary: row.summary,
          url: row.url,
        }),
      ),
    },
  ];
}

/** Expected row counts, used by the parity checks to assert seeding worked. */
export function expectedRowCounts() {
  return Object.fromEntries(buildSeedTables().map((table) => [table.name, table.rows.length]));
}
