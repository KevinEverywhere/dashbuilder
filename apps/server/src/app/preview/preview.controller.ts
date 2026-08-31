import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { PreviewDataRequest } from '@rosettadash/ui-primitives';
import { probeDataSource, type DataSourceProbeRequest } from './preview-probe.service';
import { loadPreviewContent, resolvePreviewContentPath } from './preview-content.loader';
import { PreviewService } from './preview.service';
import { readFileSync } from 'node:fs';

@Controller('preview')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @Get('content')
  getPreviewContent() {
    return loadPreviewContent().document;
  }

  @Get('content/raw')
  getPreviewContentRaw(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Content-Type', 'application/json');
    return readFileSync(resolvePreviewContentPath(), 'utf8');
  }

  @Post('data')
  generatePreviewContent(@Body() body: PreviewDataRequest = {}) {
    return this.previewService.generatePreviewContent(body);
  }

  @Post('probe-source')
  async probeSource(@Body() body: DataSourceProbeRequest) {
    return probeDataSource(body);
  }
}
