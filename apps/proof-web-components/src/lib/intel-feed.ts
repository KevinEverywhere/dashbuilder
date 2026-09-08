import { fetchAtlasNews, type NewsFeedResult } from '@destination-atlas';

let cacheKey = '';
let feedResult: NewsFeedResult | null = null;
let inflight: Promise<void> | null = null;

export function getIntelFeedResult(): NewsFeedResult | null {
  return feedResult;
}

export function ensureIntelFeed(
  query: { q: string; region: string; destinationId: string },
  onUpdate: () => void,
): void {
  const nextKey = JSON.stringify(query);
  if (nextKey === cacheKey && feedResult) {
    return;
  }

  cacheKey = nextKey;
  inflight = fetchAtlasNews({
    q: query.q,
    region: query.region,
    destinationId: query.destinationId,
  }).then((result) => {
    feedResult = result;
    inflight = null;
    onUpdate();
  });
}

export function resetIntelFeedForTests(): void {
  cacheKey = '';
  feedResult = null;
  inflight = null;
}
