import { Injectable, Logger } from '@nestjs/common';
import { MOCK_DESTINATIONS } from '@destination-atlas/destinations';

import { resolveGoogleNewsArticles } from './news-google-url.js';
import { parseRssFeed } from './news-rss.parser.js';
import type { NewsArticle, NewsCacheSnapshot, NewsFeedConfig } from './news.types.js';

const DEFAULT_FEEDS: NewsFeedConfig[] = [
  { id: 'travel', query: 'travel tourism destinations', region: 'global' },
  { id: 'africa', query: 'Africa travel tourism', region: 'africa' },
  { id: 'asia', query: 'Asia travel tourism', region: 'asia' },
  { id: 'europe', query: 'Europe travel tourism', region: 'europe' },
  { id: 'north-america', query: 'North America travel tourism', region: 'north-america' },
  { id: 'south-america', query: 'South America travel tourism', region: 'south-america' },
  { id: 'oceania', query: 'Oceania travel tourism', region: 'oceania' },
];

function googleNewsRssUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    hl: 'en-US',
    gl: 'US',
    ceid: 'US:en',
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function dedupeArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];
  for (const article of articles) {
    const key = article.url || article.id;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(article);
  }
  return unique.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

@Injectable()
export class NewsIngestService {
  private readonly logger = new Logger(NewsIngestService.name);
  private cache: NewsCacheSnapshot = { articles: [], fetchedAt: 0, feeds: [...DEFAULT_FEEDS] };

  cacheTtlMs(): number {
    const raw = Number(process.env['NEWS_CACHE_TTL_MS']);
    return Number.isFinite(raw) && raw > 0 ? raw : 86_400_000;
  }

  getSnapshot(): NewsCacheSnapshot {
    return this.cache;
  }

  listFeeds(): NewsFeedConfig[] {
    return [...this.cache.feeds];
  }

  replaceFeeds(feeds: NewsFeedConfig[]): NewsFeedConfig[] {
    this.cache.feeds = feeds.length > 0 ? feeds : [...DEFAULT_FEEDS];
    return this.listFeeds();
  }

  isCacheFresh(now = Date.now()): boolean {
    if (this.cache.fetchedAt <= 0 || this.cache.articles.length === 0) {
      return false;
    }
    return now - this.cache.fetchedAt < this.cacheTtlMs();
  }

  async ensureFresh(force = false): Promise<NewsCacheSnapshot> {
    if (!force && this.isCacheFresh()) {
      return this.cache;
    }
    return this.refreshAll();
  }

  async refreshAll(force = true): Promise<NewsCacheSnapshot> {
    void force;
    const articles: NewsArticle[] = [];

    for (const feed of this.cache.feeds) {
      try {
        const batch = await this.fetchFeed(feed);
        articles.push(...batch);
      } catch (error) {
        this.logger.warn(`RSS feed "${feed.id}" failed: ${error instanceof Error ? error.message : error}`);
      }
    }

    this.cache = {
      ...this.cache,
      articles: dedupeArticles(articles),
      fetchedAt: Date.now(),
    };
    return this.cache;
  }

  async ensureDestinationFeed(destinationId: string): Promise<void> {
    const destination = MOCK_DESTINATIONS.find((entry) => entry.id === destinationId);
    if (!destination) {
      return;
    }

    const feedId = `destination-${destination.id}`;
    if (this.cache.feeds.some((feed) => feed.id === feedId)) {
      return;
    }

    const feed: NewsFeedConfig = {
      id: feedId,
      query: `${destination.name} travel tourism`,
      region: destination.region,
    };
    this.cache.feeds.push(feed);

    try {
      const batch = await this.fetchFeed(feed);
      this.cache.articles = dedupeArticles([...this.cache.articles, ...batch]);
      if (this.cache.fetchedAt <= 0) {
        this.cache.fetchedAt = Date.now();
      }
    } catch (error) {
      this.logger.warn(
        `Destination RSS feed for ${destination.name} failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async fetchFeed(feed: NewsFeedConfig): Promise<NewsArticle[]> {
    const url = googleNewsRssUrl(feed.query);
    const response = await fetch(url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${feed.id}`);
    }
    const xml = await response.text();
    const parsed = parseRssFeed(xml, feed.region);
    return resolveGoogleNewsArticles(parsed);
  }
}
