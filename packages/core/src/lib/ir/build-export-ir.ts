import type { ComponentRegistry } from '../registry/component-registry';
import type { Composite, ValidationIssue } from '../model/types';
import { validateComposite } from '../validation/validate-composite';
import type { DomainContext } from '../domain/domain-context';
import { normalizeDomainContext } from '../domain/domain-context';
import { visibilityRolesForComponent } from '../domain/role-visibility';
import { compositeHasOnboardingFlow, onboardingRoutePaths } from '../domain/onboarding';
import { resolveEffectiveStyling, resolveEffectiveStylingProfile } from '../export/stack-profile';
import type {
  BuildExportIROptions,
  ExportIR,
  ExportIRTargets,
  IREventBinding,
  IRDataSource,
} from './types';

export class ExportBuildError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super('Composite validation failed for export');
    this.name = 'ExportBuildError';
  }
}

const DEFAULT_TARGETS: ExportIRTargets = {
  ui: 'react',
};

export function buildExportIR(
  composite: Composite,
  registry: ComponentRegistry,
  options: BuildExportIROptions = {},
): ExportIR {
  const validation = validateComposite(composite, registry, { mode: 'strict' });
  if (!validation.valid) {
    throw new ExportBuildError(validation.issues);
  }

  const components = [];
  const layouts = [];
  const dataSources: IRDataSource[] = [];
  const envVarKeys = new Set<string>();

  for (const node of composite.nodes) {
    const definition = registry.getOrThrow(node.type);

    if (definition.category === 'visual' || definition.category === 'domain' || definition.category === 'logic') {
      const visibilityRoles = visibilityRolesForComponent({
        id: node.id,
        type: node.type,
        label: node.label,
        category: definition.category,
        properties: { ...node.properties },
        inputs: node.ports.inputs.map((port) => ({ ...port })),
        outputs: node.ports.outputs.map((port) => ({ ...port })),
      });
      components.push({
        id: node.id,
        type: node.type,
        label: node.label,
        category: definition.category,
        properties: { ...node.properties },
        layout: node.layout ? { ...node.layout } : undefined,
        inputs: node.ports.inputs.map((port) => ({ ...port })),
        outputs: node.ports.outputs.map((port) => ({ ...port })),
        visibilityRoles,
      });
      continue;
    }

    if (definition.category === 'layout') {
      layouts.push({
        id: node.id,
        type: node.type,
        label: node.label,
        properties: { ...node.properties },
        layout: node.layout ? { ...node.layout } : undefined,
      });
      continue;
    }

    if (definition.category === 'infra') {
      dataSources.push(mapInfraDataSource(node));
      collectEnvVars(node, envVarKeys);
    }
  }

  const events = mapEventBindings(composite, registry);
  const envVars = [...envVarKeys].map((key) => ({
    key,
    required: true,
    description: `Environment variable for ${key}`,
  }));

  const targets = resolveTargets(composite.exportTargets, options.defaultTargets);

  return {
    meta: {
      compositeId: composite.id,
      compositeName: composite.name,
      version: composite.version,
      generatedAt: options.generatedAt ?? new Date().toISOString(),
      ...(composite.templateId ? { templateId: composite.templateId } : {}),
      ...(options.exportScope ? { exportScope: options.exportScope } : {}),
      ...(options.exportNodeIds?.length ? { exportNodeIds: options.exportNodeIds } : {}),
    },
    targets,
    envVars,
    components,
    layouts,
    dataSources,
    routes: buildRoutes(composite, registry),
    events,
    styles: (() => {
      const profile = resolveEffectiveStylingProfile(options.stackProfile, targets.ui);
      return {
        profile,
        framework: resolveEffectiveStyling(options.stackProfile, targets.ui),
      };
    })(),
    domain: mapDomainContext(composite.domainContext),
  };
}

function mapDomainContext(context: DomainContext | undefined) {
  return normalizeDomainContext(context);
}

function resolveTargets(
  configured: Composite['exportTargets'],
  overrides?: Partial<Composite['exportTargets']>,
): ExportIRTargets {
  const server = overrides?.server ?? configured?.server;
  const database = overrides?.database ?? configured?.database;
  return {
    ui: overrides?.ui ?? configured?.ui ?? DEFAULT_TARGETS.ui,
    ...(server ? { server } : {}),
    ...(database ? { database } : {}),
  };
}

function mapInfraDataSource(node: Composite['nodes'][number]): IRDataSource {
  if (node.type === 'infra.postgresql') {
    const connectionEnvKey =
      typeof node.properties['connectionEnvKey'] === 'string'
        ? node.properties['connectionEnvKey']
        : 'DATABASE_URL';
    const table =
      typeof node.properties['table'] === 'string' ? node.properties['table'] : undefined;

    return {
      id: node.id,
      type: node.type,
      label: node.label,
      connectionEnvKey,
      table,
      properties: { ...node.properties },
    };
  }

  if (node.type === 'infra.mongodb') {
    const connectionEnvKey =
      typeof node.properties['connectionEnvKey'] === 'string'
        ? node.properties['connectionEnvKey']
        : 'MONGODB_URI';
    const collection =
      typeof node.properties['collection'] === 'string'
        ? node.properties['collection']
        : undefined;

    return {
      id: node.id,
      type: node.type,
      label: node.label,
      connectionEnvKey,
      collection,
      properties: { ...node.properties },
    };
  }

  if (node.type === 'infra.supabase') {
    const connectionEnvKey =
      typeof node.properties['urlEnvKey'] === 'string'
        ? node.properties['urlEnvKey']
        : 'SUPABASE_URL';
    const anonKeyEnvKey =
      typeof node.properties['anonKeyEnvKey'] === 'string'
        ? node.properties['anonKeyEnvKey']
        : 'SUPABASE_ANON_KEY';
    const table =
      typeof node.properties['table'] === 'string' ? node.properties['table'] : undefined;

    return {
      id: node.id,
      type: node.type,
      label: node.label,
      connectionEnvKey,
      anonKeyEnvKey,
      table,
      properties: { ...node.properties },
    };
  }

  if (node.type === 'infra.mysql') {
    const connectionEnvKey =
      typeof node.properties['connectionEnvKey'] === 'string'
        ? node.properties['connectionEnvKey']
        : 'MYSQL_URL';
    const table =
      typeof node.properties['table'] === 'string' ? node.properties['table'] : undefined;

    return {
      id: node.id,
      type: node.type,
      label: node.label,
      connectionEnvKey,
      table,
      properties: { ...node.properties },
    };
  }

  return {
    id: node.id,
    type: node.type,
    label: node.label,
    properties: { ...node.properties },
  };
}

function collectEnvVars(node: Composite['nodes'][number], envVarKeys: Set<string>): void {
  if (node.type === 'infra.postgresql') {
    const key =
      typeof node.properties['connectionEnvKey'] === 'string'
        ? node.properties['connectionEnvKey']
        : 'DATABASE_URL';
    envVarKeys.add(key);
    return;
  }

  if (node.type === 'infra.mongodb') {
    const key =
      typeof node.properties['connectionEnvKey'] === 'string'
        ? node.properties['connectionEnvKey']
        : 'MONGODB_URI';
    envVarKeys.add(key);
    return;
  }

  if (node.type === 'infra.supabase') {
    envVarKeys.add(
      typeof node.properties['urlEnvKey'] === 'string'
        ? node.properties['urlEnvKey']
        : 'SUPABASE_URL',
    );
    envVarKeys.add(
      typeof node.properties['anonKeyEnvKey'] === 'string'
        ? node.properties['anonKeyEnvKey']
        : 'SUPABASE_ANON_KEY',
    );
    return;
  }

  if (node.type === 'infra.mysql') {
    const key =
      typeof node.properties['connectionEnvKey'] === 'string'
        ? node.properties['connectionEnvKey']
        : 'MYSQL_URL';
    envVarKeys.add(key);
    return;
  }

  if (node.type === 'infra.env') {
    const variables = node.properties['variables'];
    if (Array.isArray(variables)) {
      for (const entry of variables) {
        if (typeof entry === 'string') {
          envVarKeys.add(entry);
        } else if (
          entry &&
          typeof entry === 'object' &&
          'key' in entry &&
          typeof (entry as { key: unknown }).key === 'string'
        ) {
          envVarKeys.add((entry as { key: string }).key);
        }
      }
    }
  }
}

function mapEventBindings(
  composite: Composite,
  registry: ComponentRegistry,
): IREventBinding[] {
  return composite.bindings.map((binding) => {
    const sourceNode = composite.nodes.find((node) => node.id === binding.sourceNodeId);
    const sourcePort = sourceNode
      ? registry.findPort(sourceNode, binding.sourcePortId, 'output')
      : undefined;

    return {
      bindingId: binding.id,
      sourceNodeId: binding.sourceNodeId,
      sourcePortId: binding.sourcePortId,
      targetNodeId: binding.targetNodeId,
      targetPortId: binding.targetPortId,
      dataType: sourcePort?.dataType ?? 'any',
    };
  });
}

function buildRoutes(composite: Composite, registry: ComponentRegistry) {
  const serverNode = composite.nodes.find((node) => node.type.startsWith('infra.server.'));
  if (!serverNode) {
    return [];
  }

  const prefix =
    typeof serverNode.properties['globalPrefix'] === 'string'
      ? serverNode.properties['globalPrefix']
      : 'api';

  const tableNodes = composite.nodes.filter((node) => node.type === 'visual.table');
  const pgNode = composite.nodes.find((node) => node.type === 'infra.postgresql');
  const mongoNode = composite.nodes.find((node) => node.type === 'infra.mongodb');
  const supabaseNode = composite.nodes.find((node) => node.type === 'infra.supabase');
  const mysqlNode = composite.nodes.find((node) => node.type === 'infra.mysql');
  const tableName =
    (pgNode && typeof pgNode.properties['table'] === 'string' ? pgNode.properties['table'] : undefined) ??
    (mongoNode && typeof mongoNode.properties['collection'] === 'string'
      ? mongoNode.properties['collection']
      : undefined) ??
    (supabaseNode && typeof supabaseNode.properties['table'] === 'string'
      ? supabaseNode.properties['table']
      : undefined) ??
    (mysqlNode && typeof mysqlNode.properties['table'] === 'string'
      ? mysqlNode.properties['table']
      : undefined) ??
    tableNodes[0]?.label.toLowerCase().replace(/\s+/g, '-') ??
    'records';

  registry.getOrThrow(serverNode.type);

  const routes = [
    {
      id: `${serverNode.id}:list-${tableName}`,
      method: 'GET' as const,
      path: `/${prefix}/${tableName}`,
      handlerNodeId: serverNode.id,
    },
  ];

  if (!compositeHasOnboardingFlow(composite)) {
    return routes;
  }

  const onboardingPaths = onboardingRoutePaths(prefix);
  return [
    ...routes,
    {
      id: `${serverNode.id}:onboarding-invite`,
      method: 'POST' as const,
      path: onboardingPaths.invitePath,
      handlerNodeId: serverNode.id,
    },
    {
      id: `${serverNode.id}:onboarding-role`,
      method: 'PATCH' as const,
      path: onboardingPaths.assignRolePath,
      handlerNodeId: serverNode.id,
    },
  ];
}
