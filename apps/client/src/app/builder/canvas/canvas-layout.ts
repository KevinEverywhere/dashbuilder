export const CANVAS_GRID_SIZE = 16;
export const CANVAS_MIN_NODE_WIDTH = 160;
export const CANVAS_MIN_NODE_HEIGHT = 72;
/** Default width for newly placed canvas nodes (grid-aligned). */
export const CANVAS_DEFAULT_NODE_WIDTH = 352;
/** Minimum initial height when no presentation preset exists. */
export const CANVAS_DEFAULT_NODE_MIN_HEIGHT = 160;

export function snapToCanvasGrid(value: number, gridSize = CANVAS_GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function clampCanvasNodeWidth(width: number): number {
  return Math.max(CANVAS_MIN_NODE_WIDTH, snapToCanvasGrid(width));
}

export function clampCanvasNodeHeight(height: number): number {
  return Math.max(CANVAS_MIN_NODE_HEIGHT, snapToCanvasGrid(height));
}
