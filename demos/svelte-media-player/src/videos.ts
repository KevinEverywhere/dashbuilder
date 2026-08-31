import {
  DESTINATION_CONTINENT_OPTIONS,
  MOCK_DESTINATIONS,
  type DestinationContinentId,
} from '@destination-atlas';

export interface SampleVideo {
  id: string;
  title: string;
  videoId: string;
  continent: DestinationContinentId;
  continentLabel: string;
}

/** Two Destination Atlas cities per inhabited continent (no Antarctica). */
const FEATURED_IDS = [
  'cairo',
  'cape-town',
  'tokyo',
  'mumbai',
  'paris',
  'rome',
  'new-york',
  'mexico-city',
  'rio',
  'cusco',
  'sydney',
  'auckland',
] as const;

const CONTINENT_ORDER = new Map(
  DESTINATION_CONTINENT_OPTIONS.map((option, index) => [option.value, index]),
);

const CONTINENT_LABEL = Object.fromEntries(
  DESTINATION_CONTINENT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<DestinationContinentId, string>;

export const SAMPLE_VIDEOS: SampleVideo[] = FEATURED_IDS.map((id) => {
  const destination = MOCK_DESTINATIONS.find((row) => row.id === id);
  if (!destination?.youtubeId) {
    throw new Error(`Destination Atlas is missing YouTube for ${id}`);
  }
  return {
    id: destination.id,
    title: destination.name,
    videoId: destination.youtubeId,
    continent: destination.region,
    continentLabel: CONTINENT_LABEL[destination.region],
  };
}).sort((left, right) => {
  const continentDelta =
    (CONTINENT_ORDER.get(left.continent) ?? 0) - (CONTINENT_ORDER.get(right.continent) ?? 0);
  if (continentDelta !== 0) {
    return continentDelta;
  }
  return left.title.localeCompare(right.title);
});

export function getSampleVideo(
  id: string,
  videos: SampleVideo[] = SAMPLE_VIDEOS,
): SampleVideo | undefined {
  return videos.find((video) => video.id === id);
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
