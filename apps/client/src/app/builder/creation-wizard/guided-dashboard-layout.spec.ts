import type { ComponentNode } from '@rosettadash/core';
import {
  computeGuidedBindings,
  computeGuidedDashboardLayout,
  layoutTemplateNodes,
} from './guided-dashboard-layout';

function node(partial: Partial<ComponentNode> & Pick<ComponentNode, 'id' | 'type'>): ComponentNode {
  return {
    label: partial.type,
    properties: {},
    ports: { inputs: [], outputs: [] },
    layout: { x: 0, y: 0, width: 220, height: 72 },
    ...partial,
  };
}

describe('guided dashboard layout', () => {
  it('places filter above table/chart and table left of chart', () => {
    const nodes = [
      node({ id: 'f', type: 'visual.input.date-range' }),
      node({ id: 't', type: 'visual.table' }),
      node({ id: 'c', type: 'visual.chart.line' }),
    ];
    const layout = computeGuidedDashboardLayout(nodes);
    expect(layout.get('f')!.y).toBeLessThan(layout.get('t')!.y);
    expect(layout.get('t')!.x).toBeLessThan(layout.get('c')!.x);
    expect(layout.get('t')!.y).toBe(layout.get('c')!.y);
  });

  it('places infra in a right column instead of stacking on visual nodes', () => {
    const nodes = [
      node({ id: 'gate', type: 'domain.role-gate' }),
      node({ id: 'table', type: 'visual.table' }),
      node({ id: 'pg', type: 'infra.postgresql' }),
    ];
    const layout = computeGuidedDashboardLayout(nodes);
    expect(layout.get('pg')!.x).toBeGreaterThan(layout.get('table')!.x);
    expect(layout.get('gate')!.y).toBeLessThan(layout.get('table')!.y);
  });

  it('layoutTemplateNodes sets heights large enough to avoid overlap', () => {
    const nodes = [
      node({ id: 'gate', type: 'domain.role-gate', layout: { x: 24, y: 24, width: 360, height: 72 } }),
      node({ id: 'table', type: 'visual.table', layout: { x: 24, y: 112, width: 360, height: 160 } }),
      node({ id: 'pg', type: 'infra.postgresql' }),
    ];
    const laidOut = layoutTemplateNodes(nodes);
    const gate = laidOut.find((entry) => entry.id === 'gate')!;
    const table = laidOut.find((entry) => entry.id === 'table')!;
    expect(table.layout!.y).toBeGreaterThanOrEqual(gate.layout!.y + gate.layout!.height!);
  });

  it('wires date-range to table filter and chart range', () => {
    const nodes = [
      node({ id: 'f', type: 'visual.input.date-range' }),
      node({ id: 't', type: 'visual.table' }),
      node({ id: 'c', type: 'visual.chart.line' }),
    ];
    const bindings = computeGuidedBindings(nodes);
    expect(bindings).toEqual(
      expect.arrayContaining([
        {
          sourceNodeId: 'f',
          sourcePortId: 'range',
          targetNodeId: 't',
          targetPortId: 'filter',
        },
        {
          sourceNodeId: 'f',
          sourcePortId: 'range',
          targetNodeId: 'c',
          targetPortId: 'range',
        },
      ]),
    );
  });
});
