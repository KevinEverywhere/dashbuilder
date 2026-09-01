import { test, expect } from '@playwright/test';
import { openBuilder, selectAppOption, waitForPreviewData } from './test-helpers';

async function applyTemplate(page: import('@playwright/test').Page, templateId: string): Promise<void> {
  await selectAppOption(page, 'template-picker', templateId);
  await page.getByTestId('apply-template').click();
}

// Toolbar template picker is hidden until templates are ready to ship.
test.describe.skip('Builder onboarding template', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('applies onboarding template and persists after save and reload', async ({ page }) => {
    await applyTemplate(page, 'onboarding');

    await expect(page.getByText('5 component(s)')).toBeVisible();
    await expect(page.getByTestId('canvas-node').filter({ hasText: 'Invite person' })).toBeVisible();
    await expect(page.getByTestId('canvas-node').filter({ hasText: 'Assign role' })).toBeVisible();

    await expect(page.getByTestId('save-status')).toContainText('Unsaved');
    await page.getByTestId('save-button').click();
    await expect(page.getByTestId('save-status')).toContainText('Saved');

    await page.reload();
    await expect(page.getByTestId('builder-loading')).toBeHidden({ timeout: 120_000 });
    await expect(page.getByText('5 component(s)')).toBeVisible();
    await expect(page.getByTestId('canvas-node').filter({ hasText: 'Invite person' })).toBeVisible();
  });

  test('shows onboarding preview steps', async ({ page }) => {
    await applyTemplate(page, 'onboarding');
    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);

    await expect(page.getByTestId('preview-person-invite')).toBeVisible();
    await expect(page.getByTestId('preview-role-assign')).toBeVisible();
    await expect(page.getByTestId('preview-person-invite-submit')).toContainText('Send invite');
    await expect(page.getByTestId('preview-role-assign-confirm')).toContainText('Confirm access');
  });
});

test.describe.skip('Builder page templates', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('applies analytics overview template with bound table and chart', async ({ page }) => {
    await applyTemplate(page, 'analytics-overview');

    await expect(page.getByText('7 component(s)')).toBeVisible();
    await expect(page.getByTestId('canvas-node-name').filter({ hasText: 'Date range' })).toBeVisible();
    await expect(page.getByTestId('canvas-node-name').filter({ hasText: 'Sales table' })).toBeVisible();
    await expect(page.getByTestId('canvas-node-name').filter({ hasText: 'Trend chart' })).toBeVisible();

    await page.getByTestId('mode-preview').click();
    await waitForPreviewData(page);
    await expect(page.getByTestId('preview-date-range')).toBeVisible();
    await expect(page.getByTestId('preview-table')).toBeVisible();
    await expect(page.getByTestId('preview-line-chart')).toBeVisible();
  });

  test('lists all templates in the picker', async ({ page }) => {
    await page.getByTestId('template-picker-trigger').click();
    await expect(page.getByTestId('template-picker-menu')).toBeVisible();
    await expect(page.getByTestId('template-picker-option-onboarding')).toBeVisible();
    await expect(page.getByTestId('template-picker-option-analytics-overview')).toBeVisible();
    await expect(page.getByTestId('template-picker-option-crud-list')).toBeVisible();
    await expect(page.getByTestId('template-picker-option-settings-admin')).toBeVisible();
    await expect(page.getByTestId('template-picker-option-empty-starter')).toBeVisible();
  });

  test('applies a template from the pulldown without clicking Apply', async ({ page }) => {
    await selectAppOption(page, 'template-picker', 'onboarding');

    await expect(page.getByText('5 component(s)')).toBeVisible();
    await expect(page.getByTestId('canvas-node').filter({ hasText: 'Invite person' })).toBeVisible();
  });
});
