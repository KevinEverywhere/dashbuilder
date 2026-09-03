import {
  buildAuthoringExtractFfmpegArgs,
  buildPreviewRecordingTranscodeArgs,
  authoringExtractDownloadName,
  authoringPreviewRecordingDownloadName,
  isValidAuthoringRecordRange,
  normalizeAuthoringRecordRange,
  defaultAuthoringRecordRange,
} from './authoring-extract-trim';

describe('authoring-extract-trim', () => {
  it('normalizes valid ranges', () => {
    expect(normalizeAuthoringRecordRange({ startSec: 2, endSec: 5 })).toEqual({
      startSec: 2,
      durationSec: 3,
    });
  });

  it('rejects ranges shorter than 50ms', () => {
    expect(normalizeAuthoringRecordRange({ startSec: 1, endSec: 1.02 })).toBeNull();
    expect(isValidAuthoringRecordRange({ startSec: 1, endSec: 1.02 })).toBe(false);
  });

  it('builds a default full-clip range from duration', () => {
    expect(defaultAuthoringRecordRange(8)).toEqual({ startSec: 0, endSec: 8 });
    expect(defaultAuthoringRecordRange(0)).toBeNull();
  });

  it('builds ffmpeg args with trim', () => {
    expect(
      buildAuthoringExtractFfmpegArgs({
        inputName: 'input.mp4',
        outputName: 'output.mp4',
        filter: 'crop=640:360',
        trim: { startSec: 1.5, endSec: 4.25 },
      }),
    ).toEqual([
      '-ss',
      '1.500',
      '-i',
      'input.mp4',
      '-t',
      '2.750',
      '-vf',
      'crop=640:360',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      'output.mp4',
    ]);
  });

  it('builds ffmpeg args without trim when omitted', () => {
    expect(
      buildAuthoringExtractFfmpegArgs({
        inputName: 'input.mp4',
        outputName: 'output.mp4',
        filter: 'scale=720:480',
      }),
    ).toEqual([
      '-i',
      'input.mp4',
      '-vf',
      'scale=720:480',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      'output.mp4',
    ]);
  });

  it('builds preview recording transcode args', () => {
    expect(
      buildPreviewRecordingTranscodeArgs({
        inputName: 'preview.webm',
        outputName: 'output.mp4',
        reverse: true,
      }),
    ).toEqual([
      '-i',
      'preview.webm',
      '-vf',
      'reverse',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      'output.mp4',
    ]);
  });
});

describe('authoringExtractDownloadName', () => {
  it('derives name from uploaded file', () => {
    expect(authoringExtractDownloadName(new File(['x'], 'my-trip.webm', { type: 'video/webm' }))).toBe(
      'my-trip-extract.mp4',
    );
  });

  it('falls back when source file is missing', () => {
    expect(authoringExtractDownloadName(null)).toBe('authoring-extract.mp4');
  });
});
