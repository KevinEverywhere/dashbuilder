import { expect, Page } from '@playwright/test';
import { findPaletteGroupIdForType } from '../../../packages/core/src/lib/palette/palette-groups';

export async function selectAppOption(page: Page, testId: string, value: string): Promise<void> {
  await page.getByTestId(`${testId}-trigger`).click();
  const option = page.getByTestId(`${testId}-option-${value}`);
  await expect(option).toBeVisible();
  await option.click();
}

export async function expandPaletteGroup(page: Page, groupId: string): Promise<void> {
  await ensurePaletteVisible(page);
  const panel = page.getByTestId(`palette-group-panel-${groupId}`);
  if (await panel.isVisible().catch(() => false)) {
    return;
  }
  await page.getByTestId(`palette-group-toggle-${groupId}`).click();
  await expect(panel).toBeVisible();
}

export async function expandPaletteGroupForType(page: Page, type: string): Promise<void> {
  const groupId = findPaletteGroupIdForType(type);
  if (!groupId) {
    throw new Error(`No palette group registered for type: ${type}`);
  }
  await expandPaletteGroup(page, groupId);
}

export async function addFromPalette(page: Page, type: string): Promise<void> {
  await expandPaletteGroupForType(page, type);
  await page.getByTestId(`palette-add-${type}`).click();
}

export async function openPaletteInfo(page: Page, type: string): Promise<void> {
  await expandPaletteGroupForType(page, type);
  await page.getByTestId(`palette-info-${type}`).click();
}

export async function openPaletteLink(page: Page, type: string): Promise<void> {
  await expandPaletteGroupForType(page, type);
  await page.getByTestId(`palette-link-${type}`).click();
}

export async function dismissPlacementPromptIfVisible(page: Page): Promise<void> {
  const prompt = page.getByTestId('canvas-placement-prompt');
  const dismiss = page.getByTestId('canvas-placement-dismiss');
  if (!(await prompt.isVisible().catch(() => false))) {
    return;
  }
  await dismiss.click({ timeout: 3000 }).catch(() => undefined);
  await expect(prompt).toBeHidden({ timeout: 3000 }).catch(() => undefined);
}

export async function selectCanvasNode(
  page: Page,
  node: ReturnType<Page['getByTestId']>,
  options?: { shiftKey?: boolean },
): Promise<void> {
  await selectCanvasNodeHeader(page, node, options);
}

export async function selectCanvasNodeHeader(
  page: Page,
  node: ReturnType<Page['getByTestId']>,
  options?: { shiftKey?: boolean },
): Promise<void> {
  await dismissCompactPanelsIfOpen(page);
  const header = node.getByTestId('canvas-node-header');
  await header.click({
    modifiers: options?.shiftKey ? ['Shift'] : [],
  });
}

export async function expandInspectorSection(page: Page, sectionId: string): Promise<void> {
  const panel = page.getByTestId(`inspector-group-panel-${sectionId}`);
  if (await panel.isVisible().catch(() => false)) {
    return;
  }

  await page.getByTestId(`inspector-group-toggle-${sectionId}`).click();
  await expect(panel).toBeVisible();
}

export async function expandInspectorBindings(page: Page): Promise<void> {
  await expandInspectorSection(page, 'bindings');
}

export async function openBuilder(
  page: Page,
  stack?: { ui?: string; server?: string; database?: string },
): Promise<void> {
  const pending = {
    ui: stack?.ui ?? 'react',
    server: stack?.server ?? 'nest',
    database: stack?.database ?? 'postgresql',
  };
  await page.goto('/');
  await page.evaluate((next) => {
    sessionStorage.clear();
    sessionStorage.setItem('rosettadash:pending-stack', JSON.stringify(next));
  }, pending);
  await page.goto('/builder');
  await expect(page.getByTestId('builder-loading')).toBeHidden({ timeout: 120_000 });
  await expect(page.getByTestId('builder-shell')).toBeVisible();
  const welcomeDismiss = page.getByTestId('creation-welcome-dismiss');
  if (await welcomeDismiss.isVisible().catch(() => false)) {
    await welcomeDismiss.click();
  }
  await expectBuilderPaletteReady(page);
}

async function expectBuilderPaletteReady(page: Page): Promise<void> {
  // Wide: palette visible. Compact: palette stays in the DOM but hidden; the
  // Components toggle is the ready signal. Do not one-shot-check the toggle
  // then wait on a hidden palette (compact e2e 30s timeout).
  const palette = page.getByTestId('palette');
  const compactToggle = page.getByTestId('toggle-palette');
  await expect
    .poll(
      async () =>
        (await compactToggle.isVisible().catch(() => false)) ||
        (await palette.isVisible().catch(() => false)),
      { timeout: 30_000 },
    )
    .toBe(true);
}

async function ensurePaletteVisible(page: Page): Promise<void> {
  const palette = page.getByTestId('palette');
  if (await palette.isVisible().catch(() => false)) {
    return;
  }

  const compactToggle = page.getByTestId('toggle-palette');
  if (await compactToggle.isVisible().catch(() => false)) {
    await compactToggle.click();
    await expect(palette).toBeVisible();
  }
}

async function dismissCompactPanelsIfOpen(page: Page): Promise<void> {
  const backdrop = page.getByTestId('builder-panel-backdrop');
  if (await backdrop.isVisible().catch(() => false)) {
    await backdrop.click();
    await expect(backdrop).toBeHidden();
  }
}

export async function openBuilderViaWelcome(page: Page, ui = 'react'): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByTestId('welcome-page')).toBeVisible();
  await page.getByTestId('stack-section-toggle-ui').click();
  await page.getByTestId(`stack-ui-${ui}`).click();
  await expect(page.getByTestId('welcome-continue')).toBeEnabled();
  await page.getByTestId('welcome-continue').click();
  await expect(page.getByTestId('builder-loading')).toBeHidden({ timeout: 120_000 });
  await expect(page.getByTestId('builder-shell')).toBeVisible();
  await expectBuilderPaletteReady(page);
}

/** @deprecated Use {@link openBuilderViaWelcome}. */
export async function openBuilderViaStackSetup(page: Page): Promise<void> {
  await openBuilderViaWelcome(page);
}

export async function waitForPreviewData(page: Page): Promise<void> {
  await expect(page.getByTestId('preview-loading')).toBeHidden({ timeout: 30_000 });
  await expect(page.getByTestId('preview-data-source')).toBeVisible();
}
