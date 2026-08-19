import { defaultComponentRegistry } from '@rosettadash/core';
import {
  CANVAS_GRID_SIZE,
  clampCanvasNodeWidth,
  snapToCanvasGrid,
} from './canvas/canvas-layout';
import { BuilderStateService } from './builder-state.service';

describe('BuilderStateService', () => {
  let service: BuilderStateService;

  beforeEach(() => {
    service = new BuilderStateService();
  });

  it('adds nodes from the registry', () => {
    const definition = defaultComponentRegistry.getOrThrow('visual.input.text');
    const node = service.addNodeFromDefinition(definition);

    expect(service.nodes()).toHaveLength(1);
    expect(service.selectedNode()?.id).toBe(node.id);
    expect(service.dirty()).toBe(true);
  });

  it('updates node properties', () => {
    const definition = defaultComponentRegistry.getOrThrow('visual.kpi');
    const node = service.addNodeFromDefinition(definition);

    service.updateNodeProperty(node.id, 'title', 'Revenue');
    expect(service.selectedNode()?.properties['title']).toBe('Revenue');
  });

  it('renames a node label, trims it, and rejects empty/unchanged values', () => {
    const definition = defaultComponentRegistry.getOrThrow('visual.kpi');
    const node = service.addNodeFromDefinition(definition);
    const originalLabel = node.label;

    service.updateNodeLabel(node.id, '  Monthly Revenue  ');
    expect(service.selectedNode()?.label).toBe('Monthly Revenue');

    service.updateNodeLabel(node.id, '   ');
    expect(service.selectedNode()?.label).toBe('Monthly Revenue');

    service.updateNodeLabel(node.id, originalLabel);
    expect(service.selectedNode()?.label).toBe(originalLabel);
  });

  it('supports undo/redo for a node rename', () => {
    const definition = defaultComponentRegistry.getOrThrow('visual.kpi');
    const node = service.addNodeFromDefinition(definition);
    const originalLabel = node.label;

    service.updateNodeLabel(node.id, 'Renamed KPI');
    expect(service.selectedNode()?.label).toBe('Renamed KPI');
    expect(service.canUndo()).toBe(true);

    service.undo();
    expect(service.nodes().find((item) => item.id === node.id)?.label).toBe(originalLabel);

    service.redo();
    expect(service.nodes().find((item) => item.id === node.id)?.label).toBe('Renamed KPI');
  });

  it('builds composite payload from current nodes and bindings', () => {
    service.setProjectContext(
      {
        id: 'p1',
        name: 'Test',
        composites: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'c1',
        name: 'Main',
        nodes: [],
        bindings: [],
        version: 1,
      },
    );

    const definition = defaultComponentRegistry.getOrThrow('visual.input.text');
    service.addNodeFromDefinition(definition);

    const payload = service.buildCompositePayload();
    expect(payload.nodes).toHaveLength(1);
    expect(payload.bindings).toEqual([]);
    expect(payload.version).toBe(1);
  });

  it('creates compatible bindings and replaces existing target bindings', () => {
    const firstDateRange = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.date-range'),
    );
    const secondDateRange = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.date-range'),
    );
    const chart = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.chart.line'),
    );

    const first = service.createBinding(firstDateRange.id, 'range', chart.id, 'range');
    expect(first.ok).toBe(true);
    expect(service.bindings()).toHaveLength(1);

    const second = service.createBinding(
      secondDateRange.id,
      'range',
      chart.id,
      'range',
    );
    expect(second.ok).toBe(true);
    expect(service.bindings()).toHaveLength(1);
    expect(service.bindings()[0]?.sourceNodeId).toBe(secondDateRange.id);
  });

  it('rejects incompatible bindings', () => {
    const text = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.text'),
    );
    const chart = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.chart.line'),
    );

    const result = service.createBinding(text.id, 'value', chart.id, 'data');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Incompatible types');
    }
    expect(service.bindings()).toHaveLength(0);
  });

  it('filters preview nodes to visual components only', () => {
    service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.text'),
    );
    service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('infra.postgresql'),
    );

    expect(service.previewNodes()).toHaveLength(1);
    expect(service.previewNodes()[0]?.type).toBe('visual.input.text');
  });

  it('switches workspace mode and clears pending bindings', () => {
    const dateRange = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.date-range'),
    );
    service.beginBindingFrom(dateRange.id, 'range');
    expect(service.pendingBindingSource()).not.toBeNull();

    service.setWorkspaceMode('preview');
    expect(service.workspaceMode()).toBe('preview');
    expect(service.pendingBindingSource()).toBeNull();
  });

  it('supports additive multi-select and clears on clearSelection', () => {
    const first = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.text'),
    );
    const second = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.kpi'),
    );

    service.selectNode(first.id);
    service.selectNode(second.id, { additive: true });

    expect(service.selectedNodeIds()).toEqual([first.id, second.id]);
    expect(service.isNodeSelected(first.id)).toBe(true);
    expect(service.isNodeSelected(second.id)).toBe(true);

    service.selectNode(first.id, { additive: true });
    expect(service.selectedNodeIds()).toEqual([second.id]);

    service.clearSelection();
    expect(service.selectedNodeIds()).toEqual([]);
  });

  it('snaps node layout updates to the canvas grid', () => {
    const node = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.kpi'),
    );

    service.updateNodeLayout(node.id, { x: 27, y: 35, width: 210, height: 90 });
    const updated = service.nodes().find((entry) => entry.id === node.id);

    expect(updated?.layout?.x).toBe(32);
    expect(updated?.layout?.y).toBe(32);
    expect(updated?.layout?.width).toBe(208);
    expect(updated?.layout?.height).toBe(96);
  });

  it('snaps values to the canvas grid helpers', () => {
    expect(snapToCanvasGrid(7)).toBe(0);
    expect(snapToCanvasGrid(8)).toBe(16);
    expect(snapToCanvasGrid(25, CANVAS_GRID_SIZE)).toBe(32);
    expect(clampCanvasNodeWidth(80)).toBe(160);
  });

  it('removes bindings when a node is deleted', () => {
    const dateRange = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.date-range'),
    );
    const chart = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.chart.line'),
    );

    service.createBinding(dateRange.id, 'range', chart.id, 'range');
    service.removeNode(dateRange.id);

    expect(service.bindings()).toHaveLength(0);
    expect(service.nodes()).toHaveLength(1);
  });

  it('shows a placement prompt when adding a grouped component', () => {
    const table = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.table'),
    );

    const prompt = service.placementPrompt();
    expect(prompt?.sourceNodeId).toBe(table.id);
    expect(prompt?.companions.some((entry) => entry.type === 'visual.input.date-range')).toBe(true);
  });

  it('adds a companion from the placement prompt near the source node', () => {
    const table = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.table'),
    );

    const companion = service.addCompanionFromPrompt('visual.input.date-range');
    expect(companion).not.toBeNull();
    expect(service.nodes()).toHaveLength(2);

    const dateRange = service.nodes().find((node) => node.type === 'visual.input.date-range');
    const tableNode = service.nodes().find((node) => node.id === table.id);
    expect(dateRange?.layout?.y).toBeLessThan(tableNode?.layout?.y ?? 0);
  });

  it('stores defaults-engine suggestions when a table is added', () => {
    const table = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.table'),
    );

    expect(service.suggestionsForNode(table.id).some((s) => s.id === `bind-required:${table.id}:data`)).toBe(
      true,
    );
  });

  it('applies patch suggestions and marks the node as defaults-engine suggested', () => {
    const postgres = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('infra.postgresql'),
    );

    const suggestion = service
      .suggestionsForNode(postgres.id)
      .find((entry) => entry.id === `postgres-table:${postgres.id}`);
    expect(suggestion).toBeDefined();
    if (!suggestion) {
      return;
    }

    service.applySuggestion(suggestion.id);

    expect(service.selectedNode()?.properties['table']).toBe('records');
    expect(service.selectedNode()?.meta?.suggestedBy).toBe('defaults-engine');
    expect(
      service.suggestionsForNode(postgres.id).some((entry) => entry.id === `postgres-table:${postgres.id}`),
    ).toBe(false);
  });

  it('supports undo and redo for node additions', () => {
    const definition = defaultComponentRegistry.getOrThrow('visual.input.text');
    service.addNodeFromDefinition(definition);
    expect(service.nodes()).toHaveLength(1);
    expect(service.canUndo()).toBe(true);
    expect(service.canRedo()).toBe(false);

    service.undo();
    expect(service.nodes()).toHaveLength(0);
    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(true);

    service.redo();
    expect(service.nodes()).toHaveLength(1);
    expect(service.canRedo()).toBe(false);
  });

  it('clears history when a saved composite is applied', () => {
    service.setProjectContext(
      {
        id: 'p1',
        name: 'Test',
        composites: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'c1',
        name: 'Main',
        nodes: [],
        bindings: [],
        version: 1,
      },
    );

    service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.text'),
    );
    expect(service.canUndo()).toBe(true);

    service.applySavedComposite({
      id: 'c1',
      name: 'Main',
      nodes: [],
      bindings: [],
      version: 1,
    });
    expect(service.canUndo()).toBe(false);
  });

  it('batch-updates multiple node layouts in one pass', () => {
    const first = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.input.text'),
    );
    const second = service.addNodeFromDefinition(
      defaultComponentRegistry.getOrThrow('visual.kpi'),
    );

    service.updateNodesLayoutBatch(
      new Map([
        [first.id, { x: 48, y: 48 }],
        [second.id, { x: 96, y: 96 }],
      ]),
    );

    const nodes = service.nodes();
    expect(nodes.find((node) => node.id === first.id)?.layout?.x).toBe(48);
    expect(nodes.find((node) => node.id === second.id)?.layout?.y).toBe(96);
  });
});
