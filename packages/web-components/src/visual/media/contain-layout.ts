export function fitContainRect(
  contentWidth: number,
  contentHeight: number,
  hostWidth: number,
  hostHeight: number,
): { width: number; height: number } {
  const safeW = Math.max(1, contentWidth);
  const safeH = Math.max(1, contentHeight);
  const contentAspect = safeW / safeH;
  const hostAspect = hostWidth / hostHeight;
  if (contentAspect > hostAspect) {
    return { width: hostWidth, height: hostWidth / contentAspect };
  }
  return { width: hostHeight * contentAspect, height: hostHeight };
}

export function applyCanvasContainDisplay(
  canvas: HTMLCanvasElement,
  contentWidth: number,
  contentHeight: number,
  host: HTMLElement | null | undefined,
  dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2),
): { bufferWidth: number; bufferHeight: number; displayWidth: number; displayHeight: number } {
  const rect = host?.getBoundingClientRect();
  const fallback = previewCanvasSize(contentWidth, contentHeight);
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    canvas.width = fallback.width;
    canvas.height = fallback.height;
    canvas.style.display = 'block';
    canvas.style.width = `${fallback.width}px`;
    canvas.style.height = `${fallback.height}px`;
    canvas.style.margin = '0';
    return {
      bufferWidth: fallback.width,
      bufferHeight: fallback.height,
      displayWidth: fallback.width,
      displayHeight: fallback.height,
    };
  }

  const display = fitContainRect(contentWidth, contentHeight, rect.width, rect.height);
  const bufferWidth = Math.max(2, Math.round((display.width * dpr) / 2) * 2);
  const bufferHeight = Math.max(2, Math.round((display.height * dpr) / 2) * 2);
  canvas.width = bufferWidth;
  canvas.height = bufferHeight;
  canvas.style.display = 'block';
  canvas.style.width = `${display.width}px`;
  canvas.style.height = `${display.height}px`;
  canvas.style.margin = '0';
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
  canvas.style.removeProperty('aspect-ratio');
  return {
    bufferWidth,
    bufferHeight,
    displayWidth: display.width,
    displayHeight: display.height,
  };
}

export function applyMirrorContainDisplay(
  canvas: HTMLCanvasElement,
  contentWidth: number,
  contentHeight: number,
  host: HTMLElement | null | undefined,
): { displayWidth: number; displayHeight: number } {
  const rect = host?.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    canvas.style.display = 'block';
    canvas.style.removeProperty('width');
    canvas.style.removeProperty('height');
    return { displayWidth: contentWidth, displayHeight: contentHeight };
  }
  const display = fitContainRect(contentWidth, contentHeight, rect.width, rect.height);
  canvas.style.display = 'block';
  canvas.style.width = `${display.width}px`;
  canvas.style.height = `${display.height}px`;
  canvas.style.margin = '0';
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
  canvas.style.removeProperty('aspect-ratio');
  return { displayWidth: display.width, displayHeight: display.height };
}

function previewCanvasSize(contentWidth: number, contentHeight: number, maxEdge = 720) {
  const safeCropWidth = Math.max(2, Math.round(contentWidth));
  const safeCropHeight = Math.max(2, Math.round(contentHeight));
  const scale = Math.min(1, maxEdge / Math.max(safeCropWidth, safeCropHeight));
  return {
    width: Math.max(2, Math.round((safeCropWidth * scale) / 2) * 2),
    height: Math.max(2, Math.round((safeCropHeight * scale) / 2) * 2),
  };
}

export function sizeElementContainDisplay(
  element: HTMLElement,
  contentWidth: number,
  contentHeight: number,
  host: HTMLElement,
): void {
  const rect = host.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }
  const display = fitContainRect(contentWidth, contentHeight, rect.width, rect.height);
  element.style.width = `${display.width}px`;
  element.style.height = `${display.height}px`;
  element.style.margin = 'auto';
}
