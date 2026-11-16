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

test('shows which account failed to load', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  // Registered after the mock, so it answers first
  await page.route('https://mastodon.example/api/v1/notifications**', (route) => route.fulfill({ status: 500, json: {} }));
  await connect(page);

  await expect(page.getByText('Secret hello')).toBeVisible();
  // The tooltip names the failing columns and the status
  await expect(page.getByTitle(/could not load this account.*Favourites and boosts: 500.*Mentions: 500/i)).toBeVisible();
});

test('hides the server form once an account exists', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await connect(page);

  await expect(page.getByText('Liked post')).toBeVisible();
  await expect(page.getByLabel(/server|palvelin/i)).toHaveCount(0);
  await page.getByRole('button', { name: /add account|lisää tili/i }).click();
  await expect(page.getByLabel(/server|palvelin/i)).toBeVisible();
});

test('refreshes when the stream reports a notification', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  let streamed: { send(message: string): void } | undefined;
  await page.routeWebSocket('wss://mastodon.example/api/v1/streaming?stream=user', (ws) => {
    streamed = ws;
  });
  await connect(page);
  await expect(page.getByText('Liked post')).toBeVisible();
  await expect(page.getByText('Brand new favourite')).toHaveCount(0);

  // From now on the server has one more favourite
  await page.route('https://mastodon.example/api/v1/notifications**', (route) => {
    const types = new URL(route.request().url()).searchParams.getAll('types[]');
    const item = {
      id: '99',
      type: 'favourite',
      created_at: '2026-01-03T10:00:00.000Z',
      account: { id: '2', acct: 'friend@other.example', display_name: 'A Friend', avatar: '' },
      status: { id: 's99', created_at: '2026-01-03T10:00:00.000Z', url: null, content: '<p>Brand new favourite</p>', spoiler_text: '', visibility: 'public', account: { id: '1', acct: 'ronsu', display_name: 'Ronsu', avatar: '' }, reblog: null },
    };
    return route.fulfill({ json: types.includes('favourite') ? [item] : [] });
  });
  await expect.poll(() => streamed).toBeDefined();
  streamed!.send(JSON.stringify({ stream: ['user'], event: 'notification', payload: '{}' }));

  await expect(page.getByText('Brand new favourite')).toBeVisible();
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
