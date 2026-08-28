import type { DomainContext } from '../domain/domain-context';
import type { ExportScope } from '../export/resolve-export-scope';
import type { DataType } from '../model/data-types';
import type {
  ExportTargetConfig,
  NodeCategory,
  NodeLayout,
  Port,
  StackProfile,
  StackStylingProfile,
  StylingFrameworkChoice,
} from '../model/types';

export interface ExportIRMeta {
  compositeId: string;
  compositeName: string;
  version: number;
  generatedAt: string;
  templateId?: string;
  exportScope?: 'full' | 'single' | 'selection';
  exportNodeIds?: string[];
}

export interface IRStyleTokens {
  profile: StackStylingProfile;
  /** Primary framework label for v1 export comments and legacy consumers. */
  framework: StylingFrameworkChoice;
}

export interface EnvVarSpec {
  key: string;
  description?: string;
  required: boolean;
  example?: string;
}

export interface IRComponent {
  id: string;
  type: string;
  label: string;
  category: NodeCategory;
  properties: Record<string, unknown>;
  layout?: NodeLayout;
  inputs: Port[];
  outputs: Port[];
  visibilityRoles?: string[];
}

export interface IRLayout {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
  layout?: NodeLayout;
}

export interface IRDataSource {
  id: string;
  type: string;
  label: string;
  connectionEnvKey?: string;
  anonKeyEnvKey?: string;
  table?: string;
  collection?: string;
  properties: Record<string, unknown>;
}

export interface IRRoute {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  handlerNodeId?: string;
}

export interface IREventBinding {
  bindingId: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  dataType: DataType;
}

export interface ExportIRTargets {
  ui: NonNullable<ExportTargetConfig['ui']>;
  server?: NonNullable<ExportTargetConfig['server']>;
  database?: ExportTargetConfig['database'];
}

export interface ExportIR {
  meta: ExportIRMeta;
  targets: ExportIRTargets;
  envVars: EnvVarSpec[];
  components: IRComponent[];
  layouts: IRLayout[];
  dataSources: IRDataSource[];
  routes: IRRoute[];
  events: IREventBinding[];
  styles: IRStyleTokens;
  domain?: DomainContext;
}

export interface BuildExportIROptions {
  generatedAt?: string;
  defaultTargets?: Partial<ExportTargetConfig>;
  stackProfile?: StackProfile;
  exportScope?: ExportScope;
  exportNodeIds?: string[];
}
