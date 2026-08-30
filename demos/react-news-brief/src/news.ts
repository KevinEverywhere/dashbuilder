export const NEWS_TYPES = [
  { value: 'front_page', label: 'Top' },
  { value: 'story', label: 'Stories' },
  { value: 'ask_hn', label: 'Ask' },
  { value: 'show_hn', label: 'Show' },
] as const;

export const NEWS_REGIONS = [
  { value: 'global', label: 'Global' },
  { value: 'americas', label: 'Americas' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'africa', label: 'Africa' },
  { value: 'oceania', label: 'Oceania' },
] as const;

const REGION_QUERY: Record<string, string> = {
  global: '',
  americas: 'United States OR Canada OR Brazil OR Mexico',
  europe: 'Europe OR London OR Paris OR Berlin',
  asia: 'Asia OR Japan OR China OR India',
  africa: 'Africa OR Kenya OR Nigeria OR Egypt',
  oceania: 'Australia OR New Zealand OR Pacific',
};

export interface NewsStory {
  id: string;
  headline: string;
  source: string;
  points: number;
  published: string;
  url: string;
  comments: number;
}

interface AlgoliaHit {
  objectID?: string;
  title?: string | null;
  story_title?: string | null;
  url?: string | null;
  story_url?: string | null;
  author?: string;
  points?: number | null;
  created_at?: string;
  num_comments?: number | null;
}

interface AlgoliaResponse {
  hits?: AlgoliaHit[];
}

export function formatStoryDate(iso: string): string {
  if (!iso) {
    return '—';
  }
  return iso.slice(0, 10);
}

export async function fetchNewsBrief(
  type: string,
  region: string,
  signal?: AbortSignal,
): Promise<NewsStory[]> {
  const query = REGION_QUERY[region] ?? '';
  const params = new URLSearchParams({
    tags: query && type === 'front_page' ? 'story' : type || 'front_page',
    hitsPerPage: '8',
  });
  if (query) {
    params.set('query', query);
  }

  const response = await fetch(`https://hn.algolia.com/api/v1/search?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`News request failed (${response.status})`);
  }

  const body = (await response.json()) as AlgoliaResponse;
  return (body.hits ?? [])
    .map((hit, index) => {
      const headline = (hit.title || hit.story_title || '').trim();
      if (!headline) {
        return null;
      }
      return {
        id: hit.objectID ?? `story-${index}`,
        headline,
        source: hit.author ? `@${hit.author}` : 'HN',
        points: hit.points ?? 0,
        published: formatStoryDate(hit.created_at ?? ''),
        url: hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        comments: hit.num_comments ?? 0,
      };
    })
    .filter((story): story is NewsStory => story !== null);
}
