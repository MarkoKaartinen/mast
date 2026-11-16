import { expect, test } from '@playwright/test';
import { mockMastodon } from './mock';

test.beforeEach(async ({ page }) => {
  await mockMastodon(page);
});

async function openAccounts(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /^accounts$|^tilit$/i }).click();
}

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
  await expect(page.getByRole('img', { name: 'A purple square' })).toBeVisible();
  await page.screenshot({ path: 'test-results/desktop.png' });
  await openAccounts(page);
  await page.screenshot({ path: 'test-results/accounts.png' });
});

test('marks a column as read and remembers it after a reload', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await connect(page);
  await expect(page.getByText('Liked post')).toBeVisible();

  const interactions = page.locator('section.column').first();
  await expect(interactions.locator('.badge')).toHaveText('2');
  await interactions.getByRole('button', { name: /mark as read|merkitse luetuksi/i }).click();
  await expect(interactions.locator('.badge')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/read.png' });
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

test('shows which account failed to load', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  // Registered after the mock, so it answers first
  await page.route('https://mastodon.example/api/v1/notifications**', (route) => route.fulfill({ status: 500, json: {} }));
  await connect(page);

  await expect(page.getByText('Secret hello')).toBeVisible();
  await openAccounts(page);
  // The tooltip names the failing columns and the status
  await expect(page.getByTitle(/could not load this account.*Favourites and boosts: 500.*Mentions: 500/i)).toBeVisible();
});

test('hides the server form once an account exists', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await connect(page);

  await expect(page.getByText('Liked post')).toBeVisible();
  await openAccounts(page);
  await expect(page.getByLabel(/server|palvelin/i)).toHaveCount(0);
  await page.getByRole('button', { name: /add account|lisää tili/i }).click();
  await expect(page.getByLabel(/server|palvelin/i)).toBeVisible();
});

test('shows an empty column as empty and loads each feed only once', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  let conversationRequests = 0;
  await page.route('https://mastodon.example/api/v1/conversations**', (route) => {
    conversationRequests++;
    return route.fulfill({ json: [] });
  });
  await connect(page);

  await expect(page.getByText('Liked post')).toBeVisible();
  const messages = page.locator('section.column').nth(2);
  await expect(messages.getByText(/nothing here yet|ei vielä mitään/i)).toBeVisible();
  await expect(messages.getByText(/loading|ladataan/i)).toHaveCount(0);

  // A refresh loop would keep requesting while nothing changes
  await page.waitForTimeout(1500);
  expect(conversationRequests).toBe(1);
});

test('refreshes with the button and keeps old items when the server rate limits', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await connect(page);
  await expect(page.getByText('Liked post')).toBeVisible();

  let requests = 0;
  await page.route('https://mastodon.example/api/v1/**', (route) => {
    requests++;
    return route.fulfill({ status: 429, json: { error: 'Too many requests' } });
  });
  await page.getByRole('button', { name: /^refresh$|^päivitä$/i }).click();

  await openAccounts(page);
  await expect(page.getByTitle(/Favourites and boosts: 429.*Too many requests/i)).toBeVisible();
  await page.keyboard.press('Escape');
  // Nothing disappeared
  await expect(page.getByText('Liked post')).toBeVisible();
  await expect(page.getByText('Secret hello')).toBeVisible();

  // The account is now left alone, so another click sends no requests
  const before = requests;
  await page.getByRole('button', { name: /^refresh$|^päivitä$/i }).click();
  await page.waitForTimeout(500);
  expect(requests).toBe(before);
});

test('loads older items with the load more button', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await connect(page);
  await expect(page.getByText('Liked post')).toBeVisible();
  await expect(page.getByText('Older favourite')).toHaveCount(0);

  const interactions = page.locator('section.column').first();
  await interactions.getByRole('button', { name: /load more|lataa lisää/i }).click();
  await expect(page.getByText('Older favourite')).toBeVisible();
  // There was only one older page, and the newer items are still there
  await expect(interactions.getByRole('button', { name: /load more|lataa lisää/i })).toHaveCount(0);
  await expect(page.getByText('Liked post')).toBeVisible();
  // Other columns had no older page
  await expect(page.locator('section.column').nth(1).getByRole('button', { name: /load more|lataa lisää/i })).toHaveCount(0);
});

test('asks to log in again when the token is no longer accepted', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.route('https://mastodon.example/api/v1/notifications**', (route) => route.fulfill({ status: 401, json: { error: 'The access token is invalid' } }));
  await connect(page);
  await expect(page.getByText('Secret hello')).toBeVisible();

  await openAccounts(page);
  await expect(page.getByRole('button', { name: /log in again|kirjaudu uudelleen/i })).toBeVisible();
});
