import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { allRoutes, toolSlugs } from './routes';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'];

test('registry has tools', () => {
  expect(toolSlugs.length).toBeGreaterThan(20);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme, reducedMotion: 'reduce' });

    for (const route of allRoutes) {
      test(`${route}: no accessibility violations or console errors`, async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto(route);
        await expect(page.locator('h1')).toBeVisible();
        await page.waitForLoadState('networkidle');
        // Checked before axe runs: axe injects itself into frames, and the sandboxed
        // preview iframes (correctly) block that, which logs an error of its own.
        expect(errors, 'console errors').toEqual([]);

        // Preview iframes hold the user's own document, not ours.
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).exclude('iframe').analyze();
        const summary = violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')} – ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`));
        expect(summary, 'axe violations').toEqual([]);
      });
    }
  });
}
