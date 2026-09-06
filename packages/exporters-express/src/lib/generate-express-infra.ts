import type { ExportIR, ServerDatabaseSource } from '@rosettadash/core';
import {
  generateScopeModuleSource,
  generateServerDatabaseModuleSource,
  hasQueryScope,
  resolveExportQueryScope,
  resolveServerDatabaseSource,
} from '@rosettadash/core';
import type { ExpressExportOptions, GeneratedFile, RouteResource } from './types';
import { ExpressExportError } from './types';
import {
  generateEnvExample,
  joinLines,
  resolveGlobalPrefix,
  resolvePrimaryConnectionEnvKey,
  resolveRouteResources,
} from './utils';

export function generateExpressInfraFiles(
  ir: ExportIR,
  options: ExpressExportOptions = {},
): GeneratedFile[] {
  if (ir.targets.server !== 'express') {
    throw new ExpressExportError(
      `Express exporter cannot generate server target "${ir.targets.server}"`,
    );
  }

  const database = resolveServerDatabaseSource(ir);
  if (!database) {
    throw new ExpressExportError(
      'Express infra export requires at least one database data source ' +
        '(PostgreSQL, MySQL, MongoDB, or Supabase)',
    );
  }

  const root = options.rootDir ?? 'server/src';
  const globalPrefix = resolveGlobalPrefix(ir);
  const routeResources = resolveRouteResources(ir);
  const connectionEnvKey = resolvePrimaryConnectionEnvKey(ir);
  const queryScope = resolveExportQueryScope(ir.domain, ir.meta.generatedAt);
  const includeScopedQueries = hasQueryScope(queryScope);

  const files: GeneratedFile[] = [
    {
      path: '.env.example',
      content: generateEnvExample(ir, queryScope),
      encoding: 'utf-8',
      description: 'Environment variable template for exported Express server',
    },
    {
      path: `${root}/index.ts`,
      content: generateIndexTs(globalPrefix, routeResources, database),
      encoding: 'utf-8',
      description: 'Express bootstrap entry point',
    },
    {
      path: `${root}/database/pool.ts`,
      content: generateServerDatabaseModuleSource({
        database,
        scope: queryScope,
        scopeImportPath: '../domain/scope',
      }),
      encoding: 'utf-8',
      description: `${database.label} data access helper`,
    },
    {
      path: 'README.export.server.md',
      content: generateReadme(ir, globalPrefix, database),
      encoding: 'utf-8',
      description: 'Setup notes for exported Express server fragment',
    },
  ];

  for (const resource of routeResources) {
    files.push({
      path: `${root}/routes/${resource.resourceName}.ts`,
      content: generateRouteModule(resource),
      encoding: 'utf-8',
      description: `Route handler for ${resource.method} /${globalPrefix}/${resource.resourceName}`,
    });
  }

  if (routeResources.length === 0) {
    const fallback: RouteResource = {
      routeId: 'fallback:list-records',
      resourceName: 'records',
      routerName: 'RecordsRouter',
      tableName: database.source ?? 'records',
      method: 'GET',
      globalPrefix,
    };
    files.push({
      path: `${root}/routes/records.ts`,
      content: generateRouteModule(fallback),
      encoding: 'utf-8',
      description: 'Fallback list route when ExportIR has no routes',
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

function generateIndexTs(
  globalPrefix: string,
  routeResources: RouteResource[],
  database: ServerDatabaseSource,
): string {
  const resources =
    routeResources.length > 0
      ? routeResources
      : [
          {
            resourceName: 'records',
            routerName: 'RecordsRouter',
            tableName: database.source ?? 'records',
          } as RouteResource,
        ];

  const imports = resources.map(
    (resource) =>
      `import { create${resource.routerName} } from './routes/${resource.resourceName}';`,
  );
  const mounts = resources.map(
    (resource) =>
      `  app.use('/${globalPrefix}/${resource.resourceName}', create${resource.routerName}(client));`,
  );

  return joinLines([
    `import cors from 'cors';`,
    `import express from 'express';`,
    `import { createDataClient } from './database/pool';`,
    ...imports,
    ``,
    `const app = express();`,
    `app.use(cors());`,
    `app.use(express.json());`,
    ``,
    `const client = createDataClient();`,
    ...mounts,
    ``,
    `const port = Number(process.env.PORT) || 3000;`,
    `app.listen(port, () => {`,
    `  console.log(\`Server running on http://localhost:\${port}/${globalPrefix}\`);`,
    `});`,
    ``,
  ]);
}

function generateRouteModule(resource: RouteResource): string {
  return joinLines([
    `import { Router } from 'express';`,
    // DataClient comes from the generated database module, so the route shape
    // is the same whichever database the composite targets.
    `import { queryRows, type DataClient } from '../database/pool';`,
    ``,
    `export function create${resource.routerName}(client: DataClient): Router {`,
    `  const router = Router();`,
    ``,
    `  router.get('/', async (_req, res, next) => {`,
    `    try {`,
    `      const rows = await queryRows(client, '${resource.tableName}');`,
    `      res.json(rows);`,
    `    } catch (error) {`,
    `      next(error);`,
    `    }`,
    `  });`,
    ``,
    `  return router;`,
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

  const envKeys = [database.connectionEnvKey, ...(database.anonKeyEnvKey ? [database.anonKeyEnvKey] : [])];
  const install = ['express', 'cors', ...database.dependencies, '@types/express', '@types/cors'];

  return joinLines([
    `# ${ir.meta.compositeName} — Express Server Export`,
    ``,
    `Generated at ${ir.meta.generatedAt} from composite \`${ir.meta.compositeId}\` v${ir.meta.version}.`,
    ``,
    `## Files`,
    ``,
    `- \`server/src/index.ts\` — Express bootstrap with \`/${globalPrefix}\` route prefix`,
    `- \`server/src/database/pool.ts\` — ${database.label} data access using \`${envKeys.join('`, `')}\``,
    `- \`server/src/routes/*.ts\` — list endpoints derived from ExportIR routes`,
    `- \`.env.example\` — required environment variables`,
    ``,
    `## Routes`,
    ``,
    ...routes,
    ``,
    `## Setup`,
    ``,
    `1. Copy the generated \`server/\` folder into your Express app (or use it as a starter).`,
    `2. Install dependencies: \`npm install ${install.join(' ')}\`.`,
    `3. Copy \`.env.example\` to \`.env\` and set \`${envKeys.join('`, `')}\`.`,
    `4. Ensure the referenced ${database.label} ${
      database.engine === 'mongodb' ? 'collections' : 'tables'
    } exist.`,
    `5. Start the server and verify routes respond with row data.`,
    ``,
  ]);
}
