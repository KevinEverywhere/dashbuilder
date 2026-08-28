import { buildExportIR, defaultComponentRegistry } from '@rosettadash/core';
import { generateReactUiFiles } from './generate-react-ui';

describe('generateReactUiFiles', () => {
  const registry = defaultComponentRegistry;

  it('generates React files for a bound dashboard composite', () => {
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
        exportTargets: { ui: 'react', server: 'nest' },
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

    const files = generateReactUiFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'src/SalesDashboard.tsx',
        'src/types.ts',
        'src/styles/tokens.css',
        'README.export.md',
        expect.stringMatching(/^src\/components\/.*\.tsx$/),
        'src/hooks/usePg1Data.ts',
      ]),
    );

    const dashboard = files.find((file) => file.path === 'src/SalesDashboard.tsx');
    expect(dashboard?.content).toContain('Sales Dashboard');
    expect(dashboard?.content).toContain('usePg1Data');
    expect(dashboard?.content).toContain('dr1_range');
    expect(dashboard?.content).toContain('pg1_rowset ?? []');

    const hook = files.find((file) => file.path === 'src/hooks/usePg1Data.ts');
    expect(hook?.content).toContain("fetch('/api/sales')");

    expect(files.filter((file) => file.path.startsWith('src/components/'))).toHaveLength(3);
  });

  it('generates role auth stubs and role gate components when present', () => {
    const roleGate = registry.createNode('domain.role-gate', {
      id: 'rg1',
      properties: { roles: ['admin'] },
    });
    const kpi = registry.createNode('visual.kpi', { id: 'k1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Role Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [roleGate, kpi],
        bindings: [],
        domainContext: {
          roles: [
            { id: 'viewer', name: 'Viewer' },
            { id: 'admin', name: 'Admin' },
          ],
        },
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'src/auth/roles.ts',
        'src/auth/useCurrentRole.ts',
        expect.stringMatching(/^src\/components\/.*RoleGate.*\.tsx$/),
      ]),
    );

    const roleGateFile = files.find((file) => file.path.includes('RoleGate'));
    expect(roleGateFile?.content).toContain('useCurrentRole');
    expect(roleGateFile?.content).toContain('allowedRoles');
    expect(roleGateFile?.content).toContain('rd-role-gate');
    expect(roleGateFile?.content).toContain('hiddenStatusText');
    expect(roleGateFile?.content).not.toContain('return null;');
  });

  it('generates React files for P1 form input components', () => {
    const numberInput = registry.createNode('visual.input.number', { id: 'n1' });
    const checkbox = registry.createNode('visual.input.checkbox', {
      id: 'c1',
      properties: { label: 'Accept terms', defaultChecked: true },
    });
    const textarea = registry.createNode('visual.input.textarea', { id: 't1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Form Inputs',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [numberInput, checkbox, textarea],
        bindings: [],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const paths = files.map((file) => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^src\/components\/NumberInput\.tsx$/),
        expect.stringMatching(/^src\/components\/Checkbox\.tsx$/),
        expect.stringMatching(/^src\/components\/Textarea\.tsx$/),
      ]),
    );

    const numberFile = files.find((file) => file.path.endsWith('NumberInput.tsx'));
    expect(numberFile?.content).toContain('type="number"');

    const checkboxFile = files.find((file) => file.path.endsWith('Checkbox.tsx'));
    expect(checkboxFile?.content).toContain('type="checkbox"');

    const dashboard = files.find((file) => file.path === 'src/FormInputs.tsx');
    expect(dashboard?.content).toContain('Accept terms');

    const textareaFile = files.find((file) => file.path.endsWith('Textarea.tsx'));
    expect(textareaFile?.content).toContain('<textarea');
  });

  it('generates React pie chart component template', () => {
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
        exportTargets: { ui: 'react', server: 'nest' },
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

    const files = generateReactUiFiles(ir);
    const pieFile = files.find((file) => file.path.endsWith('PieChart.tsx'));
    expect(pieFile?.content).toContain('conic-gradient');
    expect(pieFile?.content).toContain('pie-chart--donut');
  });

  it('generates React table and detail panel with row selection wiring', () => {
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
        exportTargets: { ui: 'react', server: 'nest' },
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

    const files = generateReactUiFiles(ir);
    const detailFile = files.find((file) => file.path.endsWith('DetailPanel.tsx'));
    const tableFile = files.find((file) => file.path.endsWith('DataTable.tsx'));
    const dashboard = files.find((file) => file.path === 'src/CrudDashboard.tsx');

    expect(detailFile?.content).toContain('detail-panel__fields');
    expect(tableFile?.content).toContain('onSelectRow');
    expect(tableFile?.content).toContain('TABLE_NUMERIC_CELL_CLASS');
    expect(files.some((file) => file.path.endsWith('presentation/numeric-fields.ts'))).toBe(true);
    expect(dashboard?.content).toContain('t1_selected_row');
  });

  it('generates React time preset with table filter wiring', () => {
    const timePreset = registry.createNode('domain.time-preset', { id: 'tp1' });
    const table = registry.createNode('visual.table', { id: 't1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Preset Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [timePreset, table, postgres, server],
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
            sourceNodeId: 'tp1',
            sourcePortId: 'range',
            targetNodeId: 't1',
            targetPortId: 'filter',
          },
        ],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const presetFile = files.find((file) => file.path.includes('TimePreset'));
    const dashboard = files.find((file) => file.path === 'src/PresetDashboard.tsx');

    expect(presetFile?.content).toContain('time-preset__button');
    expect(dashboard?.content).toContain('tp1_range');
    expect(dashboard?.content).toContain('filter={tp1_range}');
  });

  it('generates React skeleton with checkbox loading wiring', () => {
    const checkbox = registry.createNode('visual.input.checkbox', {
      id: 'cb1',
      properties: { defaultChecked: true },
    });
    const skeleton = registry.createNode('visual.skeleton', {
      id: 'sk1',
      properties: { variant: 'table', lines: 3 },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Loading Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [checkbox, skeleton, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'cb1',
            sourcePortId: 'value',
            targetNodeId: 'sk1',
            targetPortId: 'loading',
          },
        ],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const skeletonFile = files.find((file) => file.path.includes('LoadingSkeleton'));
    const dashboard = files.find((file) => file.path === 'src/LoadingDashboard.tsx');

    expect(skeletonFile?.content).toContain('skeleton__line');
    expect(dashboard?.content).toContain('cb1_value');
    expect(dashboard?.content).toContain('loading={cb1_value}');
  });

  it('generates React timer component', () => {
    const timer = registry.createNode('logic.timer', {
      id: 'tm1',
      properties: { mode: 'interval', intervalMs: 2000 },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Timer Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [timer, server],
        bindings: [],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const timerFile = files.find((file) => file.path.includes('Timer.tsx'));
    expect(timerFile?.content).toContain('timer__value');
    expect(files.some((file) => file.path === 'src/TimerDashboard.tsx' && file.content.includes('Timer'))).toBe(
      true,
    );
  });

  it('generates React three.js bar chart stub', () => {
    const chart = registry.createNode('visual.display.3d-bar-chart', { id: 'b3d1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: '3D Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [chart, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 'b3d1',
            targetPortId: 'data',
          },
        ],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const chartFile = files.find((file) => file.content.includes('@react-three/fiber'));
    expect(chartFile?.content).toContain('OrbitControls');
    expect(chartFile?.path).toMatch(/BarChart\.tsx$/);
  });

  it('generates React three.js scatter plot stub', () => {
    const scatter = registry.createNode('visual.display.3d-scatter', { id: 's3d1' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: '3D Scatter Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [scatter, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 's3d1',
            targetPortId: 'data',
          },
        ],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const scatterFile = files.find((file) => file.content.includes('mapScatterPoints'));
    expect(scatterFile?.content).toContain('sphereGeometry');
    expect(scatterFile?.path).toMatch(/ScatterPlot\.tsx$/);
  });

  it('generates React three.js scene point cloud stub', () => {
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
        exportTargets: { ui: 'react', server: 'nest' },
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

    const files = generateReactUiFiles(ir);
    const sceneFile = files.find((file) => file.content.includes('showGrid'));
    expect(sceneFile?.content).toContain('mapScatterPoints');
    expect(sceneFile?.content).toContain('<Grid');
    expect(sceneFile?.path).toMatch(/3dScene\.tsx$/);
  });

  it('generates React three.js GLTF model stub', () => {
    const model = registry.createNode('visual.display.3d-gltf-model', { id: 'g3d1' });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'GLTF Dashboard',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [model, server],
        bindings: [],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const modelFile = files.find((file) => file.content.includes('useGLTF'));
    expect(modelFile?.content).toContain('GltfModel');
    expect(modelFile?.content).toContain('modelUrl');
  });

  it('generates React three.js geo globe stub', () => {
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
        exportTargets: { ui: 'react', server: 'nest' },
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

    const files = generateReactUiFiles(ir);
    const globeFile = files.find((file) => file.content.includes('mapGlobeMarkers'));
    expect(globeFile?.content).toContain('GeoGlobe');
    expect(globeFile?.content).toContain('latField');
  });

  it('generates React equirect media pipeline with ffmpeg filter helper', () => {
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
        exportTargets: { ui: 'react', server: 'nest' },
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

    const files = generateReactUiFiles(ir);
    expect(files.some((file) => file.path === 'src/media/equirect-filter.ts')).toBe(true);
    const filterFile = files.find((file) => file.path === 'src/media/equirect-filter.ts');
    expect(filterFile?.content).toContain('buildEquirectFlatCropFilter');
    const mediaFile = files.find((file) => file.content.includes('@ffmpeg/ffmpeg'));
    expect(mediaFile?.content).toContain('buildEquirectExtractFilter');
    expect(mediaFile?.content).toContain('runEquirectExtract');
    expect(files.find((file) => file.path === 'README.export.md')?.content).toContain('@ffmpeg/ffmpeg');
  });

  it('emits layout.scroll-region as a designated scroller wrapping dashboard content', () => {
    const scroll = registry.createNode('layout.scroll-region', {
      id: 'sr1',
      properties: { title: 'About Destination Atlas', maxHeight: '24rem', overlayScrollbar: true },
    });
    const kpi = registry.createNode('visual.kpi', { id: 'k1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Atlas About',
        version: 1,
        exportTargets: { ui: 'react' },
        nodes: [scroll, kpi],
        bindings: [],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const scrollFile = files.find((file) => file.path.includes('ScrollRegion') || file.content.includes('rd-scroll-region__body'));
    expect(scrollFile?.path).toMatch(/src\/components\/.*\.tsx$/);
    expect(scrollFile?.content).toContain('rd-scroll-region');
    expect(scrollFile?.content).not.toContain('@rosettadash/');

    const dashboard = files.find((file) => file.path === 'src/AtlasAbout.tsx');
    expect(dashboard?.content).toContain('maxHeight={"24rem"}');
    expect(dashboard?.content).toContain('About Destination Atlas');
    expect(dashboard?.content).toMatch(/<[^>]*ScrollRegion[\s\S]*KpiCard[\s\S]*<\/[^>]*ScrollRegion>/);
  });

  it('emits line and bar charts with rd-* BEM and img roles', () => {
    const line = registry.createNode('visual.chart.line', { id: 'c1' });
    const bar = registry.createNode('visual.chart.bar', { id: 'c2' });
    const postgres = registry.createNode('infra.postgresql', {
      id: 'pg1',
      properties: { connectionEnvKey: 'DATABASE_URL', table: 'sales' },
    });
    const server = registry.createNode('infra.server.nest', { id: 's1' });

    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Charts',
        version: 1,
        exportTargets: { ui: 'react', server: 'nest' },
        nodes: [line, bar, postgres, server],
        bindings: [
          {
            id: 'b1',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 'c1',
            targetPortId: 'data',
          },
          {
            id: 'b2',
            sourceNodeId: 'pg1',
            sourcePortId: 'rowset',
            targetNodeId: 'c2',
            targetPortId: 'data',
          },
        ],
      },
      registry,
    );

    const files = generateReactUiFiles(ir);
    const lineFile = files.find((file) => file.path.includes('LineChart') || file.content.includes('rd-chart-line__line'));
    const barFile = files.find((file) => file.content.includes('rd-chart-bar__bar'));
    expect(lineFile?.content).toContain('rd-chart-line');
    expect(lineFile?.content).toContain('role="img"');
    expect(barFile?.content).toContain('rd-chart-bar');
    expect(barFile?.content).toContain('role="img"');
  });

  it('rejects non-react UI targets', () => {
    const ir = buildExportIR(
      {
        id: 'comp1',
        name: 'Angular only',
        version: 1,
        exportTargets: { ui: 'angular', server: 'nest' },
        nodes: [registry.createNode('visual.kpi', { id: 'k1' })],
        bindings: [],
      },
      registry,
    );

    expect(() => generateReactUiFiles(ir)).toThrow(/cannot generate UI target "angular"/);
  });
});
