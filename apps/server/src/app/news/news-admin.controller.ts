import { Body, Controller, Get, Post, Put } from '@nestjs/common';

import { NewsService } from './news.service.js';
import type { NewsAdminStatus, NewsFeedConfig } from './news.types.js';

@Controller('news/admin')
export class NewsAdminController {
  constructor(private readonly newsService: NewsService) {}

  @Get('status')
  status(): NewsAdminStatus {
    return this.newsService.adminStatus();
  }

  @Post('refresh')
  async refresh(): Promise<NewsAdminStatus> {
    return this.newsService.adminRefresh();
  }

  @Put('feeds')
  replaceFeeds(@Body() body: { feeds?: NewsFeedConfig[] }): NewsAdminStatus {
    return this.newsService.adminReplaceFeeds(body.feeds ?? []);
  }
}
