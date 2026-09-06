import type { ExportIR, ServerDatabaseSource } from '@rosettadash/core';
import {
  collectExportRoleIds,
  generateScopeModuleSource,
  generateServerDatabaseModuleSource,
  hasQueryScope,
  irHasOnboardingFlow,
  irHasRoleGates,
  resolveExportQueryScope,
  resolveServerDatabaseSource,
} from '@rosettadash/core';
import type { GeneratedFile, NestExportOptions, RouteResource } from './types';
import { NestExportError } from './types';
import {
  generateEnvExample,
  joinLines,
  resolveGlobalPrefix,
  resolveRouteResources,
} from './utils';

export function generateNestInfraFiles(
  ir: ExportIR,
  options: NestExportOptions = {},
): GeneratedFile[] {
  if (ir.targets.server !== 'nest') {
    throw new NestExportError(`Nest exporter cannot generate server target "${ir.targets.server}"`);
  }

  const database = resolveServerDatabaseSource(ir);
  if (!database) {
    throw new NestExportError(
      'Nest infra export requires at least one database data source ' +
        '(PostgreSQL, MySQL, MongoDB, or Supabase)',
    );
  }

  const root = options.rootDir ?? 'server/src';
  const globalPrefix = resolveGlobalPrefix(ir);
  const routeResources = resolveRouteResources(ir);
  const roleIds = collectExportRoleIds(ir);
  const includeRoleAuth = irHasRoleGates(ir) || roleIds.length > 0;
  const includeOnboarding = irHasOnboardingFlow(ir);
  const queryScope = resolveExportQueryScope(ir.domain, ir.meta.generatedAt);
  const includeScopedQueries = hasQueryScope(queryScope);

  const files: GeneratedFile[] = [
    {
      path: '.env.example',
      content: generateEnvExample(ir, queryScope),
      encoding: 'utf-8',
      description: 'Environment variable template for exported NestJS server',
    },
    {
      path: `${root}/main.ts`,
      content: generateMainTs(globalPrefix),
      encoding: 'utf-8',
      description: 'NestJS bootstrap entry point',
    },
    {
      path: `${root}/app.module.ts`,
      content: generateAppModule(routeResources, includeRoleAuth, includeOnboarding),
      encoding: 'utf-8',
      description: 'Root application module',
    },
    {
      path: `${root}/database/database.module.ts`,
      content: generateDatabaseModule(),
      encoding: 'utf-8',
      description: `${database.label} provider module`,
    },
    {
      path: `${root}/database/data-client.ts`,
      content: generateServerDatabaseModuleSource({
        database,
        scope: queryScope,
        scopeImportPath: '../domain/scope',
      }),
      encoding: 'utf-8',
      description: `${database.label} data access helper`,
    },
    {
      path: `${root}/database/database.service.ts`,
      content: generateDatabaseService(),
      encoding: 'utf-8',
      description: 'Injectable wrapper around the data client',
    },
    {
      path: 'README.export.server.md',
      content: generateReadme(ir, globalPrefix, database),
      encoding: 'utf-8',
      description: 'Setup notes for exported NestJS server fragment',
    },
  ];

  for (const resource of routeResources) {
    files.push({
      path: `${root}/${resource.resourceName}/${resource.resourceName}.controller.ts`,
      content: generateController(resource, includeRoleAuth ? roleIds : []),
      encoding: 'utf-8',
      description: `Route handler for ${resource.method} /${globalPrefix}/${resource.resourceName}`,
    });
    files.push({
      path: `${root}/${resource.resourceName}/${resource.resourceName}.module.ts`,
      content: generateFeatureModule(resource),
      encoding: 'utf-8',
      description: `Feature module for ${resource.resourceName}`,
    });
  }

  if (routeResources.length === 0) {
    const fallback = {
      routeId: 'fallback:list-records',
      resourceName: 'records',
      controllerName: 'RecordsController',
      moduleName: 'RecordsModule',
      tableName: database.source ?? 'records',
      method: 'GET' as const,
      globalPrefix,
    };
    files.push(
      {
        path: `${root}/records/records.controller.ts`,
        content: generateController(fallback, includeRoleAuth ? roleIds : []),
        encoding: 'utf-8',
        description: 'Fallback list route when ExportIR has no routes',
      },
      {
        path: `${root}/records/records.module.ts`,
        content: generateFeatureModule(fallback),
        encoding: 'utf-8',
        description: 'Fallback records module',
      },
    );
  }

  if (includeScopedQueries && queryScope) {
    files.push({
      path: `${root}/domain/scope.ts`,
      content: generateScopeModuleSource(queryScope),
      encoding: 'utf-8',
      description: 'Default domain query scope from ExportIR',
    });
  }

  if (includeRoleAuth) {
    files.push(
      {
        path: `${root}/auth/roles.decorator.ts`,
        content: generateRolesDecorator(),
        encoding: 'utf-8',
        description: 'Roles decorator for route authorization stubs',
      },
      {
        path: `${root}/auth/roles.guard.ts`,
        content: generateRolesGuard(roleIds),
        encoding: 'utf-8',
        description: 'Role guard stub reading x-rosettadash-role header',
      },
      {
        path: `${root}/auth/auth.module.ts`,
        content: generateAuthModule(),
        encoding: 'utf-8',
        description: 'Auth module exporting role guard',
      },
    );
  }

  if (includeOnboarding) {
    files.push(
      {
        path: `${root}/onboarding/onboarding.controller.ts`,
        content: generateOnboardingController(includeRoleAuth ? roleIds : []),
        encoding: 'utf-8',
        description: 'Onboarding invite and role assignment route stubs',
      },
      {
        path: `${root}/onboarding/onboarding.module.ts`,
        content: generateOnboardingModule(),
        encoding: 'utf-8',
        description: 'Onboarding feature module',
      },
    );
  }

  return files;
}

function generateMainTs(globalPrefix: string): string {
  return joinLines([
    `import { Logger } from '@nestjs/common';`,
    `import { NestFactory } from '@nestjs/core';`,
    `import { AppModule } from './app.module';`,
    ``,
    `async function bootstrap() {`,
    `  const app = await NestFactory.create(AppModule);`,
    `  app.setGlobalPrefix('${globalPrefix}');`,
    `  app.enableCors({ origin: true });`,
    `  const port = process.env.PORT || 3000;`,
    `  await app.listen(port);`,
    `  Logger.log(\`Server running on http://localhost:\${port}/${globalPrefix}\`);`,
    `}`,
    ``,
    `void bootstrap();`,
    ``,
  ]);
}

function generateAppModule(
  routeResources: RouteResource[],
  includeRoleAuth: boolean,
  includeOnboarding: boolean,
): string {
  const modules =
    routeResources.length > 0
      ? routeResources
      : [{ moduleName: 'RecordsModule', resourceName: 'records' } as RouteResource];

  const imports = modules.map(
    (resource) =>
      `import { ${resource.moduleName} } from './${resource.resourceName}/${resource.resourceName}.module';`,
  );
  const moduleList = modules.map((resource) => `    ${resource.moduleName},`).join('\n');
  const authImport = includeRoleAuth ? [`import { AuthModule } from './auth/auth.module';`] : [];
  const authModule = includeRoleAuth ? [`    AuthModule,`] : [];
  const onboardingImport = includeOnboarding
    ? [`import { OnboardingModule } from './onboarding/onboarding.module';`]
    : [];
  const onboardingModule = includeOnboarding ? [`    OnboardingModule,`] : [];

  return joinLines([
    `import { Module } from '@nestjs/common';`,
    `import { DatabaseModule } from './database/database.module';`,
    ...authImport,
    ...onboardingImport,
    ...imports,
    ``,
    `@Module({`,
    `  imports: [`,
    `    DatabaseModule,`,
    ...authModule,
    ...onboardingModule,
    moduleList,
    `  ],`,
    `})`,
    `export class AppModule {}`,
    ``,
  ]);
}

function generateDatabaseModule(): string {
  return joinLines([
    `import { Global, Module } from '@nestjs/common';`,
    `import { DatabaseService } from './database.service';`,
    ``,
    `@Global()`,
    `@Module({`,
    `  providers: [DatabaseService],`,
    `  exports: [DatabaseService],`,
    `})`,
    `export class DatabaseModule {}`,
    ``,
  ]);
}

/**
 * Nest-idiomatic wrapper. All engine specifics live in `data-client.ts`, so
 * this class is identical whichever database the composite targets.
 */
function generateDatabaseService(): string {
  return joinLines([
    `import { Injectable, OnModuleDestroy } from '@nestjs/common';`,
    `import {`,
    `  closeDataClient,`,
    `  createDataClient,`,
    `  queryRows,`,
    `  type DataClient,`,
    `} from './data-client';`,
    ``,
    `@Injectable()`,
    `export class DatabaseService implements OnModuleDestroy {`,
    `  private readonly client: DataClient = createDataClient();`,
    ``,
    `  queryRows(source: string, limit = 100): Promise<Record<string, unknown>[]> {`,
    `    return queryRows(this.client, source, limit);`,
    `  }`,
    ``,
    `  async onModuleDestroy(): Promise<void> {`,
    `    await closeDataClient(this.client);`,
    `  }`,
    `}`,
    ``,
  ]);
}

function generateController(resource: RouteResource, requiredRoles: string[]): string {
  const commonImport =
    requiredRoles.length > 0
      ? `import { Controller, Get, UseGuards } from '@nestjs/common';`
      : `import { Controller, Get } from '@nestjs/common';`;
  const roleImports =
    requiredRoles.length > 0
      ? [`import { Roles } from '../auth/roles.decorator';`, `import { RolesGuard } from '../auth/roles.guard';`]
      : [];
  const guardLines =
    requiredRoles.length > 0
      ? [`@UseGuards(RolesGuard)`, `@Roles(${requiredRoles.map((role) => `'${role}'`).join(', ')})`]
      : [];

  return joinLines([
    commonImport,
    ...roleImports,
    `import { DatabaseService } from '../database/database.service';`,
    ``,
    `@Controller('${resource.resourceName}')`,
    ...guardLines,
    `export class ${resource.controllerName} {`,
    `  constructor(private readonly database: DatabaseService) {}`,
    ``,
    `  @Get()`,
    `  listRecords() {`,
    `    return this.database.queryRows('${resource.tableName}');`,
    `  }`,
    `}`,
    ``,
  ]);
}

function generateFeatureModule(resource: RouteResource): string {
  return joinLines([
    `import { Module } from '@nestjs/common';`,
    `import { ${resource.controllerName} } from './${resource.resourceName}.controller';`,
    ``,
    `@Module({`,
    `  controllers: [${resource.controllerName}],`,
    `})`,
    `export class ${resource.moduleName} {}`,
    ``,
  ]);
}

function generateRolesDecorator(): string {
  return joinLines([
    `import { SetMetadata } from '@nestjs/common';`,
    ``,
    `export const ROLES_KEY = 'rosettadash.roles';`,
    `export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);`,
    ``,
  ]);
}

function generateRolesGuard(roleIds: string[]): string {
  const knownRoles = roleIds.length > 0 ? roleIds : ['viewer'];
  return joinLines([
    `import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';`,
    `import { Reflector } from '@nestjs/core';`,
    `import { ROLES_KEY } from './roles.decorator';`,
    ``,
    `@Injectable()`,
    `export class RolesGuard implements CanActivate {`,
    `  constructor(private readonly reflector: Reflector) {}`,
    ``,
    `  canActivate(context: ExecutionContext): boolean {`,
    `    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [`,
    `      context.getHandler(),`,
    `      context.getClass(),`,
    `    ]);`,
    ``,
    `    if (!requiredRoles?.length) {`,
    `      return true;`,
    `    }`,
    ``,
    `    const request = context.switchToHttp().getRequest<{ headers?: Record<string, string | string[] | undefined> }>();`,
    `    const header = request.headers?.['x-rosettadash-role'];`,
    `    const role = Array.isArray(header) ? header[0] : header ?? '${knownRoles[0]}';`,
    `    return requiredRoles.includes(role);`,
    `  }`,
    `}`,
    ``,
  ]);
}

function generateAuthModule(): string {
  return joinLines([
    `import { Global, Module } from '@nestjs/common';`,
    `import { RolesGuard } from './roles.guard';`,
    ``,
    `@Global()`,
    `@Module({`,
    `  providers: [RolesGuard],`,
    `  exports: [RolesGuard],`,
    `})`,
    `export class AuthModule {}`,
    ``,
  ]);
}

function generateOnboardingController(requiredRoles: string[]): string {
  const imports =
    requiredRoles.length > 0
      ? [
          `import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';`,
          `import { Roles } from '../auth/roles.decorator';`,
          `import { RolesGuard } from '../auth/roles.guard';`,
        ]
      : [`import { Body, Controller, Patch, Post } from '@nestjs/common';`];
  const guardLines =
    requiredRoles.length > 0
      ? [
          `@UseGuards(RolesGuard)`,
          `@Roles(${requiredRoles.map((role) => `'${role}'`).join(', ')})`,
        ]
      : [];

  return joinLines([
    ...imports,
    ``,
    `@Controller('onboarding')`,
    ...guardLines,
    `export class OnboardingController {`,
    `  @Post('invite')`,
    `  invite(@Body() body: { email?: string }) {`,
    `    return { ok: true, email: body.email ?? '', status: 'invited' };`,
    `  }`,
    ``,
    `  @Patch('role')`,
    `  assignRole(@Body() body: { personId?: string; roleId?: string }) {`,
    `    return { ok: true, personId: body.personId ?? '', roleId: body.roleId ?? '' };`,
    `  }`,
    `}`,
    ``,
  ]);
}

function generateOnboardingModule(): string {
  return joinLines([
    `import { Module } from '@nestjs/common';`,
    `import { OnboardingController } from './onboarding.controller';`,
    ``,
    `@Module({`,
    `  controllers: [OnboardingController],`,
    `})`,
    `export class OnboardingModule {}`,
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
    `# ${ir.meta.compositeName} — NestJS Server Export`,
    ``,
    `Generated at ${ir.meta.generatedAt} from composite \`${ir.meta.compositeId}\` v${ir.meta.version}.`,
    ``,
    `## Files`,
    ``,
    `- \`server/src/main.ts\` — NestJS bootstrap with \`/${globalPrefix}\` global prefix`,
    `- \`server/src/database/*\` — ${database.label} data access using \`${envKeys.join('`, `')}\``,
    `- \`server/src/*/*.controller.ts\` — list endpoints derived from ExportIR routes`,
    ...(irHasRoleGates(ir) || (ir.domain?.roles?.length ?? 0) > 0
      ? [`- \`server/src/auth/*\` — role guard stub using \`x-rosettadash-role\` header`]
      : []),
    ...(irHasOnboardingFlow(ir)
      ? [`- \`server/src/onboarding/*\` — invite and role assignment route stubs`]
      : []),
    `- \`.env.example\` — required environment variables`,
    ``,
    `## Routes`,
    ``,
    ...routes,
    ``,
    `## Setup`,
    ``,
    `1. Copy the generated \`server/\` folder into your NestJS app (or use it as a starter).`,
    `2. Install dependencies: \`npm install ${database.dependencies.join(' ')}\`.`,
    `3. Copy \`.env.example\` to \`.env\` and set \`${envKeys.join('`, `')}\`.`,
    `4. Ensure the referenced ${database.label} ${
      database.engine === 'mongodb' ? 'collections' : 'tables'
    } exist.`,
    `5. Start the server and verify routes respond with row data.`,
    ``,
  ]);
}
