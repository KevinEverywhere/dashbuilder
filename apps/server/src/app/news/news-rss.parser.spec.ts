import { parseRssFeed } from './news-rss.parser.js';

describe('parseRssFeed', () => {
  it('normalizes RSS items into news articles', () => {
    const xml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>Tokyo tourism rebounds - Pacific Travel Daily</title>
    <link>https://example.com/tokyo</link>
    <pubDate>Mon, 02 Nov 2024 08:00:00 GMT</pubDate>
    <description><![CDATA[Visitor arrivals exceeded 2019 totals.]]></description>
    <source url="https://example.com">Pacific Travel Daily</source>
  </item>
</channel></rss>`;

    const articles = parseRssFeed(xml, 'asia');
    expect(articles).toHaveLength(1);
    expect(articles[0]?.headline).toBe('Tokyo tourism rebounds');
    expect(articles[0]?.source).toBe('Pacific Travel Daily');
    expect(articles[0]?.region).toBe('asia');
    expect(articles[0]?.url).toBe('https://example.com/tokyo');
    expect(articles[0]?.publishedAt).toBe('2024-11-02');
  });
});
