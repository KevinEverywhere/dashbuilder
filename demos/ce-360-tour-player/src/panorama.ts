export interface PanoramaViewport {
  element: HTMLDivElement;
  setImage(url: string): void;
  setHeading(label: string): void;
}

function headingFromOffset(percent: number): string {
  const deg = Math.round((((percent % 100) + 100) % 100) * 3.6) % 360;
  return `${deg}°`;
}

export function createPanoramaViewport(
  imageUrl: string,
  onHeading?: (label: string) => void,
): PanoramaViewport {
  const element = document.createElement('div');
  element.className = 'rd-tour-pano';
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', 'Scene viewport');

  const label = document.createElement('span');
  label.className = 'rd-tour-pano__label';
  label.textContent = 'Scene viewport';
  element.append(label);

  let offset = 50;
  let dragging = false;
  let lastX = 0;

  function applyBackground(url: string): void {
    element.classList.remove('rd-tour-pano--fallback');
    element.style.backgroundImage = `url("${url}")`;
    const probe = new Image();
    probe.onerror = () => {
      element.classList.add('rd-tour-pano--fallback');
      element.style.backgroundImage = '';
    };
    probe.src = url;
  }

  function paintOffset(): void {
    element.style.backgroundPosition = `${offset}% 50%`;
  }

  applyBackground(imageUrl);
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
    const width = element.clientWidth || 1;
    offset = (offset + ((event.clientX - lastX) / width) * 50 + 100) % 100;
    lastX = event.clientX;
    paintOffset();
    onHeading?.(headingFromOffset(offset));
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
      offset = 50;
      applyBackground(url);
      paintOffset();
    },
    setHeading(next: string) {
      label.textContent = next;
    },
  };
}
