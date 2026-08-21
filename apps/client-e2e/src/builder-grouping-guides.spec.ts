import { test, expect } from '@playwright/test';
import { addFromPalette, openBuilder, openPaletteInfo, openPaletteLink } from './test-helpers';

test.describe('Builder grouping guides', () => {
  test('shows palette info panel and canvas placement prompt for table when assistance is enabled', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('rosettadash:builder:how-it-works-assistance', '1');
    });
    await openBuilder(page);

    await openPaletteInfo(page, 'visual.table');
    await expect(page.getByTestId('palette-guide-info-visual.table')).toBeVisible();
    await expect(page.getByTestId('palette-guide-info-visual.table')).toContainText('Tabular data view');
    await expect(page.getByTestId('palette-instruction-step-visual.table-1')).toBeVisible();
    await expect(page.getByTestId('palette-guide-info-visual.table')).toContainText('5 steps');

    await addFromPalette(page, 'visual.table');
    await expect(page.getByTestId('canvas-placement-prompt')).toBeVisible();
    await expect(page.getByTestId('canvas-instruction-step-visual.table-1')).toBeVisible();
    await expect(page.getByTestId('canvas-placement-add-visual.input.date-range')).toBeVisible();

    await page.getByTestId('canvas-placement-add-visual.input.date-range').click();
    await expect(page.getByTestId('canvas-node')).toHaveCount(2);
  });

  test('shows palette link panel with companion quick-add', async ({ page }) => {
    await openBuilder(page);
    await openPaletteLink(page, 'visual.kpi');
    await expect(page.getByTestId('palette-guide-link-visual.kpi')).toBeVisible();
    await expect(page.getByTestId('palette-companion-add-visual.kpi-infra.postgresql')).toBeVisible();
  });
});
