import type { ExportIR, IRComponent } from '@rosettadash/core';
import { generateNumericFieldsRuntimeFile, irUsesNumericPresentation, numericPresentationCssLines } from '@rosettadash/core';
import { collectExportRoleIds, irHasRoleGates } from '@rosettadash/core';
import { buildDashboardContext } from './binding-resolver';
import { generateComponentFile, generateScrollRegion } from './component-templates';
import { generateEquirectFilterHelperFile } from './media-component-templates';
import type { GeneratedFile, ReactExportOptions } from './types';
import { ReactExportError } from './types';
import { componentExportName, joinLines, pascalFromId, rootComponentName } from './utils';

interface ScrollRegionExport {
  exportName: string;
  title: string;
  maxHeight: string;
  overlayScrollbar: boolean;
}

export function generateReactUiFiles(
  ir: ExportIR,
  options: ReactExportOptions = {},
): GeneratedFile[] {
  if (ir.targets.ui !== 'react') {
    throw new ReactExportError(`React exporter cannot generate UI target "${ir.targets.ui}"`);
  }

  const root = options.rootDir ?? 'src';
  const usedNames = new Set<string>();
  const exportNames = new Map<string, string>();

  for (const component of ir.components) {
    exportNames.set(component.id, componentExportName(component, usedNames));
  }

  for (const source of ir.dataSources) {
    exportNames.set(source.id, pascalFromId(source.id));
  }

  const files: GeneratedFile[] = [];
  const componentImports: string[] = [];

  for (const component of ir.components) {
    const exportName = exportNames.get(component.id);
    if (!exportName) {
      continue;
    }
    componentImports.push(exportName);
    files.push({
      path: `${root}/components/${exportName}.tsx`,
      content: generateComponentFile(component, exportName),
      encoding: 'utf-8',
      description: `React component for ${component.label}`,
    });
  }

  const scrollRegions: ScrollRegionExport[] = [];
  for (const layout of ir.layouts) {
    if (layout.type !== 'layout.scroll-region') {
      continue;
    }
    const layoutAsComponent: IRComponent = {
      id: layout.id,
      type: layout.type,
      label: layout.label,
      category: 'layout',
      properties: { ...layout.properties },
      inputs: [],
      outputs: [],
    };
    const exportName = componentExportName(layoutAsComponent, usedNames);
    componentImports.push(exportName);
    scrollRegions.push({
      exportName,
      title: typeof layout.properties['title'] === 'string' ? layout.properties['title'] : '',
      maxHeight:
        typeof layout.properties['maxHeight'] === 'string' ? layout.properties['maxHeight'] : '28rem',
      overlayScrollbar: layout.properties['overlayScrollbar'] !== false,
    });
    files.push({
      path: `${root}/components/${exportName}.tsx`,
      content: generateScrollRegion(exportName),
      encoding: 'utf-8',
      description: `Scroll region layout for ${layout.label}`,
    });
  }

  files.push({
    path: `${root}/types.ts`,
    content: generateTypesFile(),
    encoding: 'utf-8',
    description: 'Shared dashboard types',
  });

  if (irUsesNumericPresentation(ir.components)) {
    files.push({
      path: `${root}/presentation/numeric-fields.ts`,
      content: generateNumericFieldsRuntimeFile(),
      encoding: 'utf-8',
      description: 'Numeric column and detail field alignment helpers',
    });
  }

  files.push({
    path: `${root}/styles/tokens.css`,
    content: generateTokensCss(ir),
    encoding: 'utf-8',
    description: 'Neutral style tokens for exported dashboard',
  });

  for (const source of ir.dataSources.filter((entry) => entry.type === 'infra.postgresql')) {
    const hookName = `use${exportNames.get(source.id) ?? pascalFromId(source.id)}Data`;
    const route = ir.routes.find((entry) => entry.method === 'GET')?.path ?? '/api/records';
    files.push({
      path: `${root}/hooks/${hookName}.ts`,
      content: generateDataHook(hookName, route),
      encoding: 'utf-8',
      description: `Data hook for ${source.label}`,
    });
  }

  if (irHasEquirectMediaPipeline(ir)) {
    files.push({
      path: `${root}/media/equirect-filter.ts`,
      content: generateEquirectFilterHelperFile(),
      encoding: 'utf-8',
      description: 'ffmpeg filter helpers for equirect subsection export',
    });
  }

  if (irHasRoleGates(ir) || (ir.domain?.roles?.length ?? 0) > 0) {
    files.push(
      {
        path: `${root}/auth/roles.ts`,
        content: generateRolesFile(ir),
        encoding: 'utf-8',
        description: 'Domain role definitions for exported dashboard',
      },
      {
        path: `${root}/auth/useCurrentRole.ts`,
        content: generateUseCurrentRoleFile(collectExportRoleIds(ir)),
        encoding: 'utf-8',
        description: 'Stub hook for resolving the active user role',
      },
    );
  }

  const rootName = rootComponentName(ir.meta.compositeName);

  files.push({
    path: `${root}/${rootName}.tsx`,
    content: generateDashboardFile(ir, exportNames, componentImports, rootName, scrollRegions),
    encoding: 'utf-8',
    description: `Composed ${rootName} page wired from ExportIR bindings`,
  });

  files.push({
    path: 'README.export.md',
    content: generateReadme(ir, rootName),
    encoding: 'utf-8',
    description: 'Setup notes for exported React UI fragment',
  });

  return files;
}

function generateTypesFile(): string {
  return joinLines([
    `export interface DateRange {`,
    `  start: string;`,
    `  end: string;`,
    `}`,
    ``,
    `export type Row = Record<string, string | number | boolean | null | undefined>;`,
    ``,
    `export type RoleId = string;`,
    ``,
  ]);
}

function generateRolesFile(ir: ExportIR): string {
  const roleIds = collectExportRoleIds(ir);
  const domainRoles = ir.domain?.roles ?? [];
  const entries =
    domainRoles.length > 0
      ? domainRoles.map((role) => `  { id: '${role.id}', name: '${role.name.replace(/'/g, "\\'")}' },`)
      : roleIds.map((roleId) => `  '${roleId}',`);

  if (domainRoles.length > 0) {
    return joinLines([
      `export interface DomainRole {`,
      `  id: string;`,
      `  name: string;`,
      `}`,
      ``,
      `export const DOMAIN_ROLES: DomainRole[] = [`,
      ...entries,
      `];`,
      ``,
    ]);
  }

  return joinLines([
    `export const DOMAIN_ROLES = [`,
    ...entries,
    `] as const;`,
    ``,
    `export type DomainRole = (typeof DOMAIN_ROLES)[number];`,
    ``,
  ]);
}

function generateUseCurrentRoleFile(roleIds: string[]): string {
  const fallback = roleIds[0] ?? 'viewer';
  return joinLines([
    `'use client';`,
    ``,
    `import { useMemo } from 'react';`,
    ``,
    `const FALLBACK_ROLE = '${fallback}';`,
    ``,
    `export function useCurrentRole(): string {`,
    `  return useMemo(() => {`,
    `    if (typeof window === 'undefined') {`,
    `      return process.env.NEXT_PUBLIC_ROSETTADASH_ROLE ?? FALLBACK_ROLE;`,
    `    }`,
    `    return (`,
    `      window.localStorage.getItem('rosettadash.role') ??`,
    `      process.env.NEXT_PUBLIC_ROSETTADASH_ROLE ??`,
    `      FALLBACK_ROLE`,
    `    );`,
    `  }, []);`,
    `}`,
    ``,
  ]);
}

function generateTokensCss(ir: ExportIR): string {
  return joinLines([
    `:root {`,
    `  --db-surface: #ffffff;`,
    `  --db-border: #d9dee7;`,
    `  --db-text: #1f2937;`,
    `  --db-accent: #2563eb;`,
    `  --db-muted: #6b7280;`,
    `}`,
    ``,
    `.dashboard {`,
    `  display: grid;`,
    `  gap: 1rem;`,
    `  padding: 1.5rem;`,
    `  color: var(--db-text);`,
    `  background: var(--db-surface);`,
    `}`,
    ``,
    `.field, .input, .select, .table, .kpi-card, .chart-card, .rd-chart-line, .rd-chart-bar {`,
    `  border: 1px solid var(--db-border);`,
    `  border-radius: 0.5rem;`,
    `}`,
    ``,
    `.table { width: 100%; border-collapse: collapse; }`,
    `.table th, .table td { padding: 0.5rem 0.75rem; text-align: left; }`,
    ...numericPresentationCssLines(),
    `.rd-chart-line, .rd-chart-bar, .kpi-card, .chart-card, .table-card { padding: 1rem; }`,
    `.rd-chart-line__header, .rd-chart-bar__header { margin: 0 0 0.5rem; font-weight: 600; }`,
    `.rd-chart-bar__bars { display: flex; align-items: flex-end; gap: 0.25rem; height: 8rem; }`,
    `.rd-chart-bar__bar-wrap { flex: 1; display: flex; align-items: flex-end; min-height: 0.25rem; }`,
    `.rd-chart-bar__bar { width: 100%; background: var(--db-accent); min-height: 0.25rem; }`,
    `.pie-chart { width: 8rem; height: 8rem; margin: 0 auto; border-radius: 999px; border: 1px solid var(--db-border); }`,
    `.pie-chart--donut { mask: radial-gradient(circle, transparent 42%, #000 43%); }`,
    `.pie-chart__legend { list-style: none; margin: 0.75rem 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.75rem; }`,
    `.pie-chart__legend li { display: inline-flex; align-items: center; gap: 0.25rem; }`,
    `.pie-chart__legend span { width: 0.625rem; height: 0.625rem; border-radius: 999px; }`,
    `.table-row { cursor: pointer; }`,
    `.table-row--selected { background: color-mix(in srgb, var(--db-accent) 12%, transparent); }`,
    `.detail-panel, .detail-panel__fields { margin: 0; }`,
    `.detail-panel { padding: 1rem; }`,
    `.detail-panel__fields { display: grid; gap: 0.5rem; }`,
    `.detail-panel__field { display: grid; grid-template-columns: minmax(5rem, 30%) 1fr; gap: 0.5rem; font-size: 0.875rem; }`,
    `.detail-panel__field dt { font-weight: 600; color: var(--db-muted); text-transform: capitalize; }`,
    `.detail-panel__empty { margin: 0; color: var(--db-muted); font-size: 0.875rem; }`,
    `.time-preset { display: flex; flex-direction: column; gap: 0.5rem; }`,
    `.time-preset__buttons { display: flex; flex-wrap: wrap; gap: 0.375rem; }`,
    `.time-preset__button { padding: 0.375rem 0.625rem; border: 1px solid var(--db-border); border-radius: 999px; background: #fff; font: inherit; font-size: 0.75rem; cursor: pointer; }`,
    `.time-preset__button--active { border-color: var(--db-accent); background: color-mix(in srgb, var(--db-accent) 12%, transparent); color: var(--db-accent); font-weight: 600; }`,
    `.skeleton { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; border: 1px solid var(--db-border); border-radius: 0.5rem; }`,
    `.skeleton__chart-block { height: 8rem; border-radius: 0.375rem; background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%); background-size: 200% 100%; animation: skeleton-shimmer 1.4s ease-in-out infinite; }`,
    `.skeleton__legend { display: flex; flex-wrap: wrap; gap: 0.375rem; }`,
    `.skeleton__line { display: block; height: 0.75rem; border-radius: 999px; background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%); background-size: 200% 100%; animation: skeleton-shimmer 1.4s ease-in-out infinite; }`,
    `.skeleton__line--short { width: 4rem; }`,
    `.skeleton__line--title { width: 40%; }`,
    `.skeleton__line--value { height: 1.75rem; width: 55%; }`,
    `@keyframes skeleton-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`,
    `.timer { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; border: 1px solid var(--db-border); border-radius: 0.5rem; }`,
    `.timer__header { display: flex; align-items: center; gap: 0.5rem; }`,
    `.timer__mode { font-size: 0.75rem; color: var(--db-muted); text-transform: capitalize; }`,
    `.timer__value { margin: 0; font-size: 1.125rem; font-weight: 600; font-variant-numeric: tabular-nums; }`,
    `.rd-role-gate { padding: 1rem; border: 1px dashed var(--db-border); border-radius: 0.5rem; }`,
    `.rd-role-gate--hidden { border-style: solid; }`,
    `.rd-role-gate__status { margin: 0.35rem 0 0.5rem; font-size: 0.8125rem; font-weight: 600; }`,
    `.rd-role-gate__status--hidden { color: var(--db-muted); }`,
    `.rd-scroll-region { display: flex; flex-direction: column; min-height: 0; border: 1px solid var(--db-border); border-radius: 0.5rem; }`,
    `.rd-scroll-region__header { flex: 0 0 auto; padding: 0.75rem 1rem 0.35rem; font-weight: 600; }`,
    `.rd-scroll-region__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 0.75rem 1rem 1rem; }`,
    `.rd-scroll-region--overlay-scrollbar .rd-scroll-region__body { scrollbar-width: thin; }`,
    `/* styling: ${ir.styles.framework} · generated for ${ir.meta.compositeName} */`,
    ``,
  ]);
}

function generateDataHook(hookName: string, route: string): string {
  return joinLines([
    `'use client';`,
    ``,
    `import { useEffect, useState } from 'react';`,
    `import type { Row } from '../types';`,
    ``,
    `export function ${hookName}() {`,
    `  const [data, setData] = useState<Row[] | undefined>();`,
    `  const [loading, setLoading] = useState(true);`,
    `  const [error, setError] = useState<Error | undefined>();`,
    ``,
    `  useEffect(() => {`,
    `    let cancelled = false;`,
    ``,
    `    fetch('${route}')`,
    `      .then(async (response) => {`,
    `        if (!response.ok) {`,
    `          throw new Error(\`Request failed: \${response.status}\`);`,
    `        }`,
    `        return response.json() as Promise<Row[]>;`,
    `      })`,
    `      .then((rows) => {`,
    `        if (!cancelled) {`,
    `          setData(rows);`,
    `        }`,
    `      })`,
    `      .catch((nextError: Error) => {`,
    `        if (!cancelled) {`,
    `          setError(nextError);`,
    `        }`,
    `      })`,
    `      .finally(() => {`,
    `        if (!cancelled) {`,
    `          setLoading(false);`,
    `        }`,
    `      });`,
    ``,
    `    return () => {`,
    `      cancelled = true;`,
    `    };`,
    `  }, []);`,
    ``,
    `  return { data, loading, error };`,
    `}`,
    ``,
  ]);
}

function generateDashboardFile(
  ir: ExportIR,
  exportNames: Map<string, string>,
  componentImports: string[],
  rootName: string,
  scrollRegions: ScrollRegionExport[],
): string {
  const context = buildDashboardContext(ir, exportNames);
  const hookImportLines = context.hookImports.map(
    (hook) => `import { ${hook} } from './hooks/${hook}';`,
  );
  const componentImportLines = componentImports.map(
    (name) => `import { ${name} } from './components/${name}';`,
  );

  const renderLines = context.components.map((component) => {
    const propLines = Object.entries(component.props).map(([key, value]) => `        ${key}={${value}}`);
    return [`      <${component.exportName}`, ...propLines, `      />`].join('\n');
  });

  const scrollRegion = scrollRegions[0];
  const bodyLines = scrollRegion
    ? [
        `      <${scrollRegion.exportName}`,
        `        title={${JSON.stringify(scrollRegion.title)}}`,
        `        maxHeight={${JSON.stringify(scrollRegion.maxHeight)}}`,
        `        overlayScrollbar={${scrollRegion.overlayScrollbar}}`,
        `      >`,
        ...renderLines.map((line) =>
          line
            .split('\n')
            .map((part) => `  ${part}`)
            .join('\n'),
        ),
        `      </${scrollRegion.exportName}>`,
      ]
    : renderLines;

  return joinLines([
    `'use client';`,
    ``,
    `import { useState } from 'react';`,
    `import './styles/tokens.css';`,
    `import type { DateRange } from './types';`,
    ...componentImportLines,
    ...hookImportLines,
    ``,
    `export default function ${rootName}() {`,
    ...context.stateDeclarations,
    ...context.hookCalls,
    ``,
    `  return (`,
    `    <main className="dashboard">`,
    `      <header>`,
    `        <h1>${ir.meta.compositeName}</h1>`,
    `      </header>`,
    ...bodyLines,
    `    </main>`,
    `  );`,
    `}`,
    ``,
  ]);
}

function generateReadme(ir: ExportIR, rootName: string): string {
  const envLines =
    ir.envVars.length === 0
      ? ['No environment variables required for the UI fragment.']
      : ir.envVars.map((env) => `- \`${env.key}\`${env.required ? ' (required)' : ''}`);

  return joinLines([
    `# ${ir.meta.compositeName} — React UI Export`,
    ``,
    `Generated at ${ir.meta.generatedAt} from composite \`${ir.meta.compositeId}\` v${ir.meta.version}.`,
    ``,
    `## Files`,
    ``,
    `- \`src/${rootName}.tsx\` — composed page wired from builder bindings`,
    `- \`src/components/*.tsx\` — P0 visual components`,
    `- \`src/hooks/*.ts\` — data hooks targeting exported API routes`,
    `- \`src/auth/*.ts\` — role definitions and current-role stub (when role gates exist)`,
    `- \`src/styles/tokens.css\` — neutral dashboard styling`,
    ``,
    `## Environment`,
    ``,
    ...envLines,
    ``,
    `## Next steps`,
    ``,
    `1. Copy the generated \`src/\` folder into your React or Next.js app.`,
    `2. Import and mount: \`import ${rootName} from './src/${rootName}'\`.`,
    `3. Ensure server routes referenced by data hooks are available.`,
    irHasEquirectMediaPipeline(ir)
      ? `4. Install ffmpeg.wasm for media pipelines: \`npm install @ffmpeg/ffmpeg @ffmpeg/util\`.`
      : '',
    ``,
  ].filter(Boolean));
}

const EQUIRECT_MEDIA_TYPES = new Set([
  'visual.media.video-source',
  'visual.media.equirect-viewport',
  'visual.media.live-capture',
  'visual.wasm.media',
]);

function irHasEquirectMediaPipeline(ir: ExportIR): boolean {
  return ir.components.some((component) => EQUIRECT_MEDIA_TYPES.has(component.type));
}
