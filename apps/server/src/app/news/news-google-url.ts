const GOOGLE_NEWS_HOST = 'news.google.com';
const BATCH_EXECUTE_URL = 'https://news.google.com/_/DotsSplashUi/data/batchexecute';
const USER_AGENT = 'Mozilla/5.0 (compatible; rosettadash-news/1.0)';

export function isGoogleNewsArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.replace(/^www\./, '') !== GOOGLE_NEWS_HOST) {
      return false;
    }
    return /\/(?:rss\/)?articles\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

function googleNewsArticleId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.replace(/^www\./, '') !== GOOGLE_NEWS_HOST) {
      return null;
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    const articlesIndex = parts.findIndex((part) => part === 'articles');
    if (articlesIndex < 0 || articlesIndex >= parts.length - 1) {
      return null;
    }
    return parts[articlesIndex + 1] ?? null;
  } catch {
    return null;
  }
}

function parseBatchExecuteBody(body: string): unknown {
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

function* walkBatchEnvelopes(node: unknown): Generator<unknown[]> {
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

function buildDecodePayload(articleId: string, timestamp: string, signature: string): string {
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
    articleId,
    Number(timestamp),
    signature,
  ]);

  return JSON.stringify([[['Fbv4je', rpcInner, null, 'generic']]]);
}

async function fetchDecodingParams(articleUrl: string, articleId: string): Promise<{
  signature: string;
  timestamp: string;
} | null> {
  for (const prefix of ['rss/articles', 'articles'] as const) {
    const pageUrl = `https://news.google.com/${prefix}/${articleId}`;
    try {
      const response = await fetch(pageUrl, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      });
      if (!response.ok) {
        continue;
      }
      const html = await response.text();
      const signature = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
      const timestamp = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
      if (signature && timestamp && /^\d+$/.test(timestamp)) {
        return { signature, timestamp };
      }
    } catch {
      // Try the alternate article landing path.
    }
  }

  try {
    const response = await fetch(articleUrl, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const signature = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const timestamp = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (signature && timestamp && /^\d+$/.test(timestamp)) {
      return { signature, timestamp };
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolve a Google News wrapper URL to the publisher article URL. */
export async function resolveGoogleNewsArticleUrl(url: string): Promise<string | null> {
  if (!isGoogleNewsArticleUrl(url)) {
    return url;
  }

  const articleId = googleNewsArticleId(url);
  if (!articleId) {
    return null;
  }

  const params = await fetchDecodingParams(url, articleId);
  if (!params) {
    return null;
  }

  try {
    const response = await fetch(BATCH_EXECUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Referer: 'https://news.google.com/',
        'User-Agent': USER_AGENT,
      },
      body: new URLSearchParams({
        'f.req': buildDecodePayload(articleId, params.timestamp, params.signature),
      }),
    });
    if (!response.ok) {
      return null;
    }

    const envelopes = parseBatchExecuteBody(await response.text());
    for (const envelope of walkBatchEnvelopes(envelopes)) {
      if (typeof envelope[2] !== 'string') {
        continue;
      }
      const payload = JSON.parse(envelope[2]) as unknown;
      if (
        Array.isArray(payload) &&
        payload.length >= 2 &&
        payload[0] === 'garturlres' &&
        typeof payload[1] === 'string' &&
        payload[1].startsWith('http')
      ) {
        return payload[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function resolveGoogleNewsArticles<T extends { url: string }>(
  articles: T[],
  concurrency = 5,
): Promise<T[]> {
  const resolved: T[] = [];
  for (let index = 0; index < articles.length; index += concurrency) {
    const chunk = articles.slice(index, index + concurrency);
    const batch = await Promise.all(
      chunk.map(async (article) => {
        if (!isGoogleNewsArticleUrl(article.url)) {
          return article;
        }
        const publisherUrl = await resolveGoogleNewsArticleUrl(article.url);
        return publisherUrl ? { ...article, url: publisherUrl } : article;
      }),
    );
    resolved.push(...batch);
  }
  return resolved;
}
