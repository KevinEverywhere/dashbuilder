import type {
  AuthoringPlaybackInterruptAction,
  AuthoringRecordingInterruptPrompt,
} from '@rosettadash/core';
import type { AuthoringViewportHandle } from './authoring-viewport';

export async function discardInProgressRecording(viewport: AuthoringViewportHandle): Promise<void> {
  await viewport.stopRecording();
}

export function beginRecordingInterrupt(
  viewport: AuthoringViewportHandle,
  action: AuthoringPlaybackInterruptAction,
): AuthoringRecordingInterruptPrompt {
  const resumePlayback = !viewport.isPaused();
  viewport.pause();
  return { action, resumePlayback };
}
