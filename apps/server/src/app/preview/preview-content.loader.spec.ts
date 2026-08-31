import { loadPreviewContent } from './preview-content.loader';

describe('loadPreviewContent', () => {
  it('loads preview-content.json from the workspace', () => {
    const { document, slice } = loadPreviewContent(process.cwd());
    expect(document.sources.orders?.table).toBe('orders');
    expect(slice.tableRows[0]?.name).toBe('Globex LLC');
  });
});
