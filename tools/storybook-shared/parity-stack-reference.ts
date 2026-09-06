/**
 * Storybook copy for the local backend parity stack (DAS-185 / DAS-186).
 *
 * Keep ports and env keys in sync with tools/backend-parity/seed-model.mjs
 * and docker/seed/connection.env.
 */

export const PARITY_STACK_GUIDE = 'docs/44-backend-parity-stack.md';

export const PARITY_DB_CONTAINERS = [
  {
    label: 'PostgreSQL',
    hostPort: 55432,
    envKey: 'DATABASE_URL',
    example:
      'postgresql://rosettadash:rosettadash@127.0.0.1:55432/rosettadash',
  },
  {
    label: 'MySQL',
    hostPort: 53306,
    envKey: 'MYSQL_URL',
    example: 'mysql://rosettadash:rosettadash@127.0.0.1:53306/rosettadash',
  },
  {
    label: 'MongoDB',
    hostPort: 57017,
    envKey: 'MONGODB_URI',
    example:
      'mongodb://rosettadash:rosettadash@127.0.0.1:57017/rosettadash?authSource=admin',
  },
  {
    label: 'Supabase (local gateway)',
    hostPort: 54321,
    envKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const,
    exampleUrl: 'http://127.0.0.1:54321',
  },
] as const;

export const PARITY_SERVER_CONTAINERS = [
  { label: 'NestJS', hostPort: 53101 },
  { label: 'Express', hostPort: 53102 },
  { label: 'Next.js', hostPort: 53103 },
  { label: 'Nuxt', hostPort: 53104 },
] as const;

export const PARITY_STACK_COMMANDS = [
  'npm run parity:db:up',
  'npm run start:server',
  'npm run parity:generate',
  'npm run parity:servers:up',
] as const;

/** Short blurb for palette group guides and catalog assumptions. */
export function parityStackGuideParagraph(): string {
  const dbLines = PARITY_DB_CONTAINERS.map((entry) => {
    if ('envKeys' in entry) {
      return `${entry.label} (:${entry.hostPort}) — ${entry.envKeys.join(', ')}`;
    }
    return `${entry.label} (:${entry.hostPort}) — ${entry.envKey}`;
  }).join('; ');

  const serverPorts = PARITY_SERVER_CONTAINERS.map(
    (entry) => `${entry.label} :${entry.hostPort}`,
  ).join(', ');

  return (
    `Local parity stack (${PARITY_STACK_GUIDE}): ${dbLines}. ` +
    `Generated server containers map to host ${serverPorts} (internal :8080). ` +
    `Start with ${PARITY_STACK_COMMANDS.slice(0, 2).join(' then ')}; ` +
    `connection strings live in docker/seed/connection.env.`
  );
}
