import { Injectable } from '@nestjs/common';
import { PreviewDataRequest, generatePreviewData } from '@rosettadash/ui-primitives';
import { loadPreviewContent } from './preview-content.loader';

@Injectable()
export class PreviewService {
  generatePreviewContent(request: PreviewDataRequest = {}) {
    const { slice } = loadPreviewContent();
    return generatePreviewData({
      ...request,
      contentSlice: slice,
    });
  }

  /** @deprecated Use generatePreviewContent */
  generateMockData(request: PreviewDataRequest = {}) {
    return this.generatePreviewContent(request);
  }
}
