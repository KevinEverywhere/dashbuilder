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

  test('text input is editable in preview', async ({ page }) => {
    await addFromPalette(page, 'visual.input.text');
    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    const input = page.getByTestId('preview-text-input');
    await input.fill('Hello preview');
    await expect(input).toHaveValue('Hello preview');
  });

  test('does not show component type names as on-page labels', async ({ page }) => {
    await addFromPalette(page, 'visual.input.text');
    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-text-input')).toBeVisible();
    const preview = page.getByTestId('preview-workspace');
    await expect(preview.getByText('Text Input', { exact: true })).toHaveCount(0);
    await expect(preview.locator('.preview-field__label')).toHaveCount(0);
  });

  test('shows field label only when label property is set', async ({ page }) => {
    await addFromPalette(page, 'visual.input.text');
    await page.getByTestId('canvas-node').click();
    await page.getByTestId('inspector-prop-label').fill('Customer name');

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.locator('.preview-field__label')).toHaveText('Customer name');
  });

  test('video source preview omits builder metadata labels', async ({ page }) => {
    await addFromPalette(page, 'visual.media.video-source');
    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    const preview = page.getByTestId('preview-plugin-media-video-source');
    await expect(preview).toBeVisible();
    await expect(preview.getByText('Choose video file')).toBeVisible();
    await expect(preview).not.toContainText('Video Source');
    await expect(preview).not.toContainText('640×360');
    await expect(preview).not.toContainText('4096×2048');
  });
});
