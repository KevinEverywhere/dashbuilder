import { formatPanHeading, wrapSignedDegrees } from '@rosettadash/core';
import {
  DB_EQUIRECT_SPHERE_VIEWPORT_TAG,
  type EquirectSphereCameraChange,
  type RdEquirectSphereViewportElement,
} from '@rosettadash/web-components/visual/media/equirect-sphere-viewport';

export interface PanoramaViewport {
  element: HTMLDivElement;
  setVideoUrl(url: string | null): void;
  setMissingContent(message: string | null): void;
  setHeading(label: string): void;
}

function headingFromYaw(yaw: number): string {
  const degrees = wrapSignedDegrees(yaw);
  return formatPanHeading(degrees < 0 ? degrees + 360 : degrees);
}

function freezeTourFrame(viewport: RdEquirectSphereViewportElement): void {
  viewport.pause();
  viewport.seek(0);
}

export function createPanoramaViewport(
  videoUrl: string | null,
  onHeading?: (label: string) => void,
): PanoramaViewport {
  const element = document.createElement('div');
  element.className = 'rd-tour-pano';
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', '360° scene — drag to look around');

  const viewport = document.createElement(DB_EQUIRECT_SPHERE_VIEWPORT_TAG) as RdEquirectSphereViewportElement;
  viewport.className = 'rd-tour-pano__sphere';
  viewport.setAttribute('flip-interior', '');
  viewport.setAttribute('horizontal-fov', '75');
  viewport.setAttribute('min-horizontal-fov', '45');
  viewport.setAttribute('max-horizontal-fov', '95');

  const hint = document.createElement('span');
  hint.className = 'rd-tour-pano__hint';
  hint.textContent = 'Drag to look around';

  const missingContent = document.createElement('p');
  missingContent.className = 'rd-tour-pano__missing-content';
  missingContent.hidden = true;

  const label = document.createElement('span');
  label.className = 'rd-tour-pano__label';
  label.textContent = 'Scene viewport';

  element.append(viewport, hint, missingContent, label);

  let freezeTimer: number | undefined;

  const scheduleFreeze = () => {
    window.clearTimeout(freezeTimer);
    freezeTimer = window.setTimeout(() => {
      freezeTourFrame(viewport);
    }, 400);
  };

  viewport.addEventListener('camera-change', (event) => {
    const detail = (event as CustomEvent<EquirectSphereCameraChange>).detail;
    if (detail) {
      onHeading?.(headingFromYaw(detail.yaw));
    }
  });

  viewport.addEventListener(
    'pointerdown',
    () => {
      element.classList.add('rd-tour-pano--interacted');
    },
    { once: true },
  );

  const setMissingContent = (message: string | null) => {
    if (message) {
      missingContent.textContent = message;
      missingContent.hidden = false;
      hint.hidden = true;
      element.classList.add('rd-tour-pano--fallback');
      viewport.removeAttribute('video-src');
      return;
    }
    missingContent.textContent = '';
    missingContent.hidden = true;
    hint.hidden = false;
  };

  const setVideoUrl = (url: string | null) => {
    element.classList.remove('rd-tour-pano--interacted');
    setMissingContent(null);
    if (!url) {
      viewport.removeAttribute('video-src');
      element.classList.add('rd-tour-pano--fallback');
      return;
    }
    element.classList.remove('rd-tour-pano--fallback');
    viewport.setAttribute('video-src', url);
    scheduleFreeze();
    window.setTimeout(scheduleFreeze, 1200);
  };

  setVideoUrl(videoUrl);

  return {
    element,
    setVideoUrl,
    setMissingContent,
    setHeading(next: string) {
      label.textContent = next;
    },
  };
}
