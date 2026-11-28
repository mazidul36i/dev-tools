import { test, expect } from '@playwright/test';
import { allRoutes } from './routes';

for (const route of allRoutes) {
  test(`${route}: no horizontal overflow on a phone`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const main = document.querySelector('main')!;
      const offenders = [...main.querySelectorAll('*')]
        .filter((el) => {
          if (el.closest('pre, table, textarea, [class*="overflow-x-auto"], [class*="overflow-auto"]')) return false;
          return el.getBoundingClientRect().right > vw + 1;
        })
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
      return { page: document.documentElement.scrollWidth > vw, main: main.scrollWidth > main.clientWidth, offenders };
    });
    expect(overflow).toEqual({ page: false, main: false, offenders: [] });
  });
}
