/** Stop or reset transport while a mirror recording is in progress. */
export type AuthoringPlaybackInterruptAction = 'stop' | 'reset';

export interface AuthoringRecordingInterruptPrompt {
  action: AuthoringPlaybackInterruptAction;
  resumePlayback: boolean;
}

export const AUTHORING_RECORDING_INTERRUPT_COPY = {
  message: 'Recording in progress will be discarded.',
  cancel: 'Continue recording',
  confirmStop: 'Stop anyway',
  confirmReset: 'Reset anyway',
} as const;

export function authoringRecordingInterruptConfirmLabel(
  action: AuthoringPlaybackInterruptAction,
): string {
  return action === 'reset'
    ? AUTHORING_RECORDING_INTERRUPT_COPY.confirmReset
    : AUTHORING_RECORDING_INTERRUPT_COPY.confirmStop;
}
