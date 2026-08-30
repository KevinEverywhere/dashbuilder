export interface SampleVideo {
  id: string;
  title: string;
  url: string;
}

export const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'elephants-dream',
    title: 'Elephants Dream',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'sintel',
    title: 'Sintel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
];

export function getSampleVideo(id: string, videos: SampleVideo[] = SAMPLE_VIDEOS): SampleVideo | undefined {
  return videos.find((video) => video.id === id);
}

export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}
