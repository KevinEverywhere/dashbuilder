import type { Binding, ComponentNode } from '../model/types';
import type { ComponentRegistry } from '../registry/component-registry';

export type DataWiringStatus = 'unwired' | 'incomplete' | 'ready';

export interface DataWiringIssue {
  code: string;
  message: string;
}

export interface DataWiringReport {
  status: DataWiringStatus;
  targetNodeId: string;
  targetPortId: string;
  targetPortName: string;
  sourceNodeId?: string;
  sourceNodeLabel?: string;
  sourceNodeType?: string;
  sourcePortId?: string;
  sourcePortName?: string;
  connectionEnvKey?: string;
  anonKeyEnvKey?: string;
  tableName?: string;
  collectionName?: string;
  chain: string[];
  issues: DataWiringIssue[];
}

export interface ResolveDataWiringOptions {
  targetPortId?: string;
}

const ROWSET_DATA_PORTS = new Set(['data']);

export function resolveDataWiring(
  nodes: readonly ComponentNode[],
  bindings: readonly Binding[],
  registry: ComponentRegistry,
  targetNodeId: string,
  options: ResolveDataWiringOptions = {},
): DataWiringReport | null {
  const targetNode = nodes.find((node) => node.id === targetNodeId);
  if (!targetNode) {
    return null;
  }

  const definition = registry.get(targetNode.type);
  const dataInput =
    definition?.inputs.find(
      (port) =>
        port.id === (options.targetPortId ?? 'data') &&
        port.dataType === 'rowset',
    ) ??
    definition?.inputs.find((port) => ROWSET_DATA_PORTS.has(port.id) && port.dataType === 'rowset');

  if (!dataInput) {
    return null;
  }

  const binding = bindings.find(
    (entry) => entry.targetNodeId === targetNodeId && entry.targetPortId === dataInput.id,
  );

  const base: DataWiringReport = {
    status: 'unwired',
    targetNodeId,
    targetPortId: dataInput.id,
    targetPortName: dataInput.name,
    chain: [`${targetNode.label}.${dataInput.name} (${dataInput.dataType})`],
    issues: [],
  };

  if (!binding) {
    base.issues.push({
      code: 'UNBOUND_DATA_PORT',
      message:
        'Connect a source rowset output to this table\'s data input — e.g. PostgreSQL rowset → Data Table data. Or use Connect in the inspector.',
    });
    return base;
  }

  const sourceNode = nodes.find((node) => node.id === binding.sourceNodeId);
  const sourceDef = sourceNode ? registry.get(sourceNode.type) : undefined;
  const sourcePort = sourceDef?.outputs.find((port) => port.id === binding.sourcePortId);

  if (!sourceNode || !sourceDef || !sourcePort) {
    base.issues.push({
      code: 'MISSING_SOURCE',
      message: 'Binding points to a missing source node or port.',
    });
    return base;
  }

  if (sourcePort.dataType !== 'rowset') {
    base.issues.push({
      code: 'INCOMPATIBLE_SOURCE',
      message: `Source port "${sourcePort.name}" is ${sourcePort.dataType}, not rowset.`,
    });
    return base;
  }

  base.sourceNodeId = sourceNode.id;
  base.sourceNodeLabel = sourceNode.label;
  base.sourceNodeType = sourceNode.type;
  base.sourcePortId = sourcePort.id;
  base.sourcePortName = sourcePort.name;
  base.chain = [
    `${sourceNode.label}.${sourcePort.name} (${sourcePort.dataType})`,
    `→ ${targetNode.label}.${dataInput.name} (${dataInput.dataType})`,
  ];

  enrichSourceMetadata(base, sourceNode);
  base.status = base.issues.length === 0 ? 'ready' : 'incomplete';
  return base;
}

function enrichSourceMetadata(report: DataWiringReport, sourceNode: ComponentNode): void {
  const props = sourceNode.properties;

  switch (sourceNode.type) {
    case 'infra.postgresql':
    case 'infra.mysql': {
      report.connectionEnvKey =
        typeof props['connectionEnvKey'] === 'string' && props['connectionEnvKey'].trim()
          ? props['connectionEnvKey'].trim()
          : sourceNode.type === 'infra.mysql'
            ? 'MYSQL_URL'
            : 'DATABASE_URL';
      const table = typeof props['table'] === 'string' ? props['table'].trim() : '';
      report.tableName = table || undefined;
      if (!table) {
        report.issues.push({
          code: 'MISSING_TABLE',
          message: 'Set the table name on the PostgreSQL / MySQL source node.',
        });
      }
      return;
    }
    case 'infra.mongodb': {
      report.connectionEnvKey =
        typeof props['connectionEnvKey'] === 'string' && props['connectionEnvKey'].trim()
          ? props['connectionEnvKey'].trim()
          : 'MONGODB_URI';
      const collection = typeof props['collection'] === 'string' ? props['collection'].trim() : '';
      report.collectionName = collection || undefined;
      if (!collection) {
        report.issues.push({
          code: 'MISSING_COLLECTION',
          message: 'Set the collection name on the MongoDB source node.',
        });
      }
      return;
    }
    case 'infra.supabase': {
      report.connectionEnvKey =
        typeof props['urlEnvKey'] === 'string' && props['urlEnvKey'].trim()
          ? props['urlEnvKey'].trim()
          : 'SUPABASE_URL';
      report.anonKeyEnvKey =
        typeof props['anonKeyEnvKey'] === 'string' && props['anonKeyEnvKey'].trim()
          ? props['anonKeyEnvKey'].trim()
          : 'SUPABASE_ANON_KEY';
      const table = typeof props['table'] === 'string' ? props['table'].trim() : '';
      report.tableName = table || undefined;
      if (!table) {
        report.issues.push({
          code: 'MISSING_TABLE',
          message: 'Set the table name on the Supabase source node.',
        });
      }
      return;
    }
    default:
      report.issues.push({
        code: 'UNSUPPORTED_SOURCE',
        message: `Source type "${sourceNode.type}" cannot be probed from the builder yet.`,
      });
  }
}

export function nodeHasRowsetDataInput(
  registry: ComponentRegistry,
  nodeType: string,
): boolean {
  const definition = registry.get(nodeType);
  return definition?.inputs.some((port) => port.dataType === 'rowset' && port.id === 'data') ?? false;
}
