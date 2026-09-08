import { MOCK_DESTINATIONS } from './destinations.js';
import offlineSnapshot from './news-offline-snapshot.json';

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  region: string;
  publishedAt: string;
  summary: string;
  url: string;
}

export interface NewsTableRow {
  id: string;
  headline: string;
  source: string;
  region: string;
  published: string;
  url?: string;
}

export interface NewsFeedQuery {
  q?: string;
  region?: string;
  destinationId?: string;
}

export interface NewsFeedResult {
  articles: NewsArticle[];
  source: 'live' | 'offline';
  apiUrl: string;
  error?: string;
}

export interface NewsAdminStatus {
  articleCount: number;
  fetchedAt: string | null;
  cacheAgeMs: number | null;
  cacheTtlMs: number;
  feeds: Array<{ id: string; query: string; region: string }>;
}

/** After one failed builder probe, skip further dev-proxy calls for this session. */
let builderNewsReachable: boolean | null = null;
let builderNewsProbe: Promise<boolean> | null = null;

export function resetBuilderNewsReachability(): void {
  builderNewsReachable = null;
  builderNewsProbe = null;
}

function builderNewsLiveForced(): boolean {
  return Boolean(readViteEnv('VITE_BUILDER_API_URL'));
}

function offlineDemoResult(query: NewsFeedQuery, apiUrl: string, error?: string): NewsFeedResult {
  const filtered = filterNewsArticles(OFFLINE_DEMO_NEWS_ARTICLES, query);
  return {
    articles: pickDestinationArticles(filtered, query.destinationId),
    source: 'offline',
    apiUrl,
    error,
  };
}

async function probeBuilderNews(): Promise<boolean> {
  if (builderNewsLiveForced()) {
    return true;
  }
  if (builderNewsReachable === false) {
    return false;
  }
  if (builderNewsReachable === true) {
    return true;
  }
  if (builderNewsProbe) {
    return builderNewsProbe;
  }

  const healthUrl = `${builderNewsApiBaseUrl()}/health`;

  builderNewsProbe = (async () => {
    try {
      const response = await fetch(healthUrl, { method: 'GET' });
      if (response.ok) {
        builderNewsReachable = true;
        return true;
      }
      builderNewsReachable = false;
      return false;
    } catch {
      builderNewsReachable = false;
      return false;
    } finally {
      builderNewsProbe = null;
    }
  })();

  return builderNewsProbe;
}

function readViteEnv(key: string): string | undefined {
  if (typeof import.meta === 'undefined') {
    return undefined;
  }
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  const value = env?.[key]?.trim();
  return value || undefined;
}

/** Base URL for builder news API calls. */
export function builderNewsApiBaseUrl(): string {
  const override = readViteEnv('VITE_BUILDER_API_URL');
  if (override) {
    return override.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return '/builder-api';
  }

  return 'http://127.0.0.1:3000/api';
}

export function builderNewsEndpoint(): string {
  return `${builderNewsApiBaseUrl()}/news`;
}

export function builderNewsAdminEndpoint(path: string): string {
  return `${builderNewsApiBaseUrl()}/news/admin/${path.replace(/^\//, '')}`;
}

export function newsArticleToTableRow(article: NewsArticle): NewsTableRow {
  return {
    id: article.id,
    headline: article.headline,
    source: article.source,
    region: article.region,
    published: article.publishedAt,
    url: article.url,
  };
}

export function destinationNewsLabel(destinationId: string | undefined): string | undefined {
  if (!destinationId) {
    return undefined;
  }
  return MOCK_DESTINATIONS.find((entry) => entry.id === destinationId)?.name;
}

/** Fetch normalized news articles from the builder RSS cache. */
export async function fetchAtlasNews(query: NewsFeedQuery = {}): Promise<NewsFeedResult> {
  const params = new URLSearchParams();
  if (query.q?.trim()) {
    params.set('q', query.q.trim());
  }
  if (query.region?.trim()) {
    params.set('region', query.region.trim());
  }
  if (query.destinationId?.trim()) {
    params.set('destinationId', query.destinationId.trim());
  }

  const apiUrl = params.size > 0 ? `${builderNewsEndpoint()}?${params}` : builderNewsEndpoint();

  const reachable = await probeBuilderNews();
  if (!reachable) {
    return offlineDemoResult(query, apiUrl, 'Builder API unreachable');
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      throw new Error('Expected a JSON array');
    }
    builderNewsReachable = true;
    return {
      articles: pickDestinationArticles(body as NewsArticle[], query.destinationId),
      source: 'live',
      apiUrl,
    };
  } catch (error) {
    builderNewsReachable = false;
    return offlineDemoResult(
      query,
      apiUrl,
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function fetchNewsAdminStatus(): Promise<NewsAdminStatus | null> {
  if (builderNewsReachable === false && !builderNewsLiveForced()) {
    return null;
  }
  if (builderNewsReachable !== true && !builderNewsLiveForced()) {
    const reachable = await probeBuilderNews();
    if (!reachable) {
      return null;
    }
  }
  try {
    const response = await fetch(builderNewsAdminEndpoint('status'));
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as NewsAdminStatus;
  } catch {
    return null;
  }
}

export async function refreshNewsCache(): Promise<NewsAdminStatus | null> {
  resetBuilderNewsReachability();
  try {
    const response = await fetch(builderNewsAdminEndpoint('refresh'), { method: 'POST' });
    if (!response.ok) {
      return null;
    }
    builderNewsReachable = true;
    return (await response.json()) as NewsAdminStatus;
  } catch {
    return null;
  }
}

export const NEWS_FEED_SETUP_HINT =
  'Start live news with npm run proof:react:live (or storybook:react:live in Storybook).';

/** Cached real headlines + publisher URLs when the builder API is offline. */
export const OFFLINE_DEMO_NEWS_ARTICLES: NewsArticle[] = offlineSnapshot.articles;

/** Client-side filter for offline fallbacks. */
export function filterNewsArticles(
  articles: NewsArticle[],
  query: { q?: string; region?: string; destinationId?: string },
): NewsArticle[] {
  const q = query.q?.trim().toLowerCase();
  const region = query.region?.trim().toLowerCase();
  const destination = MOCK_DESTINATIONS.find((entry) => entry.id === query.destinationId);
  const destinationName = destination?.name.toLowerCase();

  return articles.filter((article) => {
    const matchesQuery =
      !q ||
      article.headline.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q) ||
      article.source.toLowerCase().includes(q);
    const matchesRegion = !region || article.region.toLowerCase() === region;
    const text = `${article.headline} ${article.summary}`.toLowerCase();
    const matchesDestination =
      !destination || (destinationName ? text.includes(destinationName) : true);
    return matchesQuery && matchesRegion && matchesDestination;
  });
}

/** Prefer destination-name hits, cap live/offline lists at five headlines. */
export function pickDestinationArticles(
  articles: NewsArticle[],
  destinationId: string | undefined,
  limit = 5,
): NewsArticle[] {
  if (!destinationId?.trim()) {
    return articles.slice(0, limit);
  }
  const destination = MOCK_DESTINATIONS.find((entry) => entry.id === destinationId);
  if (!destination) {
    return articles.slice(0, limit);
  }

  const nameNeedle = destination.name.toLowerCase();
  const ranked = [...articles].sort((left, right) => {
    const leftName = left.headline.toLowerCase().includes(nameNeedle) ? 0 : 1;
    const rightName = right.headline.toLowerCase().includes(nameNeedle) ? 0 : 1;
    if (leftName !== rightName) {
      return leftName - rightName;
    }
    return right.publishedAt.localeCompare(left.publishedAt);
  });

  return ranked.slice(0, limit);
}

export function formatNewsFeedBanner(result: NewsFeedResult, destinationId?: string): string {
  const destination = destinationNewsLabel(destinationId);
  if (result.source === 'live') {
    const scope = destination ? ` for ${destination}` : '';
    return `Live news${scope} — ${result.articles.length} headline(s) from ${result.apiUrl}`;
  }
  if (result.articles.length > 0) {
    return `Cached travel news (builder offline) — ${result.articles.length} headline(s). ${NEWS_FEED_SETUP_HINT}`;
  }
  return `News API offline (${result.error ?? 'unreachable'}). ${NEWS_FEED_SETUP_HINT}`;
}
