import { test, expect } from '@playwright/test';
import { addFromPalette, openBuilder, waitForPreviewData } from './test-helpers';

test.describe('Builder preview presentation', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('renders presentation-ready preview without builder placement chrome', async ({ page }) => {
    await addFromPalette(page, 'visual.input.text');
    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-text-input')).toBeVisible();
    await expect(page.getByTestId('preview-node-header')).toHaveCount(0);
    await expect(page.locator('.preview__node-frame')).toHaveCount(0);
  });

  test('video source uses display size in preview (not equirect source dimensions)', async ({
    page,
  }) => {
    await addFromPalette(page, 'visual.media.video-source');
    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    const preview = page.getByTestId('preview-plugin-media-video-source');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('640×360');
    await expect(preview).not.toContainText('4096×2048');
  });
});
