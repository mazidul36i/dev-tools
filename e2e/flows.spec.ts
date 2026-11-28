import { test, expect, type Page } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const activeLabel = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

/** Navigates and waits until the page has rendered (global shortcuts are attached by then). */
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('h1')).toBeVisible();
}

test.describe('command palette', () => {
  test('opens with Ctrl+K, closes with Esc and returns focus', async ({ page }) => {
    await open(page, '/');
    await page.getByRole('button', { name: 'Search tools' }).focus();
    await page.keyboard.press('Control+k');
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await expect(page.getByRole('combobox', { name: 'Search tools and actions' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    expect(await activeLabel(page)).toBe('Search tools');
  });

  test('Enter opens the top match', async ({ page }) => {
    await open(page, '/');
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('combobox', { name: 'Search tools and actions' })).toBeFocused();
    await page.keyboard.type('jwt');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/jwt-decoder$/);
    await expect(page.getByRole('heading', { level: 1, name: 'JWT Decoder' })).toBeVisible();
  });
});

test.describe('keyboard shortcuts', () => {
  test('"/" focuses the home search, and the sidebar filter on tool pages', async ({ page }) => {
    await open(page, '/');
    await page.locator('body').click({ position: { x: 700, y: 5 } });
    await page.keyboard.press('/');
    await expect(page.locator('[data-page-search]')).toBeFocused();

    await open(page, '/jwt-decoder');
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('/');
    expect(await activeLabel(page)).toBe('Filter tools');
  });

  test('"?" opens the shortcuts dialog', async ({ page }) => {
    await open(page, '/uuid-generator');
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Shift+?');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
  });

  test('Ctrl+Enter regenerates', async ({ page }) => {
    await open(page, '/uuid-generator');
    const output = page.locator('textarea[readonly]');
    await expect(output).not.toHaveValue('');
    const before = await output.inputValue();
    await page.keyboard.press('Control+Enter');
    await expect(output).not.toHaveValue(before);
  });
});

test.describe('favourites and recents', () => {
  test('a favourite survives a reload and shows in the sidebar', async ({ page }) => {
    await open(page, '/regex-tester');
    await page.getByRole('button', { name: 'Add to favorites' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Remove from favorites' })).toBeVisible();
    await expect(page.locator('aside').getByRole('heading', { name: 'Favorites' })).toBeVisible();
  });

  test('visited tools appear under Recently used', async ({ page }) => {
    await open(page, '/jwt-decoder');
    await open(page, '/');
    await expect(page.getByRole('region', { name: 'Recently used' }).getByRole('link', { name: 'JWT Decoder' })).toBeVisible();
  });
});

test.describe('URL state and share links', () => {
  test('options are written to the URL and restored on reload', async ({ page }) => {
    await open(page, '/json-formatter');
    await page.getByLabel('Indent').selectOption('4');
    await expect(page).toHaveURL(/[?&]indent=4/);
    await page.reload();
    await expect(page.getByLabel('Indent')).toHaveValue('4');
  });

  test('a share link restores the input and options, then clears the hash', async ({ page, browser }) => {
    await open(page, '/json-formatter?indent=4');
    const input = '{"shared":true,"n":[1,2]}';
    await page.getByLabel('Input').fill(input);
    await page.getByRole('button', { name: /^Share/ }).click();
    await expect.poll(() => clipboard(page)).toMatch(/#s=1\./);
    const link = await clipboard(page);

    const other = await (await browser.newContext()).newPage();
    await open(other, link);
    await expect(other.getByLabel('Input')).toHaveValue(input);
    await expect(other).not.toHaveURL(/#s=/);
    expect(new URL(other.url()).searchParams.get('indent')).toBe('4');
  });

  test('a JWT token never changes the URL', async ({ page }) => {
    await open(page, '/jwt-decoder');
    const before = page.url();
    await page.locator('#jwt-input').fill('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc');
    await page.waitForTimeout(400);
    expect(page.url()).toBe(before);
    await expect(page.getByRole('button', { name: /^Share/ })).toHaveCount(0);
  });

  test('shared HTML opens in "On click" mode and does not render until Run', async ({ page, browser }) => {
    await open(page, '/html-preview');
    await page.getByLabel('HTML / CSS / JS').fill('<p id="shared">hi</p>');
    await page.getByRole('button', { name: /^Share/ }).click();
    await expect.poll(() => clipboard(page)).toMatch(/#s=1\./);
    const link = await clipboard(page);

    const other = await (await browser.newContext()).newPage();
    await open(other, link);
    await expect(other).toHaveURL(/[?&]mode=manual/);
    await other.waitForTimeout(600);
    await expect(other.frameLocator('iframe[title="HTML preview"]').locator('#shared')).toHaveCount(0);
    await other.getByRole('button', { name: /^Run/ }).click();
    await expect(other.frameLocator('iframe[title="HTML preview"]').locator('#shared')).toHaveText('hi');
  });
});

test.describe('saved drafts', () => {
  test('a shared Markdown link keeps the previous document and can restore it', async ({ page }) => {
    await open(page, '/markdown-preview');
    const editor = page.getByLabel('Markdown', { exact: true });
    await editor.fill('# Shared from a teammate');
    await page.getByRole('button', { name: /^Share/ }).click();
    await expect.poll(() => clipboard(page)).toMatch(/#s=1\./);
    const link = await clipboard(page);

    // The user's own work, saved in this browser.
    await editor.fill('# My own notes');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('markdown-preview:doc'))).toContain('My own notes');

    await open(page, link);
    await expect(editor).toHaveValue('# Shared from a teammate');
    await page.getByRole('button', { name: 'Restore my document' }).click();
    await expect(editor).toHaveValue('# My own notes');
  });
});

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('the drawer opens and closes after navigating', async ({ page }) => {
    await open(page, '/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.locator('dialog[open]');
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'JWT Decoder' }).click();
    await expect(page).toHaveURL(/\/jwt-decoder$/);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });
});
