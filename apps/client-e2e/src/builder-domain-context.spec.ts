import { test, expect } from '@playwright/test';
import { addFromPalette, expandInspectorSection, inspectFromPalette, openBuilder, selectAppOption } from './test-helpers';

test.describe('Builder domain context', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('persists domain context after save and reload', async ({ page }) => {
    await addFromPalette(page, 'visual.input.text');
    await inspectFromPalette(page, 'visual.input.text');
    await expandInspectorSection(page, 'domain');
    await page.getByTestId('domain-client-name').fill('Northwind Logistics');
    await page.getByTestId('domain-project-name').fill('Fleet Analytics');
    await selectAppOption(page, 'domain-default-time-range', 'last-30-days');

    await expect(page.getByTestId('save-status')).toContainText('Unsaved');
    await page.getByTestId('save-button').click();
    await expect(page.getByTestId('save-status')).toContainText('Saved');

    await page.reload();
    await expect(page.getByTestId('builder-loading')).toBeHidden({ timeout: 120_000 });
    await inspectFromPalette(page, 'visual.input.text');
    await expandInspectorSection(page, 'domain');

    await expect(page.getByTestId('domain-client-name')).toHaveValue('Northwind Logistics');
    await expect(page.getByTestId('domain-project-name')).toHaveValue('Fleet Analytics');
    await expect(page.getByTestId('domain-default-time-range-trigger')).toContainText('Last 30 days');
    await expect(page.getByTestId('domain-client-id')).toHaveValue('northwind-logistics');
  });
});
