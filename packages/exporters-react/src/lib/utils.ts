import type { IRComponent } from '@rosettadash/core';

const DEFAULT_NAMES: Record<string, string> = {
  'visual.input.text': 'TextInput',
  'visual.input.select': 'SelectInput',
  'visual.input.number': 'NumberInput',
  'visual.input.checkbox': 'CheckboxInput',
  'visual.input.textarea': 'TextareaInput',
  'visual.input.date-range': 'DateRangeFilter',
  'domain.time-preset': 'TimePreset',
  'visual.table': 'DataTable',
  'visual.detail': 'DetailPanel',
  'visual.skeleton': 'LoadingSkeleton',
  'visual.kpi': 'KpiCard',
  'visual.chart.line': 'LineChart',
  'visual.chart.bar': 'BarChart',
  'visual.chart.pie': 'PieChart',
  'visual.display.3d-bar-chart': 'ThreeBarChart',
  'visual.display.3d-scatter': 'ThreeScatterPlot',
  'visual.display.3d-scene': 'ThreeScenePointCloud',
  'visual.display.3d-gltf-model': 'ThreeGltfModel',
  'visual.display.3d-geo-globe': 'ThreeGeoGlobe',
  'visual.svg.inline': 'SvgInline',
  'visual.svg.icon': 'SvgIcon',
  'infra.wasm.asset': 'WasmAsset',
  'visual.wasm.worker-host': 'WasmWorkerHost',
  'visual.wasm.module': 'WasmModule',
  'visual.wasm.media': 'WasmMedia',
  'visual.media.video-source': 'VideoSource',
  'visual.media.equirect-viewport': 'EquirectViewport',
  'visual.media.live-capture': 'LiveCapture',
  'logic.timer': 'Timer',
  'visual.news.language-select': 'NewsLanguageSelect',
  'visual.news.region-select': 'NewsRegionSelect',
  'visual.news.type-select': 'NewsTypeSelect',
  'visual.news.search-box': 'NewsSearchBox',
  'visual.news.results-table': 'NewsResultsTable',
  'visual.news.article-detail': 'NewsArticleDetail',
  'domain.role-gate': 'RoleGate',
  'layout.scroll-region': 'ScrollRegion',
};

export function pascalCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/** Root composed page name from composite title (preserves PascalCase like CustomObject). */
export function rootComponentName(compositeName: string): string {
  const trimmed = compositeName.trim() || 'Dashboard';
  if (/^[A-Z][A-Za-z0-9]*$/.test(trimmed)) {
    return trimmed;
  }
  let name = pascalCase(trimmed) || 'Dashboard';
  if (!/^[A-Za-z_]/.test(name)) {
    name = `Custom${name}`;
  }
  return name;
}

export function componentExportName(component: IRComponent, usedNames: Set<string>): string {
  const fromLabel = pascalCase(component.label);
  const base = fromLabel || DEFAULT_NAMES[component.type] || pascalCase(component.id);
  let candidate = base;
  let suffix = 2;

  while (usedNames.has(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

export function stateVarName(nodeId: string, portId: string): string {
  return `${nodeId}_${portId}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function setterName(stateVar: string): string {
  return `set${stateVar.charAt(0).toUpperCase()}${stateVar.slice(1)}`;
}

export function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function formatPropValue(value: unknown): string {
  if (typeof value === 'string') {
    return quote(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return 'undefined';
  }
  return JSON.stringify(value);
}

export function joinLines(lines: string[]): string {
  return `${lines.filter((line) => line !== undefined).join('\n')}\n`;
}

export function pascalFromId(id: string): string {
  return id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
