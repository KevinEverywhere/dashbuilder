import { test, expect } from '@playwright/test';
import { addFromPalette, openBuilder, waitForPreviewData } from './test-helpers';

test.describe('Builder preview binding flow', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('filters table and chart from date range bindings in preview', async ({ page }) => {
    await addFromPalette(page, 'visual.input.date-range');
    await addFromPalette(page, 'visual.table');
    await addFromPalette(page, 'visual.chart.line');
    await expect(page.getByTestId('canvas-node')).toHaveCount(3);

    const nodes = page.getByTestId('canvas-node');
    const dateRangeNode = nodes.nth(0);
    const tableNode = nodes.nth(1);
    const chartNode = nodes.nth(2);

    await dateRangeNode.getByTestId(/^port-output-.*-range$/).click();
    await tableNode.getByTestId(/^port-input-.*-filter$/).click();

    await dateRangeNode.getByTestId(/^port-output-.*-range$/).click();
    await chartNode.getByTestId(/^port-input-.*-range$/).click();

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-table').first()).toBeVisible();
    await expect(page.getByTestId('preview-line-chart')).toBeVisible();
  });

  test('filters table from time preset bindings in preview', async ({ page }) => {
    await addFromPalette(page, 'domain.time-preset');
    await addFromPalette(page, 'visual.table');
    await expect(page.getByTestId('canvas-node')).toHaveCount(2);

    const timePresetNode = page.getByTestId('canvas-node').nth(0);
    const tableNode = page.getByTestId('canvas-node').nth(1);

    await timePresetNode.getByTestId(/^port-output-.*-range$/).click();
    await tableNode.getByTestId(/^port-input-.*-filter$/).click();

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-time-preset')).toBeVisible();
    await expect(page.getByTestId('preview-table').first()).toBeVisible();

    await page.getByRole('button', { name: 'Last 30 days' }).click();
    await waitForPreviewData(page);
    await expect(page.locator('.preview-time-preset__button--active')).toHaveText('Last 30 days');
  });
});
