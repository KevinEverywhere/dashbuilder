import { NewsIngestService } from './news-ingest.service.js';
import { NewsService } from './news.service.js';

describe('NewsService', () => {
  let ingest: NewsIngestService;
  let service: NewsService;

  beforeEach(() => {
    ingest = new NewsIngestService();
    service = new NewsService(ingest);
  });

  it('filters cached articles by query and region', async () => {
    ingest['cache'] = {
      fetchedAt: Date.now(),
      feeds: ingest.listFeeds(),
      articles: [
        {
          id: '1',
          headline: 'Tokyo tourism rebounds',
          source: 'Pacific Travel Daily',
          region: 'asia',
          publishedAt: '2024-11-02',
          summary: 'Visitor arrivals exceeded 2019 totals.',
          url: 'https://example.com/1',
        },
        {
          id: '2',
          headline: 'Paris museums extend hours',
          source: 'Europe Heritage Wire',
          region: 'europe',
          publishedAt: '2024-10-18',
          summary: 'City officials expand late openings.',
          url: 'https://example.com/2',
        },
      ],
    };

    const tokyoRows = await service.list({ q: 'Tokyo' });
    expect(tokyoRows).toHaveLength(1);
    expect(tokyoRows[0]?.headline).toContain('Tokyo');

    const europeRows = await service.list({ region: 'europe' });
    expect(europeRows).toHaveLength(1);
    expect(europeRows[0]?.region).toBe('europe');
  });

  it('scopes destination lookups by destination id', async () => {
    ingest['cache'] = {
      fetchedAt: Date.now(),
      feeds: [
        ...ingest.listFeeds(),
        { id: 'destination-tokyo', query: 'Tokyo travel tourism', region: 'asia' },
      ],
      articles: [
        {
          id: '1',
          headline: 'Tokyo tourism rebounds',
          source: 'Pacific Travel Daily',
          region: 'asia',
          publishedAt: '2024-11-02',
          summary: 'Visitor arrivals exceeded 2019 totals.',
          url: 'https://example.com/1',
        },
        {
          id: '2',
          headline: 'Paris museums extend hours',
          source: 'Europe Heritage Wire',
          region: 'europe',
          publishedAt: '2024-10-18',
          summary: 'City officials expand late openings.',
          url: 'https://example.com/2',
        },
      ],
    };

    const tokyoScoped = await service.list({ destinationId: 'tokyo' });
    expect(tokyoScoped.some((row) => row.headline.includes('Tokyo'))).toBe(true);
    expect(tokyoScoped.every((row) => row.region === 'asia' || row.headline.includes('Tokyo'))).toBe(
      true,
    );
  });
});
