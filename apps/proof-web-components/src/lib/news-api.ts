export interface LiveNewsArticle {
  id: string;
  headline: string;
  source: string;
  region: string;
  published: string;
  summary: string;
}

const REGION_COUNTRY: Record<string, string> = {
  'asia-pacific': 'jp',
  europe: 'fr',
  americas: 'us',
  africa: 'za',
};

interface NewsApiArticle {
  title?: string;
  description?: string;
  source?: { name?: string };
  publishedAt?: string;
  url?: string;
}

interface NewsApiResponse {
  status?: string;
  message?: string;
  articles?: NewsApiArticle[];
}

function inferRegion(headline: string, description: string): string {
  const text = `${headline} ${description}`.toLowerCase();
  if (text.includes('tokyo') || text.includes('asia')) {
    return 'asia-pacific';
  }
  if (text.includes('paris') || text.includes('europe')) {
    return 'europe';
  }
  if (text.includes('africa') || text.includes('marrakech')) {
    return 'africa';
  }
  return 'americas';
}

function mapArticle(article: NewsApiArticle, index: number): LiveNewsArticle {
  const headline = article.title?.trim() || 'Untitled headline';
  const summary = article.description?.trim() || 'No summary available.';
  return {
    id: article.url ?? `live-${index}`,
    headline,
    source: article.source?.name ?? 'NewsAPI',
    region: inferRegion(headline, summary),
    published: article.publishedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    summary,
  };
}

/**
 * Attempt live NewsAPI fetch. Returns null when blocked (typical browser CORS) or on error.
 */
export async function fetchLiveNewsArticles(options: {
  apiKey: string;
  query?: string;
  region?: string;
}): Promise<{ articles: LiveNewsArticle[]; warning?: string } | null> {
  const params = new URLSearchParams({ apiKey: options.apiKey, pageSize: '12' });
  if (options.query?.trim()) {
    params.set('q', options.query.trim());
  } else if (options.region && REGION_COUNTRY[options.region]) {
    params.set('country', REGION_COUNTRY[options.region]!);
  } else {
    params.set('category', 'travel');
    params.set('language', 'en');
  }

  try {
    const response = await fetch(`https://newsapi.org/v2/top-headlines?${params.toString()}`);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as NewsApiResponse;
      return {
        articles: [],
        warning: body.message ?? `News API returned ${response.status}`,
      };
    }
    const body = (await response.json()) as NewsApiResponse;
    const articles = (body.articles ?? []).map(mapArticle).filter((row) => row.headline);
    if (!articles.length) {
      return { articles: [], warning: 'News API returned no articles for this query.' };
    }
    return { articles };
  } catch {
    return null;
  }
}
