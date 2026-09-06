import { buildExportIR, defaultComponentRegistry } from '@rosettadash/core';
import { generateSvelteUiFiles } from './generate-svelte-ui';

describe('generateSvelteUiFiles', () => {
  const registry = defaultComponentRegistry;

  it('generates Svelte files for a bound dashboard composite', () => {
    const dateRange = registry.createNode('visual.input.date-range', { id: 'dr1' });
    const table = registry.createNode('visual.table', { id: 't1' });
    const chart = registry.createNode('visual.chart.line', { id: 'c1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Sales Dashboard',
        version: 2,
        exportTargets: { ui: 'svelte', server: 'nest' },
        nodes: [dateRange, table, chart, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 't1',
            targetPortId: 'data',
          },
          {
            id: 'b2',
            sourceNodeId: 'dr1',
            sourcePortId: 'range',
            targetNodeId: 't1',
            targetPortId: 'filter',
          },
          {
            id: 'b3',
            sourceNodeId: 'dr1',
            sourcePortId: 'range',
            targetNodeId: 'c1',
            targetPortId: 'range',
          },
          {
            id: 'b4',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 'c1',
            targetPortId: 'data',
          },
        ],
      },
      registry,
      { generatedAt: '2026-08-08T00:00:00.000Z' },
    );

    const files = generateSvelteUiFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'src/Dashboard.svelte',
        'src/types.ts',
        'src/styles/tokens.css',
        'README.export.md',
        expect.stringMatching(/^src\/components\/.*\.svelte$/),
        'src/lib/data/usePg1Data.svelte.ts',
      ]),
    );

    const dashboard = files.find((file) => file.path === 'src/Dashboard.svelte');
    expect(dashboard?.content).toContain('Sales Dashboard');
    expect(dashboard?.content).toContain('usePg1Data');
    expect(dashboard?.content).toContain('dr1_range');
    expect(dashboard?.content).toContain('pg1Data.data ?? []');

    const dataModule = files.find((file) => file.path === 'src/lib/data/usePg1Data.svelte.ts');
    expect(dataModule?.content).toContain("fetch('/api/sales')");
    expect(dataModule?.content).toContain('$effect');

    const dateRangeComponent = files.find((file) => file.path.includes('DateRange'));
    expect(dateRangeComponent?.content).toContain('$bindable');

    const tableComponent = files.find((file) => file.path.includes('DataTable'));
    expect(tableComponent?.content).toContain('$derived');

    const chartComponent = files.find((file) => file.path.includes('LineChart'));
    expect(chartComponent?.content).toContain('polyline');

    expect(files.filter((file) => file.path.startsWith('src/components/'))).toHaveLength(3);
  });

  it('generates Svelte pie chart component template', () => {
    const pie = registry.createNode('visual.chart.pie', {
      id: 'p1',
      properties: { title: 'Breakdown', donut: true },
    });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Pie Dashboard',
        version: 1,
        exportTargets: { ui: 'svelte', server: 'nest' },
        nodes: [pie, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 'p1',
            targetPortId: 'data',
          },
        ],
      },
      registry,
    );

    const files = generateSvelteUiFiles(ir);
    const pieFile = files.find((file) => file.path.includes('PieChart'));
    expect(pieFile?.content).toContain('conic-gradient');
    expect(pieFile?.content).toContain('pie-chart--donut');
  });

  it('generates Svelte table and detail panel with row selection wiring', () => {
    const table = registry.createNode('visual.table', { id: 't1' });
    const detail = registry.createNode('visual.detail', { id: 'd1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'CRUD Dashboard',
        version: 1,
        exportTargets: { ui: 'svelte', server: 'nest' },
        nodes: [table, detail, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 't1',
            targetPortId: 'data',
          },
          {
            id: 'b2',
            sourceNodeId: 't1',
            sourcePortId: 'selected-row',
            targetNodeId: 'd1',
            targetPortId: 'row',
          },
        ],
      },
      registry,
    );

    const files = generateSvelteUiFiles(ir);
    const detailFile = files.find((file) => file.path.includes('DetailPanel'));
    const tableFile = files.find((file) => file.path.includes('DataTable'));
    const dashboard = files.find((file) => file.path === 'src/Dashboard.svelte');

    expect(detailFile?.content).toContain('detail-panel__fields');
    expect(tableFile?.content).toContain('onSelectRow');
    expect(dashboard?.content).toContain('t1_selected_row');
  });

  it('generates Svelte three.js scene point cloud stub', () => {
    const scene = registry.createNode('visual.display.3d-scene', { id: 'sc3d1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: '3D Scene Dashboard',
        version: 1,
        exportTargets: { ui: 'svelte', server: 'nest' },
        nodes: [scene, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 'sc3d1',
            targetPortId: 'data',
          },
        ],
      },
      registry,
    );

    const files = generateSvelteUiFiles(ir);
    const sceneFile = files.find((file) => file.content.includes('@threlte/core'));
    expect(sceneFile?.content).toContain('mapScatterPoints');
    expect(sceneFile?.content).toContain('<Grid');
  });

  it('generates Svelte three.js GLTF model stub', () => {
    const model = registry.createNode('visual.display.3d-gltf-model', { id: 'g3d1' });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'GLTF Dashboard',
        version: 1,
        exportTargets: { ui: 'svelte', server: 'nest' },
        nodes: [model, server],
        bindings: [],
      },
      registry,
    );

    const files = generateSvelteUiFiles(ir);
    const modelFile = files.find((file) => file.content.includes('<GLTF'));
    expect(modelFile?.content).toContain('modelUrl');
  });

  it('generates Svelte three.js geo globe stub', () => {
    const globe = registry.createNode('visual.display.3d-geo-globe', { id: 'globe1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'locations' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Globe Dashboard',
        version: 1,
        exportTargets: { ui: 'svelte', server: 'nest' },
        nodes: [globe, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 'globe1',
            targetPortId: 'data',
          },
        ],
      },
      registry,
    );

    const files = generateSvelteUiFiles(ir);
    const globeFile = files.find((file) => file.content.includes('mapGlobeMarkers'));
    expect(globeFile?.content).toContain('useTexture');
    expect(globeFile?.content).toContain('latField');
  });

  it('generates Svelte SVG icon and WASM media stubs', () => {
    const icon = registry.createNode('visual.svg.icon', { id: 'svg1' });
    const media = registry.createNode('visual.wasm.media', { id: 'wm1' });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'SVG WASM Dashboard',
        version: 1,
        exportTargets: { ui: 'svelte', server: 'nest' },
        nodes: [icon, media, server],
        bindings: [],
      },
      registry,
    );

    const files = generateSvelteUiFiles(ir);
    expect(files.some((file) => file.content.includes('{@html markup}'))).toBe(true);
    expect(files.some((file) => file.content.includes('wasm-media'))).toBe(true);
  });

  it('generates Svelte equirect media pipeline with ffmpeg filter helper', () => {
    const video = registry.createNode('visual.media.video-source', { id: 'vs1' });
    const viewport = registry.createNode('visual.media.equirect-viewport', { id: 'ev1' });
    const media = registry.createNode('visual.wasm.media', {
      id: 'wm1',
      properties: { operation: 'equirect-extract', extractionMode: 'flat-crop' },
    });
    const asset = registry.createNode('infra.wasm.asset', { id: 'wa1' });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Equirect Export',
        version: 1,
        exportTargets: { ui: 'svelte', server: 'nest' },
        nodes: [video, viewport, media, asset, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'ev1',
            sourcePortId: 'crop-region',
            targetNodeId: 'wm1',
            targetPortId: 'crop-region',
          },
          {
            id: 'b2',
            sourceNodeId: 'vs1',
            sourcePortId: 'video-file',
            targetNodeId: 'wm1',
            targetPortId: 'input-file',
          },
        ],
      },
      registry,
    );

    const files = generateSvelteUiFiles(ir);
    expect(files.some((file) => file.path === 'src/media/equirect-filter.ts')).toBe(true);
    const filterFile = files.find((file) => file.path === 'src/media/equirect-filter.ts');
    expect(filterFile?.content).toContain('buildEquirectFlatCropFilter');
    const mediaFile = files.find((file) => file.content.includes('@ffmpeg/ffmpeg'));
    expect(mediaFile?.content).toContain('buildEquirectExtractFilter');
    expect(mediaFile?.content).toContain('runEquirectExtract');
    expect(files.find((file) => file.path === 'README.export.md')?.content).toContain('@ffmpeg/ffmpeg');
  });

  it('rejects non-svelte UI targets', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'React only',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [registry.createNode('visual.kpi', { id: 'k1' })],
        bindings: [],
      },
      registry,
    );

    expect(() => generateSvelteUiFiles(ir)).toThrow(/cannot generate UI target "react"/);
  });
});
