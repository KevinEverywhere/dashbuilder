import { Module } from '@nestjs/common';

import { NewsAdminController } from './news-admin.controller.js';
import { NewsController } from './news.controller.js';
import { NewsIngestService } from './news-ingest.service.js';
import { NewsService } from './news.service.js';

@Module({
  controllers: [NewsController, NewsAdminController],
  providers: [NewsIngestService, NewsService],
  exports: [NewsService],
})
export class NewsModule {}
