import { test, expect } from '@playwright/test';
import { openBuilderViaWelcome, fillWelcomeDashboardName } from './test-helpers';

test.describe('Welcome page entry', () => {
  test('shows empty stack state, then continues after choosing a framework', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await expect(page.getByTestId('welcome-heading')).toBeVisible();
    await expect(page.getByTestId('welcome-framework-prompt')).toBeVisible();
    await expect(page.getByTestId('stack-section-panel-ui')).toHaveCount(0);
    await expect(page.getByTestId('stack-section-toggle-server')).toBeVisible();
    await expect(page.getByTestId('stack-section-toggle-styling')).toBeVisible();
    await expect(page.getByTestId('welcome-continue')).toBeDisabled();

    await page.getByTestId('stack-section-toggle-ui').click();
    await page.getByTestId('stack-ui-react').click();
    await fillWelcomeDashboardName(page);
    await expect(page.getByTestId('welcome-continue')).toBeEnabled();

    await page.getByTestId('stack-section-toggle-styling').click();
    await expect(page.getByTestId('stack-styling-authoring-css-modules')).toBeVisible();

    await page.getByTestId('welcome-continue').click();
    await expect(page.getByTestId('builder-shell')).toBeVisible({ timeout: 120_000 });
  });

  test('redirects fresh /builder visits to the welcome page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/builder');

    await expect(page.getByTestId('welcome-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('builder-shell')).toHaveCount(0);
  });

  test('shows welcome at root even when a builder session exists', async ({ page }) => {
    await openBuilderViaWelcome(page);

    await page.goto('/');
    await expect(page.getByTestId('welcome-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('welcome-resume-note')).toBeVisible();
    await expect(page.getByTestId('welcome-framework-prompt')).toBeVisible();
    await expect(page.getByTestId('builder-shell')).toHaveCount(0);

    await page.getByTestId('welcome-continue').click();
    await expect(page.getByTestId('builder-shell')).toBeVisible({ timeout: 120_000 });
  });
});
