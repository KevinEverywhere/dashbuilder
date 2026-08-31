import type { ComponentNode, NodeLayout } from '@rosettadash/core';
import { resolvePresentationDimensions } from '@rosettadash/core';
import {
  CANVAS_DEFAULT_NODE_MIN_HEIGHT,
  CANVAS_DEFAULT_NODE_WIDTH,
  CANVAS_MIN_NODE_HEIGHT,
} from './canvas-layout';

export const CANVAS_VIEWPORT_CULL_THRESHOLD = 50;
export const CANVAS_VIEWPORT_BUFFER_PX = 120;

/** Modest empty-canvas floor — grow only with placed/off-screen node bounds. */
export const CANVAS_MIN_CONTENT_HEIGHT_PX = 480;

const PORT_ROW_HEIGHT = 22;
const NODE_NAME_BAR_HEIGHT = 28;
const NODE_SHELL_CHROME = 8;
const DEFAULT_PREVIEW_HEIGHT = 128;

export interface CanvasViewport {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CanvasContentBounds {
  width: number;
  height: number;
}

export function canvasNodePreviewHeight(node: ComponentNode): number {
  const dims = resolvePresentationDimensions(node);
  if (dims) {
    return dims.height;
  }
  return DEFAULT_PREVIEW_HEIGHT;
}

export function canvasNodeHeaderHeight(_node: ComponentNode): number {
  return NODE_NAME_BAR_HEIGHT;
}

export function canvasNodeContentMinHeight(node: ComponentNode): number {
  const portCount = Math.max(node.ports.inputs.length, node.ports.outputs.length, 1);
  const previewHeight = canvasNodePreviewHeight(node);
  return Math.max(
    CANVAS_MIN_NODE_HEIGHT,
    canvasNodeHeaderHeight(node) +
      previewHeight +
      portCount * PORT_ROW_HEIGHT +
      NODE_SHELL_CHROME,
  );
}

export function estimateCanvasNodeHeight(node: ComponentNode): number {
  const minHeight = canvasNodeContentMinHeight(node);
  const layoutHeight = node.layout?.height;
  if (layoutHeight !== undefined && layoutHeight >= minHeight) {
    return layoutHeight;
  }
  return minHeight;
}

export function computeCanvasContentBounds(
  nodes: ComponentNode[],
  heightEstimator: (node: ComponentNode) => number = estimateCanvasNodeHeight,
): CanvasContentBounds {
  if (nodes.length === 0) {
    return { width: 480, height: CANVAS_MIN_CONTENT_HEIGHT_PX };
  }

  let maxRight = 0;
  let maxBottom = 0;

  for (const node of nodes) {
    const x = node.layout?.x ?? 24;
    const y = node.layout?.y ?? 24;
    const width = node.layout?.width ?? CANVAS_DEFAULT_NODE_WIDTH;
    const height = heightEstimator(node);
    maxRight = Math.max(maxRight, x + width);
    maxBottom = Math.max(maxBottom, y + height);
  }

  return {
    width: Math.max(maxRight + 24, 480),
    height: Math.max(maxBottom + 48, CANVAS_MIN_CONTENT_HEIGHT_PX),
  };
}

export function isNodeInViewport(
  node: ComponentNode,
  viewport: CanvasViewport,
  bufferPx = CANVAS_VIEWPORT_BUFFER_PX,
): boolean {
  const layout = node.layout ?? {
    x: 24,
    y: 24,
    width: CANVAS_DEFAULT_NODE_WIDTH,
    height: CANVAS_DEFAULT_NODE_MIN_HEIGHT,
  };
  const height = estimateCanvasNodeHeight(node);
  const right = layout.x + layout.width;
  const bottom = layout.y + height;
  const viewRight = viewport.left + viewport.width + bufferPx;
  const viewBottom = viewport.top + viewport.height + bufferPx;

  return (
    right >= viewport.left - bufferPx &&
    layout.x <= viewRight &&
    bottom >= viewport.top - bufferPx &&
    layout.y <= viewBottom
  );
}

export function filterVisibleCanvasNodes(
  nodes: ComponentNode[],
  viewport: CanvasViewport,
  selectedNodeIds: ReadonlySet<string>,
): ComponentNode[] {
  if (nodes.length <= CANVAS_VIEWPORT_CULL_THRESHOLD) {
    return nodes;
  }

  return nodes.filter(
    (node) => selectedNodeIds.has(node.id) || isNodeInViewport(node, viewport),
  );
}

export function mergeNodeLayout(
  current: NodeLayout,
  layout: Partial<NodeLayout>,
  snap: (value: number) => number,
  clampWidth: (value: number) => number,
  clampHeight: (value: number) => number,
): NodeLayout {
  const next: NodeLayout = { ...current, ...layout };
  if (layout.x !== undefined) {
    next.x = snap(layout.x);
  }
  if (layout.y !== undefined) {
    next.y = snap(layout.y);
  }
  if (layout.width !== undefined) {
    next.width = clampWidth(layout.width);
  }
  if (layout.height !== undefined) {
    next.height = clampHeight(layout.height);
  }
  return next;
}
