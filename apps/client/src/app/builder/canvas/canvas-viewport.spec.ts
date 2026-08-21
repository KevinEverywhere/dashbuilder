import type { ComponentNode } from '@rosettadash/core';
import {
  CANVAS_MIN_CONTENT_HEIGHT_PX,
  computeCanvasContentBounds,
  filterVisibleCanvasNodes,
  isNodeInViewport,
} from './canvas-viewport';

function createNode(overrides: Partial<ComponentNode> = {}): ComponentNode {
  return {
    id: 'n1',
    type: 'visual.input.text',
    label: 'Text',
    properties: {},
    ports: { inputs: [], outputs: [{ id: 'value', name: 'Value', dataType: 'string' }] },
    layout: { x: 100, y: 100, width: 220, height: 72 },
    ...overrides,
  };
}

describe('canvas viewport helpers', () => {
  it('returns all nodes when below the cull threshold', () => {
    const nodes = [createNode({ id: 'a' }), createNode({ id: 'b' })];
    const visible = filterVisibleCanvasNodes(
      nodes,
      { left: 0, top: 0, width: 200, height: 200 },
      new Set(),
    );
    expect(visible).toHaveLength(2);
  });

  it('culls off-screen nodes above the threshold', () => {
    const nodes = Array.from({ length: 60 }, (_, index) =>
      createNode({
        id: `n${index}`,
        layout: { x: index * 300, y: 0, width: 220, height: 72 },
      }),
    );

    const visible = filterVisibleCanvasNodes(
      nodes,
      { left: 0, top: 0, width: 400, height: 400 },
      new Set(),
    );

    expect(visible.length).toBeLessThan(nodes.length);
    expect(visible.every((node) => isNodeInViewport(node, {
      left: 0,
      top: 0,
      width: 400,
      height: 400,
    }))).toBe(true);
  });

  it('always keeps selected nodes visible', () => {
    const farNode = createNode({
      id: 'far',
      layout: { x: 5000, y: 5000, width: 220, height: 72 },
    });
    const nodes = Array.from({ length: 60 }, (_, index) =>
      createNode({
        id: `n${index}`,
        layout: { x: index * 300, y: 0, width: 220, height: 72 },
      }),
    );

    const visible = filterVisibleCanvasNodes(
      [...nodes, farNode],
      { left: 0, top: 0, width: 400, height: 400 },
      new Set(['far']),
    );

    expect(visible.some((node) => node.id === 'far')).toBe(true);
  });

  it('uses a modest minimum height for an empty canvas', () => {
    expect(computeCanvasContentBounds([])).toEqual({
      width: 480,
      height: CANVAS_MIN_CONTENT_HEIGHT_PX,
    });
    expect(CANVAS_MIN_CONTENT_HEIGHT_PX).toBeLessThanOrEqual(480);
  });

  it('computes content bounds from node positions and heights', () => {
    const nodes = [
      createNode({ id: 'a', layout: { x: 24, y: 24, width: 200, height: 100 } }),
      createNode({ id: 'b', layout: { x: 24, y: 200, width: 200, height: 150 } }),
    ];

    expect(computeCanvasContentBounds(nodes)).toEqual({
      width: 480,
      height: CANVAS_MIN_CONTENT_HEIGHT_PX,
    });
  });

  it('extends height when a node is placed far down the canvas', () => {
    const bounds = computeCanvasContentBounds([
      createNode({ layout: { x: 24, y: 1200, width: 220, height: 120 } }),
    ]);
    expect(bounds.height).toBeGreaterThan(1200);
  });
});
