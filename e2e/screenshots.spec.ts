import { devices, expect, test, type Page } from '@playwright/test';
import { defaultProfile, mockMastodon, secondProfile } from './mock';

// Takes the screenshots for the README from mock data, no real accounts:
// npm run build && SCREENSHOTS=1 npx playwright test screenshots --project desktop
test.skip(!process.env.SCREENSHOTS, 'Only runs when SCREENSHOTS=1');

async function connectBoth(page: Page) {
  const servers = [await mockMastodon(page, defaultProfile), await mockMastodon(page, secondProfile)];
  await page.goto('/');
  await page.getByLabel(/server|palvelin/i).fill('mastodon.example');
  await page.getByRole('button', { name: /connect|yhdistä/i }).click();
  await expect(page.getByText('Liked post')).toBeVisible();

  await page.getByRole('button', { name: /^accounts$/i }).click();
  await page.getByRole('button', { name: /add account/i }).click();
  await page.getByLabel(/server/i).fill('social.example');
  await page.getByRole('button', { name: /connect/i }).click();
  await expect(page.getByText('Spring is finally here')).toBeVisible();

  // Something new happens after the accounts were added, so there is something unread to show
  for (const server of servers) server.release();
  await page.getByRole('button', { name: /^refresh$/i }).click();
  await expect(page.getByText(defaultProfile.news.favourite)).toBeVisible();
}

test('desktop screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 860 });
  await connectBoth(page);
  // Show both states: the mentions column has been read
  await page.locator('section.column').nth(1).getByRole('button', { name: /mark as read/i }).click();
  await page.screenshot({ path: 'docs/screenshot-desktop.png' });
});

test('phone screenshot', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const page = await context.newPage();
  await connectBoth(page);
  await page.screenshot({ path: 'docs/screenshot-phone.png' });
  await context.close();
});
