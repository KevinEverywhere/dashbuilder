import type { ExportIR, ServerDatabaseSource } from '@rosettadash/core';
import {
  generateScopeModuleSource,
  generateServerDatabaseModuleSource,
  hasQueryScope,
  resolveExportQueryScope,
  resolveServerDatabaseSource,
} from '@rosettadash/core';
import type { GeneratedFile, NuxtExportOptions, RouteResource } from './types';
import { NuxtExportError } from './types';
import {
  generateEnvExample,
  joinLines,
  resolveGlobalPrefix,
  resolveRouteResources,
  routeImportPath,
  routeServerPath,
} from './utils';

export function generateNuxtInfraFiles(
  ir: ExportIR,
  options: NuxtExportOptions = {},
): GeneratedFile[] {
  if (ir.targets.server !== 'nuxt') {
    throw new NuxtExportError(`Nuxt exporter cannot generate server target "${ir.targets.server}"`);
  }

  const database = resolveServerDatabaseSource(ir);
  if (!database) {
    throw new NuxtExportError(
      'Nuxt infra export requires at least one database data source ' +
        '(PostgreSQL, MySQL, MongoDB, or Supabase)',
    );
  }

  const root = options.rootDir ?? 'server';
  const globalPrefix = resolveGlobalPrefix(ir);
  const routeResources = resolveRouteResources(ir);
  const queryScope = resolveExportQueryScope(ir.domain, ir.meta.generatedAt);
  const includeScopedQueries = hasQueryScope(queryScope);

  const files: GeneratedFile[] = [
    {
      path: '.env.example',
      content: generateEnvExample(ir, queryScope),
      encoding: 'utf-8',
      description: 'Environment variable template for exported Nuxt server',
    },
    {
      path: `${root}/utils/database.ts`,
      content: generateServerDatabaseModuleSource({
        database,
        scope: queryScope,
        scopeImportPath: './scope',
      }),
      encoding: 'utf-8',
      description: `${database.label} data access helper`,
    },
    {
      path: 'README.export.server.md',
      content: generateReadme(ir, globalPrefix, database),
      encoding: 'utf-8',
      description: 'Setup notes for exported Nuxt server fragment',
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
      path: routeServerPath(globalPrefix, resource.resourceName),
      content: generateRouteHandler(resource),
      encoding: 'utf-8',
      description: `Route handler for ${resource.method} /${globalPrefix}/${resource.resourceName}`,
    });
  }

  if (includeScopedQueries && queryScope) {
    files.push({
      path: `${root}/utils/scope.ts`,
      content: generateScopeModuleSource(queryScope),
      encoding: 'utf-8',
      description: 'Default domain query scope from ExportIR',
    });
  }

  return files;
}

function generateRouteHandler(resource: RouteResource): string {
  const importPath = routeImportPath(resource.globalPrefix);

  return joinLines([
    // The data client memoizes, so resolving it per request is cheap and keeps
    // the handler independent of which database the composite targets.
    `import { createDataClient, queryRows } from '${importPath}';`,
    ``,
    `export default defineEventHandler(async () => {`,
    `  try {`,
    `    return await queryRows(createDataClient(), '${resource.tableName}');`,
    `  } catch (error) {`,
    `    throw createError({`,
    `      statusCode: 500,`,
    `      statusMessage: error instanceof Error ? error.message : 'Unknown error',`,
    `    });`,
    `  }`,
    `});`,
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
    `# ${ir.meta.compositeName} — Nuxt Server Export`,
    ``,
    `Generated at ${ir.meta.generatedAt} from composite \`${ir.meta.compositeId}\` v${ir.meta.version}.`,
    ``,
    `## Files`,
    ``,
    `- \`server/api/*.get.ts\` or \`server/routes/*/*.get.ts\` — Nitro route handlers`,
    `- \`server/utils/database.ts\` — ${database.label} data access using \`${envKeys.join('`, `')}\``,
    `- \`.env.example\` — required environment variables`,
    ``,
    `## Routes`,
    ``,
    ...routes,
    ``,
    `## Setup`,
    ``,
    `1. Copy the generated \`server/\` tree into your Nuxt 3 project.`,
    `2. Install dependencies: \`npm install nuxt ${database.dependencies.join(' ')}\`.`,
    `3. Copy \`.env.example\` to \`.env\` and set \`${envKeys.join('`, `')}\`.`,
    `4. Ensure the referenced ${database.label} ${
      database.engine === 'mongodb' ? 'collections' : 'tables'
    } exist.`,
    `5. Run \`npm run dev\` and verify routes respond with row data.`,
    ``,
  ]);
}
