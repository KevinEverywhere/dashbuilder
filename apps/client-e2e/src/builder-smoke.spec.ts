import { test, expect } from '@playwright/test';
import { addFromPalette, expandInspectorSection, openBuilder, selectCanvasNode } from './test-helpers';

test.describe('Builder smoke', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('adds a component, edits a property, saves, and restores after reload', async ({
    page,
  }) => {
    await addFromPalette(page, 'visual.input.text');
    await expect(page.getByTestId('canvas-node')).toHaveCount(1);

    await selectCanvasNode(page, page.getByTestId('canvas-node'));
    await expandInspectorSection(page, 'properties');
    await page.getByTestId('inspector-prop-placeholder').fill('Email address');

    await expect(page.getByTestId('save-status')).toContainText('Unsaved');
    await page.getByTestId('save-button').click();
    await expect(page.getByTestId('save-status')).toContainText('Saved');

    await page.reload();
    await expect(page.getByTestId('builder-loading')).toBeHidden({ timeout: 120_000 });
    await expect(page.getByTestId('canvas-node')).toHaveCount(1);

    await selectCanvasNode(page, page.getByTestId('canvas-node'));
    await expandInspectorSection(page, 'properties');
    await expect(page.getByTestId('inspector-prop-placeholder')).toHaveValue('Email address');
  });
});
