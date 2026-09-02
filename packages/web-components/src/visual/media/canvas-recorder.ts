export interface CanvasRecorderSession {
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: Blob[];
}

function recorderMimeCandidates(): string[] {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=h264',
    'video/mp4',
  ];
  return candidates.filter((type) => MediaRecorder.isTypeSupported(type));
}

function createMediaRecorder(stream: MediaStream): MediaRecorder | null {
  for (const mimeType of recorderMimeCandidates()) {
    try {
      return new MediaRecorder(stream, { mimeType });
    } catch {
      // try next candidate
    }
  }
  try {
    return new MediaRecorder(stream);
  } catch {
    return null;
  }
}

/** Start capturing a canvas stream; returns null when recording cannot start. */
export function startCanvasRecorder(
  canvas: HTMLCanvasElement,
  fps = 30,
  timesliceMs = 200,
): CanvasRecorderSession | null {
  if (canvas.width < 2 || canvas.height < 2) {
    return null;
  }
  let stream: MediaStream;
  try {
    stream = canvas.captureStream(fps);
  } catch {
    return null;
  }
  const recorder = createMediaRecorder(stream);
  if (!recorder) {
    stream.getTracks().forEach((track) => track.stop());
    return null;
  }
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
  try {
    recorder.start(timesliceMs);
  } catch {
    stream.getTracks().forEach((track) => track.stop());
    return null;
  }
  return { recorder, stream, chunks };
}

/** Stop capture and return a WebM/MP4 blob, or null when nothing was recorded. */
export function stopCanvasRecorder(session: CanvasRecorderSession | null): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!session) {
      resolve(null);
      return;
    }
    const { recorder, stream, chunks } = session;
    if (recorder.state === 'inactive') {
      stream.getTracks().forEach((track) => track.stop());
      resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
      return;
    }
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop());
      resolve(null);
    };
    try {
      if (recorder.state === 'recording') {
        recorder.requestData();
      }
      recorder.stop();
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      resolve(null);
    }
  });
}
