import { formatPanHeading, headingFromPanOffset, wrapPeriod } from '@rosettadash/core';

export interface PanoramaViewport {
  element: HTMLDivElement;
  setImage(url: string): void;
  setHeading(label: string): void;
}

export function createPanoramaViewport(
  imageUrl: string,
  onHeading?: (label: string) => void,
): PanoramaViewport {
  const element = document.createElement('div');
  element.className = 'rd-tour-pano';
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', 'Scene viewport');

  const strip = document.createElement('div');
  strip.className = 'rd-tour-pano__strip';

  const first = document.createElement('img');
  const second = document.createElement('img');
  first.alt = '';
  second.alt = '';
  first.draggable = false;
  second.draggable = false;
  strip.append(first, second);

  const label = document.createElement('span');
  label.className = 'rd-tour-pano__label';
  label.textContent = 'Scene viewport';
  element.append(strip, label);

  let offsetPx = 0;
  let period = 0;
  let dragging = false;
  let lastX = 0;

  function emitHeading(): void {
    onHeading?.(formatPanHeading(headingFromPanOffset(offsetPx, period)));
  }

  function paintOffset(): void {
    if (period <= 0) {
      strip.style.transform = 'translate3d(0, 0, 0)';
      return;
    }
    const wrapped = wrapPeriod(offsetPx, period);
    strip.style.transform = `translate3d(${-wrapped}px, 0, 0)`;
    emitHeading();
  }

  function measurePeriod(): void {
    period = first.getBoundingClientRect().width;
    paintOffset();
  }

  function applyImage(url: string): void {
    element.classList.remove('rd-tour-pano--fallback');
    first.onerror = () => {
      element.classList.add('rd-tour-pano--fallback');
    };
    first.src = url;
    second.src = url;
  }

  first.addEventListener('load', measurePeriod);
  new ResizeObserver(measurePeriod).observe(element);

  applyImage(imageUrl);
  paintOffset();

  element.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    element.setPointerCapture(event.pointerId);
    element.classList.add('rd-tour-pano--dragging');
  });

  element.addEventListener('pointermove', (event) => {
    if (!dragging) {
      return;
    }
    offsetPx -= event.clientX - lastX;
    lastX = event.clientX;
    paintOffset();
  });

  const endDrag = (event: PointerEvent) => {
    if (!dragging) {
      return;
    }
    dragging = false;
    element.classList.remove('rd-tour-pano--dragging');
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  };

  element.addEventListener('pointerup', endDrag);
  element.addEventListener('pointercancel', endDrag);

  return {
    element,
    setImage(url: string) {
      offsetPx = 0;
      applyImage(url);
      measurePeriod();
    },
    setHeading(next: string) {
      label.textContent = next;
    },
  };
}
