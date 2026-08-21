import { test, expect } from '@playwright/test';
import { addFromPalette, expandInspectorSection, openBuilder, selectCanvasNode, waitForPreviewData } from './test-helpers';

test.describe('Builder preview', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('renders visual components in preview mode and reflects property edits', async ({
    page,
  }) => {
    await addFromPalette(page, 'visual.input.text');
    await expect(page.getByTestId('canvas-node')).toHaveCount(1);

    await selectCanvasNode(page, page.getByTestId('canvas-node'));
    await expandInspectorSection(page, 'properties');
    await page.getByTestId('inspector-prop-placeholder').fill('Customer name');

    await page.getByTestId('mode-preview').click();
    await expect(page.getByTestId('preview-workspace')).toBeVisible();
    await expect(page.getByTestId('preview-panel')).toBeVisible();
    await waitForPreviewData(page);
    await expect(page.getByTestId('preview-data-source')).toContainText('API');
    await expect(page.getByTestId('preview-text-input')).toHaveAttribute(
      'placeholder',
      'Customer name',
    );

    await page.getByTestId('mode-design').click();
    await expect(page.getByTestId('design-workspace')).toBeVisible();
    await expect(page.getByTestId('canvas-node')).toHaveCount(1);
  });

  test('shows table and chart previews for P0 visual components', async ({ page }) => {
    await addFromPalette(page, 'visual.table');
    await addFromPalette(page, 'visual.chart.line');

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);
    await expect(page.getByTestId('preview-table')).toBeVisible();
    await expect(page.getByTestId('preview-line-chart')).toBeVisible();
  });

  test('shows P1 form input previews', async ({ page }) => {
    await addFromPalette(page, 'visual.input.number');
    await addFromPalette(page, 'visual.input.checkbox');
    await addFromPalette(page, 'visual.input.textarea');

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);
    await expect(page.getByTestId('preview-number-input')).toBeVisible();
    await expect(page.getByTestId('preview-checkbox')).toBeVisible();
    await expect(page.getByTestId('preview-textarea')).toBeVisible();
  });

  test('shows pie chart and flex layout previews', async ({ page }) => {
    await addFromPalette(page, 'visual.chart.pie');
    await addFromPalette(page, 'layout.flex');

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);
    await expect(page.getByTestId('preview-pie-chart')).toBeVisible();
    await expect(page.getByTestId('preview-flex')).toBeVisible();
  });

  test('shows detail panel for table row selection in preview', async ({ page }) => {
    await addFromPalette(page, 'visual.table');
    await addFromPalette(page, 'visual.detail');

    const nodes = page.getByTestId('canvas-node');
    const tableNode = nodes.nth(0);
    const detailNode = nodes.nth(1);

    await tableNode.getByTestId(/^port-output-.*-selected-row$/).click();
    await detailNode.getByTestId(/^port-input-.*-row$/).click();

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-detail')).toBeVisible();

    const firstRow = page.getByTestId('preview-table').locator('tbody tr').first();
    await firstRow.click();
    await expect(page.getByTestId('preview-detail')).toContainText('name');
  });

  test('shows loading skeleton preview', async ({ page }) => {
    await addFromPalette(page, 'visual.skeleton');

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-skeleton')).toBeVisible();
    await expect(page.locator('.preview-skeleton__line').first()).toBeVisible();
  });

  test('hides skeleton after table data loads in preview', async ({ page }) => {
    await addFromPalette(page, 'visual.skeleton');
    await addFromPalette(page, 'visual.table');

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-table')).toBeVisible();
    await expect(page.getByTestId('preview-skeleton-loaded')).toBeVisible();
  });

  test('shows timer ticks in preview', async ({ page }) => {
    await addFromPalette(page, 'logic.timer');

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-timer')).toBeVisible();
    await expect(page.getByTestId('preview-timer-elapsed')).toContainText('0 ticks');
    await page.waitForTimeout(1100);
    await expect(page.getByTestId('preview-timer-elapsed')).toContainText('1 ticks');
  });
});
