import { expect, test } from '@playwright/test';
import { mockMastodon } from './mock';

// Runs in the "phone" project of playwright.config.ts: a real touch device profile (coarse pointer, 412 px wide)
test.beforeEach(async ({ page }) => {
  await mockMastodon(page);
});

test('has touch sized buttons, bottom tabs and no sideways scrolling', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/server|palvelin/i).fill('mastodon.example');
  await page.getByRole('button', { name: /connect|yhdistä/i }).click();
  await expect(page.getByText('Liked post')).toBeVisible();

  for (const name of [/^refresh$|^päivitä$/i, /^accounts$|^tilit$/i, /mark as read|merkitse luetuksi/i]) {
    const box = await page.getByRole('button', { name }).first().boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  // Tabs are at the bottom of the screen
  const nav = await page.getByRole('navigation').boundingBox();
  expect(nav!.y + nav!.height).toBeGreaterThan(page.viewportSize()!.height - 2);
  // Nothing is wider than the screen
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/phone.png' });
});
