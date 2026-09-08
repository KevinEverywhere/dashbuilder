import {
  isGoogleNewsArticleUrl,
  resolveGoogleNewsArticleUrl,
  resolveGoogleNewsArticles,
} from './news-google-url.js';

describe('news-google-url', () => {
  it('detects Google News article wrapper URLs', () => {
    expect(
      isGoogleNewsArticleUrl(
        'https://news.google.com/rss/articles/CBMiTEST?oc=5',
      ),
    ).toBe(true);
    expect(isGoogleNewsArticleUrl('https://news.google.com/search?q=tokyo')).toBe(false);
    expect(isGoogleNewsArticleUrl('https://example.com/story')).toBe(false);
  });

  it('resolves a Google News wrapper to the publisher URL', async () => {
    const googleUrl = 'https://news.google.com/rss/articles/CBMiTEST?oc=5';
    const articleHtml =
      '<html><body><div data-n-a-sg="sig123" data-n-a-ts="1700000000"></div></body></html>';
    const batchBody = `)]}'\n\n[["wrb.fr","Fbv4je","[\\"garturlres\\",\\"https://publisher.example/story\\"]",null,null,null,"generic"]]`;

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('batchexecute')) {
        return {
          ok: true,
          text: async () => batchBody,
        } as Response;
      }
      return {
        ok: true,
        text: async () => articleHtml,
      } as Response;
    }) as typeof fetch;

    await expect(resolveGoogleNewsArticleUrl(googleUrl)).resolves.toBe(
      'https://publisher.example/story',
    );
  });

  it('leaves non-Google URLs unchanged during batch resolution', async () => {
    const articles = [{ id: '1', url: 'https://example.com/article' }];
    await expect(resolveGoogleNewsArticles(articles)).resolves.toEqual(articles);
  });
});
