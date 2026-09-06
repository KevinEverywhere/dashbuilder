import type { ExportIR, ServerDatabaseSource } from '@rosettadash/core';
import {
  generateScopeModuleSource,
  generateServerDatabaseModuleSource,
  hasQueryScope,
  resolveExportQueryScope,
  resolveServerDatabaseSource,
} from '@rosettadash/core';
import type { GeneratedFile, NextExportOptions, RouteResource } from './types';
import { NextExportError } from './types';
import {
  generateEnvExample,
  joinLines,
  resolveGlobalPrefix,
  resolveRouteResources,
  routeAppPath,
  routeImportPath,
} from './utils';

export function generateNextInfraFiles(
  ir: ExportIR,
  options: NextExportOptions = {},
): GeneratedFile[] {
  if (ir.targets.server !== 'next') {
    throw new NextExportError(`Next exporter cannot generate server target "${ir.targets.server}"`);
  }

  const database = resolveServerDatabaseSource(ir);
  if (!database) {
    throw new NextExportError(
      'Next infra export requires at least one database data source ' +
        '(PostgreSQL, MySQL, MongoDB, or Supabase)',
    );
  }

  const root = options.rootDir ?? 'server/src';
  const globalPrefix = resolveGlobalPrefix(ir);
  const routeResources = resolveRouteResources(ir);
  const queryScope = resolveExportQueryScope(ir.domain, ir.meta.generatedAt);
  const includeScopedQueries = hasQueryScope(queryScope);

  const files: GeneratedFile[] = [
    {
      path: '.env.example',
      content: generateEnvExample(ir, queryScope),
      encoding: 'utf-8',
      description: 'Environment variable template for exported Next.js server',
    },
    {
      path: `${root}/lib/database/pool.ts`,
      content: generateServerDatabaseModuleSource({
        database,
        scope: queryScope,
        scopeImportPath: '../../domain/scope',
      }),
      encoding: 'utf-8',
      description: `${database.label} data access helper`,
    },
    {
      path: 'README.export.server.md',
      content: generateReadme(ir, globalPrefix, database),
      encoding: 'utf-8',
      description: 'Setup notes for exported Next.js server fragment',
    },
  ];

  const resources =
    routeResources.length > 0
      ? routeResources
      : [
          {
            routeId: 'fallback:list-records',
            resourceName: 'records',
            tableName: database.source ?? 'records',
            method: 'GET' as const,
            globalPrefix,
          },
        ];

  for (const resource of resources) {
    files.push({
      path: `${root}/${routeAppPath(globalPrefix, resource.resourceName)}/route.ts`,
      content: generateRouteHandler(resource),
      encoding: 'utf-8',
      description: `Route handler for ${resource.method} /${globalPrefix}/${resource.resourceName}`,
    });
  }

  if (includeScopedQueries && queryScope) {
    files.push({
      path: `${root}/domain/scope.ts`,
      content: generateScopeModuleSource(queryScope),
      encoding: 'utf-8',
      description: 'Default domain query scope from ExportIR',
    });
  }

  return files;
}

function generateRouteHandler(resource: RouteResource): string {
  const importPath = routeImportPath(resource.globalPrefix, resource.resourceName);

  return joinLines([
    `import { NextResponse } from 'next/server';`,
    // The data client memoizes, so resolving it per request is cheap and keeps
    // the handler independent of which database the composite targets.
    `import { createDataClient, queryRows } from '${importPath}';`,
    ``,
    `export async function GET() {`,
    `  try {`,
    `    const rows = await queryRows(createDataClient(), '${resource.tableName}');`,
    `    return NextResponse.json(rows);`,
    `  } catch (error) {`,
    `    const message = error instanceof Error ? error.message : 'Unknown error';`,
    `    return NextResponse.json({ error: message }, { status: 500 });`,
    `  }`,
    `}`,
    ``,
  ]);
}

function generateReadme(
  ir: ExportIR,
  globalPrefix: string,
  database: ServerDatabaseSource,
): string {
  const routes =
    ir.routes.length > 0
      ? ir.routes.map((route) => `- \`${route.method} ${route.path}\``)
      : [`- \`GET /${globalPrefix}/records\` (fallback when IR routes are empty)`];

  const envKeys = [
    database.connectionEnvKey,
    ...(database.anonKeyEnvKey ? [database.anonKeyEnvKey] : []),
  ];

  return joinLines([
    `# ${ir.meta.compositeName} — Next.js Server Export`,
    ``,
    `Generated at ${ir.meta.generatedAt} from composite \`${ir.meta.compositeId}\` v${ir.meta.version}.`,
    ``,
    `## Files`,
    ``,
    `- \`server/src/app/${globalPrefix}/*/route.ts\` — App Router API route handlers`,
    `- \`server/src/lib/database/pool.ts\` — ${database.label} data access using \`${envKeys.join('`, `')}\``,
    `- \`.env.example\` — required environment variables`,
    ``,
    `## Routes`,
    ``,
    ...routes,
    ``,
    `## Setup`,
    ``,
    `1. Copy the generated \`server/src\` tree into your Next.js App Router project.`,
    `2. Install dependencies: \`npm install next react react-dom ${database.dependencies.join(' ')}\`.`,
    `3. Copy \`.env.example\` to \`.env.local\` and set \`${envKeys.join('`, `')}\`.`,
    `4. Ensure the referenced ${database.label} ${
      database.engine === 'mongodb' ? 'collections' : 'tables'
    } exist.`,
    `5. Run \`npm run dev\` and verify routes respond with row data.`,
    ``,
  ]);
}
