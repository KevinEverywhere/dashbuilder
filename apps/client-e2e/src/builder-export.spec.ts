import { test, expect } from '@playwright/test';
import { addFromPalette, dismissPlacementPromptIfVisible, openBuilder, selectCanvasNodeHeader, addPostgresqlApiBundle } from './test-helpers';

test.describe('Builder export wizard', () => {
  test.describe('React stack', () => {
    test.beforeEach(async ({ page }) => {
      await openBuilder(page);
    });

  test('locks the UI picker to the chosen React stack', async ({ page }) => {
    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-wizard')).toBeVisible();
    await expect(page.getByTestId('export-wizard-ui-targets')).toBeVisible();
    await expect(page.getByTestId('export-wizard-ui-react')).toBeVisible();
    await expect(page.getByTestId('export-wizard-ui-angular')).toHaveCount(0);
    await expect(page.getByTestId('export-wizard-ui-vue')).toHaveCount(0);
    await expect(page.getByTestId('export-wizard-ui-svelte')).toHaveCount(0);
    await expect(page.getByTestId('export-wizard-server-targets')).toBeVisible();
    await expect(page.getByTestId('export-wizard-server-nest')).toBeVisible();
    await expect(page.getByTestId('export-wizard-server-express')).toBeVisible();
    await expect(page.getByTestId('export-wizard-server-next')).toBeVisible();
    await expect(page.getByTestId('export-wizard-server-nuxt')).toHaveCount(0);
    await expect(page.getByTestId('export-wizard-database-targets')).toBeVisible();
    await expect(page.getByTestId('export-wizard-database-postgresql')).toBeVisible();
    await expect(page.getByTestId('export-wizard-database-mongodb')).toBeVisible();
    await expect(page.getByTestId('export-wizard-database-supabase')).toBeVisible();
    await expect(page.getByTestId('export-wizard-database-mysql')).toBeVisible();
  });

  test('shows validation errors for an empty composite', async ({ page }) => {
    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-wizard')).toBeVisible();
    await expect(page.getByTestId('export-wizard-ui-targets')).toBeVisible();
    await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('export-wizard-error')).toBeVisible();
    await expect(page.getByTestId('export-wizard-download')).toBeDisabled();
  });

  test('previews files and enables download for an export-ready composite', async ({ page }) => {
    await addFromPalette(page, 'infra.postgresql');
    await addFromPalette(page, 'infra.server.nest');
    await addFromPalette(page, 'visual.table');
    await expect(page.getByTestId('canvas-node')).toHaveCount(3);

    const postgresNode = page.getByTestId('canvas-node').nth(0);
    const tableNode = page.getByTestId('canvas-node').nth(2);

    await postgresNode.getByTestId(/^port-output-.*-rowset$/).click();
    await tableNode.getByTestId(/^port-input-.*-data$/).click();

    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-wizard')).toBeVisible();
    await expect(page.getByTestId('export-wizard-ui-react')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('export-wizard-files')).toBeVisible();
    await expect(page.getByTestId('export-wizard-files')).toContainText('src/Main.tsx');
    await expect(page.getByTestId('export-wizard-files')).toContainText('server/src/main.ts');
    await expect(page.getByTestId('export-wizard-download')).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-wizard-download').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/-export\.zip$/);
  });

  test('previews Express server files when Express target is selected', async ({ page }) => {
    await addFromPalette(page, 'infra.postgresql');
    await addFromPalette(page, 'infra.server.nest');
    await addFromPalette(page, 'visual.table');
    await expect(page.getByTestId('canvas-node')).toHaveCount(3);

    const postgresNode = page.getByTestId('canvas-node').nth(0);
    const tableNode = page.getByTestId('canvas-node').nth(2);

    await postgresNode.getByTestId(/^port-output-.*-rowset$/).click();
    await tableNode.getByTestId(/^port-input-.*-data$/).click();

    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-wizard')).toBeVisible();
    await page.getByTestId('export-wizard-server-express').click();
    await expect(page.getByTestId('export-wizard-server-express')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('export-wizard-targets')).toContainText('express');
    await expect(page.getByTestId('export-wizard-files')).toContainText('server/src/index.ts');
    await expect(page.getByTestId('export-wizard-files')).not.toContainText('server/src/main.ts');
    await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
  });

  test('previews MongoDB database files when MongoDB target is selected', async ({ page }) => {
    await addFromPalette(page, 'infra.mongodb');
    await addFromPalette(page, 'infra.server.nest');
    await addFromPalette(page, 'visual.table');
    await expect(page.getByTestId('canvas-node')).toHaveCount(3);

    const mongoNode = page.getByTestId('canvas-node').nth(0);
    const tableNode = page.getByTestId('canvas-node').nth(2);

    await mongoNode.getByTestId(/^port-output-.*-documents$/).click();
    await tableNode.getByTestId(/^port-input-.*-data$/).click();

    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-wizard')).toBeVisible();
    await page.getByTestId('export-wizard-database-mongodb').click();
    await expect(page.getByTestId('export-wizard-database-mongodb')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('export-wizard-targets')).toContainText('mongodb');
    await expect(page.getByTestId('export-wizard-files')).toContainText('database/src/mongo.client.ts');
    await expect(page.getByTestId('export-wizard-files')).not.toContainText('server/src/main.ts');
    await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
  });

  test('previews Supabase database files when Supabase target is selected', async ({ page }) => {
    await addFromPalette(page, 'infra.supabase');
    await addFromPalette(page, 'infra.server.nest');
    await addFromPalette(page, 'visual.table');
    await expect(page.getByTestId('canvas-node')).toHaveCount(3);

    const supabaseNode = page.getByTestId('canvas-node').nth(0);
    const tableNode = page.getByTestId('canvas-node').nth(2);

    await supabaseNode.getByTestId(/^port-output-.*-rowset$/).click();
    await tableNode.getByTestId(/^port-input-.*-data$/).click();

    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-wizard')).toBeVisible();
    await page.getByTestId('export-wizard-database-supabase').click();
    await expect(page.getByTestId('export-wizard-database-supabase')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('export-wizard-targets')).toContainText('supabase');
    await expect(page.getByTestId('export-wizard-files')).toContainText(
      'database/src/supabase.client.ts',
    );
    await expect(page.getByTestId('export-wizard-files')).not.toContainText('server/src/main.ts');
    await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
  });

  test('previews MySQL database files when MySQL target is selected', async ({ page }) => {
    await addFromPalette(page, 'infra.mysql');
    await addFromPalette(page, 'infra.server.nest');
    await addFromPalette(page, 'visual.table');
    await expect(page.getByTestId('canvas-node')).toHaveCount(3);

    const mysqlNode = page.getByTestId('canvas-node').nth(0);
    const tableNode = page.getByTestId('canvas-node').nth(2);

    await mysqlNode.getByTestId(/^port-output-.*-rowset$/).click();
    await tableNode.getByTestId(/^port-input-.*-data$/).click();

    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-wizard')).toBeVisible();
    await page.getByTestId('export-wizard-database-mysql').click();
    await expect(page.getByTestId('export-wizard-database-mysql')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('export-wizard-targets')).toContainText('mysql');
    await expect(page.getByTestId('export-wizard-files')).toContainText('database/src/mysql.pool.ts');
    await expect(page.getByTestId('export-wizard-files')).not.toContainText('server/src/main.ts');
    await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
  });

  test('exports only the selected node scope from the wizard', async ({ page }) => {
    await addFromPalette(page, 'infra.postgresql');
    await dismissPlacementPromptIfVisible(page);
    await addFromPalette(page, 'infra.server.nest');
    await dismissPlacementPromptIfVisible(page);
    await addFromPalette(page, 'visual.table');
    await dismissPlacementPromptIfVisible(page);
    await addFromPalette(page, 'visual.kpi');
    await dismissPlacementPromptIfVisible(page);
    await expect(page.getByTestId('canvas-node')).toHaveCount(4);

    const postgresNode = page.getByTestId('canvas-node').nth(0);
    const tableNode = page.getByTestId('canvas-node').nth(2);
    const kpiNode = page.getByTestId('canvas-node').nth(3);

    await postgresNode.getByTestId(/^port-output-.*-rowset$/).click();
    await tableNode.getByTestId(/^port-input-.*-data$/).click();

    await kpiNode.scrollIntoViewIfNeeded();
    await selectCanvasNodeHeader(page, kpiNode);
    await expect(kpiNode).toHaveAttribute('data-selected', 'true');

    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-wizard')).toBeVisible();
    await page.getByTestId('export-wizard-scope-single').click();
    await expect(page.getByTestId('export-wizard-scope-hint')).toContainText('KPI Card');
    await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('export-wizard-files')).toBeVisible();
    await expect(page.getByTestId('export-wizard-files')).not.toContainText('DataTable');
    await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
  });
  });

  test.describe('Angular stack', () => {
    test.beforeEach(async ({ page }) => {
      await openBuilder(page, { ui: 'angular' });
    });

    test('previews Angular UI files for the chosen Angular stack', async ({ page }) => {
      await addFromPalette(page, 'infra.postgresql');
      await addFromPalette(page, 'infra.server.nest');
      await addFromPalette(page, 'visual.table');
      await expect(page.getByTestId('canvas-node')).toHaveCount(3);

      const postgresNode = page.getByTestId('canvas-node').nth(0);
      const tableNode = page.getByTestId('canvas-node').nth(2);

      await postgresNode.getByTestId(/^port-output-.*-rowset$/).click();
      await tableNode.getByTestId(/^port-input-.*-data$/).click();

      await page.getByTestId('export-button').click();
      await expect(page.getByTestId('export-wizard')).toBeVisible();
      await expect(page.getByTestId('export-wizard-ui-angular')).toBeVisible();
      await expect(page.getByTestId('export-wizard-ui-angular')).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByTestId('export-wizard-ui-react')).toHaveCount(0);
      await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
      await expect(page.getByTestId('export-wizard-targets')).toContainText('angular UI');
      await expect(page.getByTestId('export-wizard-files')).toContainText('src/dashboard.component.ts');
      await expect(page.getByTestId('export-wizard-files')).not.toContainText('src/Main.tsx');
      await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
    });
  });

  test.describe('Vue stack', () => {
    test.beforeEach(async ({ page }) => {
      await openBuilder(page, { ui: 'vue' });
    });

    test('previews Vue UI files for the chosen Vue stack', async ({ page }) => {
      await addFromPalette(page, 'infra.postgresql');
      await addFromPalette(page, 'infra.server.nest');
      await addFromPalette(page, 'visual.table');
      await expect(page.getByTestId('canvas-node')).toHaveCount(3);

      const postgresNode = page.getByTestId('canvas-node').nth(0);
      const tableNode = page.getByTestId('canvas-node').nth(2);

      await postgresNode.getByTestId(/^port-output-.*-rowset$/).click();
      await tableNode.getByTestId(/^port-input-.*-data$/).click();

      await page.getByTestId('export-button').click();
      await expect(page.getByTestId('export-wizard')).toBeVisible();
      await expect(page.getByTestId('export-wizard-ui-vue')).toBeVisible();
      await expect(page.getByTestId('export-wizard-ui-vue')).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByTestId('export-wizard-ui-react')).toHaveCount(0);
      await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
      await expect(page.getByTestId('export-wizard-targets')).toContainText('vue UI');
      await expect(page.getByTestId('export-wizard-files')).toContainText('src/Dashboard.vue');
      await expect(page.getByTestId('export-wizard-files')).not.toContainText('src/Main.tsx');
      await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
    });
  });

  test.describe('Svelte stack', () => {
    test.beforeEach(async ({ page }) => {
      await openBuilder(page, { ui: 'svelte' });
    });

    test('previews Svelte UI files for the chosen Svelte stack', async ({ page }) => {
      await addFromPalette(page, 'infra.postgresql');
      await addFromPalette(page, 'infra.server.nest');
      await addFromPalette(page, 'visual.table');
      await expect(page.getByTestId('canvas-node')).toHaveCount(3);

      const postgresNode = page.getByTestId('canvas-node').nth(0);
      const tableNode = page.getByTestId('canvas-node').nth(2);

      await postgresNode.getByTestId(/^port-output-.*-rowset$/).click();
      await tableNode.getByTestId(/^port-input-.*-data$/).click();

      await page.getByTestId('export-button').click();
      await expect(page.getByTestId('export-wizard')).toBeVisible();
      await expect(page.getByTestId('export-wizard-ui-svelte')).toBeVisible();
      await expect(page.getByTestId('export-wizard-ui-svelte')).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByTestId('export-wizard-ui-react')).toHaveCount(0);
      await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
      await expect(page.getByTestId('export-wizard-targets')).toContainText('svelte UI');
      await expect(page.getByTestId('export-wizard-files')).toContainText('src/Dashboard.svelte');
      await expect(page.getByTestId('export-wizard-files')).not.toContainText('src/Main.tsx');
      await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
    });

    test('previews Nest API files for postgres table data wiring', async ({ page }) => {
      await addPostgresqlApiBundle(page);

      await page.getByTestId('export-button').click();
      await expect(page.getByTestId('export-wizard')).toBeVisible();
      await expect(page.getByTestId('export-wizard-loading')).toBeHidden({ timeout: 30_000 });
      await expect(page.getByTestId('export-wizard-targets')).toContainText('nest');
      await expect(page.getByTestId('export-wizard-files')).toContainText('server/src/main.ts');
      await expect(page.getByTestId('export-wizard-files')).toContainText(
        'server/src/sales/sales.controller.ts',
      );
      await expect(page.getByTestId('export-wizard-files')).toContainText(
        /src\/lib\/data\/use.+Data\.svelte\.ts/,
      );
      await expect(page.getByTestId('export-wizard-download')).toBeEnabled();
    });
  });
});
