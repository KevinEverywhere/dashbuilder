/**
 * Asserts every promised database container really holds the seeded rows and
 * base users, using the same driver the matching exporter generates.
 *
 *   npm run parity:check:db
 *   node tools/backend-parity/check-databases.mjs --only postgres,mysql
 *
 * Exits non-zero on the first unmet promise so CI fails loudly rather than
 * letting a documentation claim drift back into being an assertion.
 */

import {
  PARITY_CONNECTIONS,
  SEED_PEOPLE,
  SEED_SCOPE,
  SUPABASE_ANON_KEY,
  buildSeedTables,
} from './seed-model.mjs';

const onlyArgIndex = process.argv.indexOf('--only');
const only =
  onlyArgIndex >= 0 ? process.argv[onlyArgIndex + 1].split(',').map((s) => s.trim()) : null;

const tables = buildSeedTables();
const expectedCounts = Object.fromEntries(tables.map((t) => [t.name, t.rows.length]));
const expectedEmails = SEED_PEOPLE.map((person) => person.email).sort();
const expectedRoles = [...new Set(SEED_PEOPLE.map((person) => person.roleId))].sort();

const PG_URL = process.env.PARITY_DATABASE_URL ?? PARITY_CONNECTIONS.postgres;
const MYSQL_URL = process.env.PARITY_MYSQL_URL ?? PARITY_CONNECTIONS.mysql;
const MONGO_URI = process.env.PARITY_MONGODB_URI ?? PARITY_CONNECTIONS.mongo;
const SUPABASE_URL = process.env.PARITY_SUPABASE_URL ?? PARITY_CONNECTIONS.supabase;

const failures = [];
const results = [];

function record(promise, checks) {
  const failed = checks.filter((check) => !check.ok);
  results.push({ promise, checks });
  for (const check of failed) {
    failures.push(`${promise}: ${check.detail}`);
  }
}

function expect(ok, detail) {
  return { ok, detail };
}

/** Every table must exist with exactly the seeded row count. */
function tableCountChecks(actualCounts) {
  return Object.entries(expectedCounts).map(([table, expected]) => {
    const actual = actualCounts[table];
    return expect(
      actual === expected,
      `table "${table}" has ${actual ?? 'no'} row(s), expected ${expected}`,
    );
  });
}

/** Base users must be present with the documented roles. */
function baseUserChecks(emails, roles) {
  return [
    expect(
      JSON.stringify(emails.sort()) === JSON.stringify(expectedEmails),
      `base users are ${JSON.stringify(emails)}, expected ${JSON.stringify(expectedEmails)}`,
    ),
    expect(
      expectedRoles.every((role) => roles.includes(role)),
      `base user roles are ${JSON.stringify(roles)}, expected all of ${JSON.stringify(expectedRoles)}`,
    ),
  ];
}

/**
 * Scoped exports filter on client_id/project_id/created_at, so a table that
 * lacks those columns silently returns nothing from generated code.
 */
function scopeChecks(scopedOrderCount) {
  return [
    expect(
      scopedOrderCount === expectedCounts.orders,
      `scoped query on client_id/project_id returned ${scopedOrderCount} order(s), ` +
        `expected ${expectedCounts.orders} — generated scoped exports would read empty`,
    ),
  ];
}

// ---------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------

async function checkPostgres(url, promiseLabel) {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 8000 });
  await client.connect();
  try {
    const counts = {};
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*)::int AS count FROM "${table.name}"`);
      counts[table.name] = result.rows[0].count;
    }

    const people = await client.query('SELECT email, role_id FROM people ORDER BY email');
    const scoped = await client.query(
      'SELECT COUNT(*)::int AS count FROM orders WHERE client_id = $1 AND project_id = $2',
      [SEED_SCOPE.clientId, SEED_SCOPE.projectId],
    );

    record(promiseLabel, [
      ...tableCountChecks(counts),
      ...baseUserChecks(
        people.rows.map((row) => row.email),
        people.rows.map((row) => row.role_id),
      ),
      ...scopeChecks(scoped.rows[0].count),
    ]);
  } finally {
    await client.end().catch(() => undefined);
  }
}

// ---------------------------------------------------------------------------
// MySQL
// ---------------------------------------------------------------------------

async function checkMysql() {
  const mysql = await import('mysql2/promise');
  const connection = await mysql.createConnection(MYSQL_URL);
  try {
    const counts = {};
    for (const table of tables) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) AS count FROM \`${table.name}\``,
      );
      counts[table.name] = Number(rows[0].count);
    }

    const [people] = await connection.query('SELECT email, role_id FROM people ORDER BY email');
    const [scoped] = await connection.query(
      'SELECT COUNT(*) AS count FROM orders WHERE client_id = ? AND project_id = ?',
      [SEED_SCOPE.clientId, SEED_SCOPE.projectId],
    );

    record('MySQL', [
      ...tableCountChecks(counts),
      ...baseUserChecks(
        people.map((row) => row.email),
        people.map((row) => row.role_id),
      ),
      ...scopeChecks(Number(scoped[0].count)),
    ]);
  } finally {
    await connection.end().catch(() => undefined);
  }
}

// ---------------------------------------------------------------------------
// MongoDB
// ---------------------------------------------------------------------------

async function checkMongo() {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  try {
    const db = client.db('rosettadash');
    const counts = {};
    for (const table of tables) {
      counts[table.name] = await db.collection(table.collection).countDocuments();
    }

    const people = await db
      .collection('people')
      .find({}, { projection: { email: 1, role_id: 1 } })
      .sort({ email: 1 })
      .toArray();
    const scoped = await db
      .collection('orders')
      .countDocuments({ client_id: SEED_SCOPE.clientId, project_id: SEED_SCOPE.projectId });

    record('MongoDB', [
      ...tableCountChecks(counts),
      ...baseUserChecks(
        people.map((doc) => doc.email),
        people.map((doc) => doc.role_id),
      ),
      ...scopeChecks(scoped),
    ]);
  } finally {
    await client.close().catch(() => undefined);
  }
}

// ---------------------------------------------------------------------------
// Supabase (PostgREST over the seeded Postgres, through the /rest/v1 gateway)
// ---------------------------------------------------------------------------

async function checkSupabase() {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  async function select(table, query = 'select=*') {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
    if (!response.ok) {
      throw new Error(
        `GET /rest/v1/${table} responded ${response.status}: ${(await response.text()).slice(0, 200)}`,
      );
    }
    return response.json();
  }

  const counts = {};
  for (const table of tables) {
    counts[table.name] = (await select(table.name)).length;
  }

  const people = await select('people', 'select=email,role_id&order=email');
  const scoped = await select(
    'orders',
    `select=id&client_id=eq.${SEED_SCOPE.clientId}&project_id=eq.${SEED_SCOPE.projectId}`,
  );

  record('Supabase', [
    ...tableCountChecks(counts),
    ...baseUserChecks(
      people.map((row) => row.email),
      people.map((row) => row.role_id),
    ),
    ...scopeChecks(scoped.length),
  ]);
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

const suites = [
  { id: 'postgres', label: 'PostgreSQL', run: () => checkPostgres(PG_URL, 'PostgreSQL') },
  { id: 'mysql', label: 'MySQL', run: checkMysql },
  { id: 'mongo', label: 'MongoDB', run: checkMongo },
  { id: 'supabase', label: 'Supabase', run: checkSupabase },
];

const selected = only ? suites.filter((suite) => only.includes(suite.id)) : suites;

console.log('RosettaDash backend parity — database promises\n');

for (const suite of selected) {
  try {
    await suite.run();
  } catch (error) {
    record(suite.label, [
      expect(false, `could not verify the promise — ${error.message}`),
    ]);
  }
}

for (const result of results) {
  const failed = result.checks.filter((check) => !check.ok);
  const mark = failed.length === 0 ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${result.promise} (${result.checks.length} check(s))`);
  for (const check of failed) {
    console.log(`         ${check.detail}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} unmet database promise(s):\n`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  console.error(
    '\nBring the containers up first:  npm run parity:db:up\n' +
      'If seeds changed, recreate them: npm run parity:db:reset',
  );
  process.exit(1);
}

console.log(
  `\nAll ${selected.length} database promise(s) hold: seeded rows, base users, and scope columns.`,
);
