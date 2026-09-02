import { AUTHORING_OUTPUT_CUSTOM_ID, AUTHORING_OUTPUT_PRESETS } from '@rosettadash/core';

export function matchOutputPreset(width: number, height: number): string {
  const match = AUTHORING_OUTPUT_PRESETS.find(
    (entry) => entry.width === width && entry.height === height,
  );
  return match?.id ?? AUTHORING_OUTPUT_CUSTOM_ID;
}

export function evenDimension(value: number): number {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

export function probeVideoFile(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    video.src = url;
  });
}
