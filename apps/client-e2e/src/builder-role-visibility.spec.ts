import { test, expect } from '@playwright/test';
import { addFromPalette, expandInspectorSection, inspectFromPalette, openBuilder, selectAppOption, selectCanvasNode } from './test-helpers';

test.describe('Builder role visibility', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('shows and hides role gates based on preview role', async ({ page }) => {
    await addFromPalette(page, 'visual.input.text');
    await inspectFromPalette(page, 'visual.input.text');
    await expandInspectorSection(page, 'domain');
    await selectAppOption(page, 'domain-role-preset', 'admin');
    await selectAppOption(page, 'domain-role-preset', 'viewer');

    await addFromPalette(page, 'domain.role-gate');

    await page.getByTestId('mode-preview').click();
    await selectAppOption(page, 'preview-role-select', 'viewer');
    await expect(page.getByTestId('preview-role-gate')).toHaveCount(0);

    await selectAppOption(page, 'preview-role-select', 'admin');
    await expect(page.getByTestId('preview-role-gate')).toBeVisible();
  });
});
