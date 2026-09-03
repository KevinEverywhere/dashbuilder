export interface AuthoringRecordRange {
  startSec: number;
  endSec: number;
}

export function normalizeAuthoringRecordRange(
  range: AuthoringRecordRange,
): { startSec: number; durationSec: number } | null {
  const startSec = Math.max(0, range.startSec);
  const endSec = Math.max(startSec, range.endSec);
  const durationSec = endSec - startSec;
  if (durationSec < 0.05) {
    return null;
  }
  return { startSec, durationSec };
}

export function isValidAuthoringRecordRange(range: AuthoringRecordRange | null | undefined): boolean {
  return normalizeAuthoringRecordRange(range ?? { startSec: 0, endSec: 0 }) !== null;
}

/** Default extract trim — full source duration once metadata is available. */
export function defaultAuthoringRecordRange(durationSec: number): AuthoringRecordRange | null {
  if (!Number.isFinite(durationSec) || durationSec <= 0.05) {
    return null;
  }
  return { startSec: 0, endSec: durationSec };
}

/** Download filename for an extracted subsection, derived from the user's source file. */
export function authoringExtractDownloadName(inputFile: File | Blob | null | undefined): string {
  if (inputFile instanceof File && inputFile.name) {
    const stem = inputFile.name.replace(/\.[^.]+$/, '');
    const safe = stem.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'authoring';
    return `${safe}-extract.mp4`;
  }
  return 'authoring-extract.mp4';
}

/** Download filename for a preview-recording extract in WebM. */
export function authoringPreviewRecordingDownloadName(inputFile: File | Blob | null | undefined): string {
  if (inputFile instanceof File && inputFile.name) {
    const stem = inputFile.name.replace(/\.[^.]+$/, '');
    const safe = stem.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'authoring';
    return `${safe}-preview-recording.webm`;
  }
  return 'authoring-preview-recording.webm';
}

/** ffmpeg args to transcode a MediaRecorder WebM preview clip to MP4. */
export function buildPreviewRecordingTranscodeArgs(options: {
  inputName: string;
  outputName: string;
  reverse?: boolean;
}): string[] {
  const args = ['-i', options.inputName];
  if (options.reverse) {
    args.push('-vf', 'reverse');
  }
  args.push(
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-pix_fmt',
    'yuv420p',
    options.outputName,
  );
  return args;
}

/** ffmpeg args for crop/scale extract, optionally trimmed to a recorded timeline segment. */
export function buildAuthoringExtractFfmpegArgs(options: {
  inputName: string;
  outputName: string;
  filter: string;
  trim?: AuthoringRecordRange | null;
}): string[] {
  const trim = options.trim ? normalizeAuthoringRecordRange(options.trim) : null;
  const args: string[] = [];
  if (trim) {
    args.push('-ss', trim.startSec.toFixed(3));
  }
  args.push('-i', options.inputName);
  if (trim) {
    args.push('-t', trim.durationSec.toFixed(3));
  }
  args.push(
    '-vf',
    options.filter,
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-pix_fmt',
    'yuv420p',
    options.outputName,
  );
  return args;
}
