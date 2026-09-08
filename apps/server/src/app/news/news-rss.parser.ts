import { createHash } from 'node:crypto';

import type { NewsArticle } from './news.types.js';

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readTag(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1] ? decodeEntities(match[1]) : undefined;
}

function parsePubDate(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

function splitHeadlineSource(title: string): { headline: string; source: string } {
  const dash = title.lastIndexOf(' - ');
  if (dash > 0) {
    return {
      headline: title.slice(0, dash).trim(),
      source: title.slice(dash + 3).trim(),
    };
  }
  return { headline: title.trim(), source: 'Google News' };
}

function articleId(url: string, headline: string): string {
  return createHash('sha1').update(`${url}:${headline}`).digest('hex').slice(0, 16);
}

/** Minimal RSS/Atom item parser — enough for Google News RSS feeds. */
export function parseRssFeed(xml: string, region: string): NewsArticle[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const articles: NewsArticle[] = [];

  for (const block of items) {
    const title = readTag(block, 'title');
    const link = readTag(block, 'link');
    if (!title || !link) {
      continue;
    }

    const { headline, source: titleSource } = splitHeadlineSource(title);
    const source = readTag(block, 'source') ?? titleSource;
    const description = readTag(block, 'description') ?? readTag(block, 'content:encoded') ?? '';
    const pubDate = readTag(block, 'pubDate') ?? readTag(block, 'dc:date');

    articles.push({
      id: articleId(link, headline),
      headline,
      source,
      region,
      publishedAt: parsePubDate(pubDate),
      summary: description.slice(0, 500),
      url: link,
    });
  }

  return articles;
}
