/**
 * One-shot generator: fetch Google News RSS per destination and write
 * news-offline-snapshot.json with real article URLs for offline demo.
 *
 * Usage: node tools/scripts/generate-news-offline-snapshot.mjs
 */

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DESTINATIONS = [
  ['tokyo', 'Tokyo', 'asia'],
  ['bangkok', 'Bangkok', 'asia'],
  ['singapore', 'Singapore', 'asia'],
  ['seoul', 'Seoul', 'asia'],
  ['mumbai', 'Mumbai', 'asia'],
  ['paris', 'Paris', 'europe'],
  ['london', 'London', 'europe'],
  ['rome', 'Rome', 'europe'],
  ['barcelona', 'Barcelona', 'europe'],
  ['berlin', 'Berlin', 'europe'],
  ['marrakech', 'Marrakech', 'africa'],
  ['cairo', 'Cairo', 'africa'],
  ['cape-town', 'Cape Town', 'africa'],
  ['nairobi', 'Nairobi', 'africa'],
  ['lagos', 'Lagos', 'africa'],
  ['new-york', 'New York', 'north-america'],
  ['mexico-city', 'Mexico City', 'north-america'],
  ['toronto', 'Toronto', 'north-america'],
  ['los-angeles', 'Los Angeles', 'north-america'],
  ['vancouver', 'Vancouver', 'north-america'],
  ['cusco', 'Cusco', 'south-america'],
  ['rio', 'Rio de Janeiro', 'south-america'],
  ['buenos-aires', 'Buenos Aires', 'south-america'],
  ['bogota', 'Bogotá', 'south-america'],
  ['santiago', 'Santiago', 'south-america'],
  ['sydney', 'Sydney', 'oceania'],
  ['melbourne', 'Melbourne', 'oceania'],
  ['auckland', 'Auckland', 'oceania'],
  ['queenstown', 'Queenstown', 'oceania'],
  ['honolulu', 'Honolulu', 'oceania'],
];

const GOOGLE_NEWS_HOST = 'news.google.com';
const BATCH_EXECUTE_URL = 'https://news.google.com/_/DotsSplashUi/data/batchexecute';
const USER_AGENT = 'Mozilla/5.0 (compatible; rosettadash-news/1.0)';
const ARTICLES_PER_DESTINATION = 4;

function decodeEntities(value) {
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

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1] ? decodeEntities(match[1]) : undefined;
}

function splitHeadlineSource(title) {
  const dash = title.lastIndexOf(' - ');
  if (dash > 0) {
    return {
      headline: title.slice(0, dash).trim(),
      source: title.slice(dash + 3).trim(),
    };
  }
  return { headline: title.trim(), source: 'Google News' };
}

function articleId(url, headline) {
  return createHash('sha1').update(`${url}:${headline}`).digest('hex').slice(0, 16);
}

function parsePubDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

function parseRssFeed(xml, region) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const articles = [];
  for (const block of items) {
    const title = readTag(block, 'title');
    const link = readTag(block, 'link');
    if (!title || !link) {
      continue;
    }
    const { headline, source: titleSource } = splitHeadlineSource(title);
    const source = readTag(block, 'source') ?? titleSource;
    const description = readTag(block, 'description') ?? '';
    const pubDate = readTag(block, 'pubDate');
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

function isGoogleNewsArticleUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.replace(/^www\./, '') === GOOGLE_NEWS_HOST &&
      /\/(?:rss\/)?articles\//.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

function parseBatchExecuteBody(body) {
  let text = body;
  if (text.startsWith(")]}'")) {
    text = text.slice(4);
  }
  text = text.trimStart();
  const newline = text.indexOf('\n');
  if (newline > 0 && /^\d+$/.test(text.slice(0, newline).trim())) {
    text = text.slice(newline + 1);
  }
  return JSON.parse(text);
}

function* walkBatchEnvelopes(node) {
  if (!Array.isArray(node)) {
    return;
  }
  if (node.length >= 3 && node[0] === 'wrb.fr' && node[1] === 'Fbv4je') {
    yield node;
    return;
  }
  for (const child of node) {
    yield* walkBatchEnvelopes(child);
  }
}

async function resolveGoogleNewsArticleUrl(url) {
  if (!isGoogleNewsArticleUrl(url)) {
    return url;
  }
  const articleIdPart = url.split('/').pop().split('?')[0];
  const page = await fetch(`https://news.google.com/rss/articles/${articleIdPart}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!page.ok) {
    return url;
  }
  const html = await page.text();
  const signature = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!signature || !timestamp) {
    return url;
  }

  const rpcInner = JSON.stringify([
    'garturlreq',
    [
      [
        'X',
        'X',
        ['X', 'X'],
        null,
        null,
        1,
        1,
        'US:en',
        null,
        1,
        null,
        null,
        null,
        null,
        null,
        0,
        1,
      ],
      'X',
      'X',
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ],
    articleIdPart,
    Number(timestamp),
    signature,
  ]);
  const fReq = JSON.stringify([[['Fbv4je', rpcInner, null, 'generic']]]);
  const response = await fetch(BATCH_EXECUTE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Referer: 'https://news.google.com/',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({ 'f.req': fReq }),
  });
  if (!response.ok) {
    return url;
  }
  const envelopes = parseBatchExecuteBody(await response.text());
  for (const envelope of walkBatchEnvelopes(envelopes)) {
    const payload = JSON.parse(envelope[2]);
    if (payload[0] === 'garturlres' && typeof payload[1] === 'string') {
      return payload[1];
    }
  }
  return url;
}

async function fetchDestinationArticles(id, name, region) {
  const params = new URLSearchParams({
    q: `${name} travel tourism`,
    hl: 'en-US',
    gl: 'US',
    ceid: 'US:en',
  });
  const rssUrl = `https://news.google.com/rss/search?${params}`;
  const response = await fetch(rssUrl, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const parsed = parseRssFeed(await response.text(), region);
  const nameNeedle = name.toLowerCase();
  const ranked = parsed
    .filter((article) => {
      const text = `${article.headline} ${article.summary}`.toLowerCase();
      return text.includes(nameNeedle);
    })
    .slice(0, ARTICLES_PER_DESTINATION);

  const resolved = [];
  for (const article of ranked) {
    const url = await resolveGoogleNewsArticleUrl(article.url);
    resolved.push({ ...article, id: `${id}-${resolved.length + 1}`, url });
  }
  return resolved;
}

async function main() {
  const articles = [];
  for (const [id, name, region] of DESTINATIONS) {
    process.stderr.write(`Fetching ${name}…\n`);
    try {
      const batch = await fetchDestinationArticles(id, name, region);
      articles.push(...batch);
      process.stderr.write(`  ${batch.length} articles\n`);
    } catch (error) {
      process.stderr.write(`  failed: ${error instanceof Error ? error.message : error}\n`);
    }
  }

  const outPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../libs/destination-atlas/src/data/news-offline-snapshot.json',
  );
  writeFileSync(
    outPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), articles }, null, 2)}\n`,
  );
  process.stderr.write(`Wrote ${articles.length} articles to ${outPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
