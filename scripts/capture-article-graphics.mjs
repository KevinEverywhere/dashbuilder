#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARTICLES = join(dirname(fileURLToPath(import.meta.url)), '../articles');

const ARTICLE_DIRS = {
  '01': '01-components-that-travel',
  '02': '02-the-builder',
  '03': '03-storybook',
  '04': '04-destination-atlas',
  '05': '05-maps-globes-media-wasm',
  '06': '06-settings-byok-roles-i18n-stack',
  '07': '07-one-canvas-five-runtimes',
};

function graphicsPath(articleId, filename) {
  return join(ARTICLES, ARTICLE_DIRS[articleId], 'graphics', filename);
}
const DESKTOP = { width: 1400, height: 900 };

async function ensureOut(out) {
  await mkdir(dirname(out), { recursive: true });
}

async function pageShot(page, url, out, waitMs = 2500) {
  await ensureOut(out);
  await page.setViewportSize(DESKTOP);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: out });
  console.log('wrote', out);
}

async function elShot(page, url, selector, out, waitMs = 2500) {
  await ensureOut(out);
  await page.setViewportSize(DESKTOP);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(waitMs);
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 30_000 });
  await el.screenshot({ path: out });
  console.log('wrote', out);
}

async function capture04(page) {
  const b = 'http://localhost:4312';
  await elShot(page, `${b}/overview`, '.da-body-row', graphicsPath('04', '01-workbench.png'), 3000);
  await pageShot(page, `${b}/`, graphicsPath('04', '02-about.png'), 2000);
  await pageShot(page, `${b}/overview`, graphicsPath('04', '03-overview.png'));
  await pageShot(page, `${b}/destinations`, graphicsPath('04', '04-destinations.png'), 3000);
}

async function capture05(page) {
  const b = 'http://localhost:4313';
  await pageShot(page, `${b}/maps`, graphicsPath('05', '01-map-2d.png'), 5000);
  await pageShot(page, `${b}/maps/globe`, graphicsPath('05', '02-globe.png'), 5000);
  await pageShot(page, `${b}/media`, graphicsPath('05', '03-media-youtube.png'), 3000);
  await pageShot(page, `${b}/authoring?role=editor`, graphicsPath('05', '04-authoring-crop.png'), 4000);
  await pageShot(page, `${b}/authoring?role=editor`, graphicsPath('05', '05-authoring-sphere.png'), 4000);
}

async function capture06(page) {
  const svelte = 'http://localhost:4314';
  const react = 'http://localhost:4311';
  await pageShot(page, `${svelte}/settings?role=admin`, graphicsPath('06', '01-settings.png'), 2500);
  await pageShot(page, `${svelte}/plan?role=editor`, graphicsPath('06', '02-plan.png'), 2500);
  // Stack live API demo ships on React proof (DAS-187); capture with parity stack up.
  await pageShot(page, `${react}/stack?role=admin`, graphicsPath('06', '03-stack.png'), 4000);
  await pageShot(page, `${svelte}/settings?role=viewer`, graphicsPath('06', '04-detail.png'), 2500);
}

async function openBuilder(page) {
  await page.goto('http://localhost:4200/');
  await page.evaluate(() => {
    sessionStorage.clear();
    sessionStorage.setItem(
      'rosettadash:pending-stack',
      JSON.stringify({ ui: 'react', server: 'nest', database: 'postgresql' }),
    );
  });
  await page.goto('http://localhost:4200/builder');
  await page.getByTestId('builder-loading').waitFor({ state: 'hidden', timeout: 120_000 });
  await page.getByTestId('builder-shell').waitFor({ state: 'visible' });
  const welcomeDismiss = page.getByTestId('creation-welcome-dismiss');
  if (await welcomeDismiss.isVisible().catch(() => false)) {
    await welcomeDismiss.click();
  }
}

async function expandPaletteGroup(page, groupId) {
  const panel = page.getByTestId(`palette-group-panel-${groupId}`);
  if (await panel.isVisible().catch(() => false)) return;
  await page.getByTestId(`palette-group-toggle-${groupId}`).click();
  await panel.waitFor({ state: 'visible' });
}

async function addFromPalette(page, type) {
  const groupMap = {
    'visual.input.date-range': 'form-inputs',
    'visual.table': 'data-display',
    'visual.chart.line': 'charts',
  };
  const groupId = groupMap[type];
  if (!groupId) throw new Error(`unknown type ${type}`);
  await expandPaletteGroup(page, groupId);
  await page.getByTestId(`palette-add-${type}`).click();
}

async function capture02(page) {
  await page.setViewportSize(DESKTOP);
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.getByTestId('stack-section-toggle-ui').click();
  await page.getByTestId('stack-ui-react').click();
  await page.waitForTimeout(500);
  await ensureOut(graphicsPath('02', '01-welcome.png'));
  await page.locator('[data-testid="welcome-page"] .stack-setup, .welcome-stack, section').first().screenshot({
    path: graphicsPath('02', '01-welcome.png'),
  }).catch(async () => {
    await page.screenshot({ path: graphicsPath('02', '01-welcome.png') });
  });
  console.log('wrote', graphicsPath('02', '01-welcome.png'));

  await openBuilder(page);
  await addFromPalette(page, 'visual.input.date-range');
  await addFromPalette(page, 'visual.table');
  await addFromPalette(page, 'visual.chart.line');
  await page.waitForTimeout(1000);
  await ensureOut(graphicsPath('02', '02-canvas.png'));
  await page.getByTestId('canvas').screenshot({ path: graphicsPath('02', '02-canvas.png') });
  console.log('wrote', graphicsPath('02', '02-canvas.png'));

  await page.getByTestId('mode-preview').click();
  await page.getByTestId('preview-loading').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.getByTestId('preview-panel').screenshot({ path: graphicsPath('02', '03-preview.png') });
  console.log('wrote', graphicsPath('02', '03-preview.png'));

  await page.getByTestId('mode-design').click();
  await page.getByTestId('export-button').click();
  await page.getByTestId('export-wizard').waitFor({ state: 'visible' });
  await page.waitForTimeout(2000);
  await page.getByTestId('export-wizard').screenshot({ path: graphicsPath('02', '04-export.png') });
  console.log('wrote', graphicsPath('02', '04-export.png'));
}

async function capture03(page) {
  await elShot(
    page,
    'http://localhost:6007/?path=/docs/getting-started-start-here--docs',
    '#storybook-explorer-tree, [data-panel="left"], .sidebar-container',
    graphicsPath('03', '01-sidebar.png'),
    6000,
  ).catch(async () => {
    await pageShot(
      page,
      'http://localhost:6007/?path=/docs/getting-started-start-here--docs',
      graphicsPath('03', '01-sidebar.png'),
      6000,
    );
  });
  await pageShot(
    page,
    'http://localhost:6007/?path=/story/catalog-components--data-display',
    graphicsPath('03', '02-components.png'),
    5000,
  );
  await pageShot(
    page,
    'http://localhost:6007/?path=/story/catalog-meta-components--operations-kpi-dashboard',
    graphicsPath('03', '03-meta.png'),
    5000,
  );
}

async function capture01(page) {
  await page.setViewportSize(DESKTOP);
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await ensureOut(graphicsPath('01', '01-factory.png'));
  await page.screenshot({ path: graphicsPath('01', '01-factory.png') });
  console.log('wrote', graphicsPath('01', '01-factory.png'));

  await elShot(
    page,
    'http://localhost:4312/',
    '.da-about__runtime-list',
    graphicsPath('01', '02-travel.png'),
    2000,
  );
  await elShot(
    page,
    'http://localhost:4312/',
    '.da-about__steps, .da-about__section:nth-of-type(2)',
    graphicsPath('01', '03-doors.png'),
    2000,
  ).catch(async () => {
    await pageShot(page, 'http://localhost:6007/?path=/docs/getting-started-start-here--docs', graphicsPath('01', '03-doors.png'), 4000);
  });

  await pageShot(page, 'http://localhost:4320/', graphicsPath('01', '04-demo-widget.png'), 3000);
}

async function capture07(page) {
  await openBuilder(page);
  await page.getByTestId('export-button').click();
  await page.getByTestId('export-wizard').waitFor({ state: 'visible' });
  await page.waitForTimeout(2000);
  await page.getByTestId('export-wizard').screenshot({ path: graphicsPath('07', '01-ir.png') });
  console.log('wrote', graphicsPath('07', '01-ir.png'));

  await pageShot(page, 'http://localhost:4314/', graphicsPath('07', '02-matrix.png'), 2000);
  await pageShot(page, 'http://localhost:4314/authoring?role=editor', graphicsPath('07', '03-mix.png'), 4000);
  await pageShot(page, 'http://localhost:4320/', graphicsPath('07', '04-demo.png'), 3000);
}

const CAPTURES = {
  '01': capture01,
  '02': capture02,
  '03': capture03,
  '04': capture04,
  '05': capture05,
  '06': capture06,
  '07': capture07,
};

async function main() {
  const only = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    for (const key of only ? [only] : Object.keys(CAPTURES)) {
      if (CAPTURES[key]) await CAPTURES[key](page);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
