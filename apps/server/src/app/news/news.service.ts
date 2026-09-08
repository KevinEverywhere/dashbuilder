import { Injectable } from '@nestjs/common';
import { MOCK_DESTINATIONS } from '@destination-atlas/destinations';

import { NewsIngestService } from './news-ingest.service.js';
import type { NewsAdminStatus, NewsArticle, NewsListQuery } from './news.types.js';

function matchesQuery(article: NewsArticle, q: string | undefined): boolean {
  if (!q?.trim()) {
    return true;
  }
  const needle = q.trim().toLowerCase();
  return (
    article.headline.toLowerCase().includes(needle) ||
    article.summary.toLowerCase().includes(needle) ||
    article.source.toLowerCase().includes(needle)
  );
}

function matchesRegion(article: NewsArticle, region: string | undefined): boolean {
  if (!region?.trim()) {
    return true;
  }
  const normalized = region.trim().toLowerCase();
  if (normalized === 'global') {
    return article.region === 'global';
  }
  return article.region.toLowerCase() === normalized;
}

function matchesDestination(article: NewsArticle, destinationId: string | undefined): boolean {
  if (!destinationId?.trim()) {
    return true;
  }
  const destination = MOCK_DESTINATIONS.find((entry) => entry.id === destinationId);
  if (!destination) {
    return true;
  }

  const nameNeedle = destination.name.toLowerCase();
  const text = `${article.headline} ${article.summary}`.toLowerCase();
  return text.includes(nameNeedle);
}

function rankDestinationArticles(articles: NewsArticle[], destinationId: string | undefined): NewsArticle[] {
  if (!destinationId?.trim()) {
    return articles.slice(0, 5);
  }
  const destination = MOCK_DESTINATIONS.find((entry) => entry.id === destinationId);
  if (!destination) {
    return articles.slice(0, 5);
  }

  const nameNeedle = destination.name.toLowerCase();
  return [...articles]
    .sort((left, right) => {
      const leftName = left.headline.toLowerCase().includes(nameNeedle) ? 0 : 1;
      const rightName = right.headline.toLowerCase().includes(nameNeedle) ? 0 : 1;
      if (leftName !== rightName) {
        return leftName - rightName;
      }
      return right.publishedAt.localeCompare(left.publishedAt);
    })
    .slice(0, 5);
}

@Injectable()
export class NewsService {
  constructor(private readonly ingest: NewsIngestService) {}

  async list(query: NewsListQuery = {}): Promise<NewsArticle[]> {
    if (query.destinationId) {
      await this.ingest.ensureDestinationFeed(query.destinationId);
    }
    await this.ingest.ensureFresh();

    const filtered = this.ingest
      .getSnapshot()
      .articles.filter(
        (article) =>
          matchesQuery(article, query.q) &&
          matchesRegion(article, query.region) &&
          matchesDestination(article, query.destinationId),
      );

    return rankDestinationArticles(filtered, query.destinationId);
  }

  adminStatus(): NewsAdminStatus {
    const snapshot = this.ingest.getSnapshot();
    const fetchedAt =
      snapshot.fetchedAt > 0 ? new Date(snapshot.fetchedAt).toISOString() : null;
    const cacheAgeMs = snapshot.fetchedAt > 0 ? Date.now() - snapshot.fetchedAt : null;

    return {
      articleCount: snapshot.articles.length,
      fetchedAt,
      cacheAgeMs,
      cacheTtlMs: this.ingest.cacheTtlMs(),
      feeds: this.ingest.listFeeds(),
    };
  }

  async adminRefresh(): Promise<NewsAdminStatus> {
    await this.ingest.refreshAll(true);
    return this.adminStatus();
  }

  adminReplaceFeeds(
    feeds: Array<{ id: string; query: string; region: string }>,
  ): NewsAdminStatus {
    this.ingest.replaceFeeds(feeds);
    return this.adminStatus();
  }
}
