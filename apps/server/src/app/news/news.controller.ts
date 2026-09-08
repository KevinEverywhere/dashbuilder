import { Controller, Get, Query } from '@nestjs/common';

import { NewsService } from './news.service.js';
import type { NewsArticle } from './news.types.js';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async listNews(
    @Query('q') q?: string,
    @Query('region') region?: string,
    @Query('destination') destination?: string,
    @Query('destinationId') destinationId?: string,
  ): Promise<NewsArticle[]> {
    return this.newsService.list({
      q,
      region,
      destinationId: destinationId ?? destination,
    });
  }
}
