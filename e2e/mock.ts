import type { Page, Route } from '@playwright/test';

export const INSTANCE = 'https://mastodon.example';

const me = { id: '1', acct: 'ronsu', display_name: 'Ronsu', avatar: `${INSTANCE}/avatar.png` };
const other = { id: '2', acct: 'friend@other.example', display_name: 'A Friend', avatar: `${INSTANCE}/friend.png` };

const status = (id: string, html: string, account = me) => ({
  id,
  created_at: '2026-01-02T10:00:00.000Z',
  url: `${INSTANCE}/@ronsu/${id}`,
  content: html,
  spoiler_text: '',
  visibility: 'public',
  account,
  reblog: null,
});

const notification = (id: string, type: string, html: string) => ({
  id,
  type,
  created_at: '2026-01-02T10:00:00.000Z',
  account: other,
  status: status('s' + id, html),
});

/** Fake Mastodon server: the whole API is answered from here, no real server is contacted. */
export async function mockMastodon(page: Page): Promise<void> {
  const handler = async (route: Route) => {
    const url = new URL(route.request().url());
    const json = (body: unknown) => route.fulfill({ json: body });

    switch (url.pathname) {
      case '/api/v1/apps':
        return json({ client_id: 'fake-client', client_secret: 'fake-secret' });
      case '/oauth/authorize': {
        const back = new URL(url.searchParams.get('redirect_uri')!);
        back.searchParams.set('code', 'fake-code');
        back.searchParams.set('state', url.searchParams.get('state')!);
        return route.fulfill({ status: 302, headers: { location: back.href } });
      }
      case '/oauth/token':
        return json({ access_token: 'fake-token', token_type: 'Bearer', scope: 'read:accounts read:notifications read:statuses' });
      case '/oauth/revoke':
        return json({});
      case '/api/v1/accounts/verify_credentials':
        return json(me);
      case '/api/v1/notifications':
        return url.searchParams.getAll('types[]').includes('mention')
          ? json([notification('20', 'mention', '<p>Hello <a href="javascript:alert(1)">@ronsu</a></p>')])
          : json([notification('12', 'favourite', '<p>Liked post</p>'), notification('11', 'reblog', '<p>Boosted post</p>')]);
      case '/api/v1/conversations':
        return json([{ id: '5', unread: true, accounts: [other], last_status: status('30', '<p>Secret hello</p>', other) }]);
      case `/api/v1/accounts/${me.id}/statuses`:
        return json([status('40', '<p>My own post</p>')]);
      default:
        return route.fulfill({ status: 404, json: { error: 'not mocked' } });
    }
  };
  await page.route(`${INSTANCE}/**`, handler);
}
