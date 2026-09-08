/** Normalized news article — aligned with preview-content `news_articles` rows. */
export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  region: string;
  publishedAt: string;
  summary: string;
  url: string;
}

export interface NewsFeedConfig {
  id: string;
  query: string;
  region: string;
}

export interface NewsCacheSnapshot {
  articles: NewsArticle[];
  fetchedAt: number;
  feeds: NewsFeedConfig[];
}

export interface NewsListQuery {
  q?: string;
  region?: string;
  destinationId?: string;
}

export interface NewsAdminStatus {
  articleCount: number;
  fetchedAt: string | null;
  cacheAgeMs: number | null;
  cacheTtlMs: number;
  feeds: NewsFeedConfig[];
}
