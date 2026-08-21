import type { DataType } from './data-types';
import type { DomainContext } from '../domain/domain-context';

export type NodeCategory = 'visual' | 'layout' | 'logic' | 'domain' | 'infra';

export type PropertySchemaType = 'string' | 'number' | 'boolean' | 'select' | 'json';

export interface PropertySchema {
  key: string;
  label: string;
  type: PropertySchemaType;
  default?: unknown;
  required?: boolean;
  readOnly?: boolean;
  options?: { label: string; value: string | number | boolean }[];
  description?: string;
}

export interface PortDefinition {
  id: string;
  name: string;
  dataType: DataType;
  required?: boolean;
  description?: string;
}

export interface ComponentDefinition {
  type: string;
  category: NodeCategory;
  label: string;
  description?: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  properties: PropertySchema[];
  isVisual: boolean;
}

export interface Port {
  id: string;
  name: string;
  dataType: DataType;
  required?: boolean;
}

export interface NodeLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComponentNodeMeta {
  frameworkHints?: Record<string, unknown>;
  suggestedBy?: 'user' | 'defaults-engine';
}

export interface ComponentNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
  ports: {
    inputs: Port[];
    outputs: Port[];
  };
  layout?: NodeLayout;
  meta?: ComponentNodeMeta;
}

export interface Binding {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface ExportTargetConfig {
  ui?: 'react' | 'angular' | 'vue' | 'svelte' | 'web-components';
  server?: 'next' | 'nuxt' | 'nest' | 'express';
  database?: 'mongodb' | 'postgresql' | 'supabase' | 'mysql';
}

/** Server choice on the welcome stack picker — includes explicit opt-out. */
export type StackServerChoice = NonNullable<ExportTargetConfig['server']> | 'none';

/** Database choice on the welcome stack picker — includes explicit opt-out. */
export type StackDatabaseChoice = NonNullable<ExportTargetConfig['database']> | 'none';

/** @deprecated Legacy single-choice styling value — migrated to {@link StackStylingProfile}. */
export type StylingFrameworkChoice =
  | 'neutral'
  | 'tailwind'
  | 'mui'
  | 'angular-material'
  | 'vuetify'
  | 'plain-css'
  | 'plain-scss';

/** Global design tokens / utility layers (combinable). */
export type StylingFoundation = 'neutral-tokens' | 'tailwind';

/** Optional UI component library (at most one per stack). */
export type StylingComponentLibrary = 'mui' | 'angular-material' | 'vuetify';

/** How custom component styles are authored (combinable). */
export type StylingAuthoring =
  | 'css-modules'
  | 'styled-components'
  | 'plain-css'
  | 'plain-scss';

/** Composable styling preferences — users may enable multiple non-exclusive options. */
export interface StackStylingProfile {
  foundation: StylingFoundation[];
  componentLibrary?: StylingComponentLibrary;
  authoring: StylingAuthoring[];
  inlineStyles: boolean;
}

export interface StackProfile {
  ui: 'react' | 'angular' | 'vue' | 'svelte' | 'web-components';
  server?: StackServerChoice;
  database?: StackDatabaseChoice;
  /** Composable styling profile, or legacy single {@link StylingFrameworkChoice}. */
  styling?: StackStylingProfile | StylingFrameworkChoice;
}

export interface Composite {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  nodes: ComponentNode[];
  bindings: Binding[];
  exportTargets?: ExportTargetConfig;
  domainContext?: DomainContext;
  version: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  stackProfile?: StackProfile;
  composites: Composite[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  nodeId?: string;
  bindingId?: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
