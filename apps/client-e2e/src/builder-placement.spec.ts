import { test, expect } from '@playwright/test';
import { addFromPalette, expandInspectorSection, openBuilder, selectCanvasNode } from './test-helpers';

test.describe('Builder placement inspector', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilder(page);
  });

  test('shows snap-aligned x, y, width, height for selected node', async ({ page }) => {
    await addFromPalette(page, 'visual.input.text');
    const node = page.getByTestId('canvas-node');
    await selectCanvasNode(page, node);

    await expect(page.getByTestId('inspector-group-placement')).toBeVisible();
    await expandInspectorSection(page, 'placement');
    await expect(page.getByTestId('inspector-layout-x')).toHaveValue('32');
    await expect(page.getByTestId('inspector-layout-y')).toHaveValue('32');
    await expect(page.getByTestId('inspector-layout-width')).toHaveValue('288');
    await expect(page.getByTestId('inspector-layout-height')).toHaveValue('72');
  });

  test('updates canvas position when placement values change', async ({ page }) => {
    await addFromPalette(page, 'visual.input.text');
    const node = page.getByTestId('canvas-node');
    await selectCanvasNode(page, node);

    await expandInspectorSection(page, 'placement');
    await page.getByTestId('inspector-layout-x').fill('64');
    await page.getByTestId('inspector-layout-y').fill('48');
    await page.getByTestId('inspector-layout-width').fill('320');
    await page.getByTestId('inspector-layout-height').fill('96');

    await expect(node).toHaveCSS('left', '64px');
    await expect(node).toHaveCSS('top', '48px');
    await expect(node).toHaveCSS('width', '320px');
  });

  test('updates placement fields when video source is resized on canvas', async ({ page }) => {
    await addFromPalette(page, 'visual.media.video-source');
    const node = page.getByTestId('canvas-node');
    await selectCanvasNode(page, node);

    const handle = node.getByTestId('canvas-resize-handle');
    const box = await handle.boundingBox();
    if (!box) {
      throw new Error('Resize handle not found');
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 96, box.y + box.height / 2 + 64);
    await page.mouse.up();

    await expandInspectorSection(page, 'placement');
    await expect(page.getByTestId('inspector-layout-width')).not.toHaveValue('640');
    await expandInspectorSection(page, 'properties');
    await expect(page.getByTestId('inspector-prop-displaySize')).toContainText('Custom');
  });
});
