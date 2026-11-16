import { expect, test } from '@playwright/test';
import { mockMastodon } from './mock';

test.beforeEach(async ({ page }) => {
  await mockMastodon(page);
});

async function connect(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel(/server|palvelin/i).fill('mastodon.example');
  await page.getByRole('button', { name: /connect|yhdistä/i }).click();
}

test('connects an account and shows the columns with unread counts', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await connect(page);

  await expect(page.getByText('Liked post')).toBeVisible();
  await expect(page.getByText('Boosted post')).toBeVisible();
  await expect(page.getByText('Secret hello')).toBeVisible();
  await expect(page.getByText('My own post')).toBeVisible();
  // The OAuth parameters are removed from the address bar
  await expect(page).toHaveURL('http://localhost:4173/');
  // The unsafe link was stripped from the post
  await expect(page.locator('.content a[href^="javascript"]')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/desktop.png' });
});

test('marks a column as read and remembers it after a reload', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await connect(page);
  await expect(page.getByText('Liked post')).toBeVisible();

  const interactions = page.locator('section.column').first();
  await expect(interactions.locator('.badge')).toHaveText('2');
  await interactions.getByRole('button', { name: /mark as read|merkitse luetuksi/i }).click();
  await expect(interactions.locator('.badge')).toHaveCount(0);
  // Other columns keep their own unread state
  await expect(page.locator('section.column').nth(1).locator('.badge')).toHaveText('1');

  await page.reload();
  await expect(page.getByText('Liked post')).toBeVisible();
  await expect(interactions.locator('.badge')).toHaveCount(0);
  await expect(page.locator('section.column').nth(1).locator('.badge')).toHaveText('1');
});

test('uses tabs on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await connect(page);

  await expect(page.getByText('Liked post')).toBeVisible();
  await expect(page.getByText('Secret hello')).toBeHidden();
  await page.getByRole('navigation').getByRole('button', { name: /direct messages|yksityisviestit/i }).click();
  await expect(page.getByText('Secret hello')).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile.png' });
});
