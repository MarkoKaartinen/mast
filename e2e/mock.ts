import type { Page, Route } from '@playwright/test';

export const INSTANCE = 'https://mastodon.example';

const blob = { shortcode: 'blobaww', url: `${INSTANCE}/emoji.svg`, static_url: `${INSTANCE}/emoji.svg` };
const me = { id: '1', acct: 'ronsu', display_name: 'Ronsu', avatar: `${INSTANCE}/avatar.svg`, emojis: [] as (typeof blob)[] };
const other = { id: '2', acct: 'friend@other.example', display_name: 'A Friend :blobaww:', avatar: `${INSTANCE}/friend.svg`, emojis: [blob] };

/** A round colored avatar with an initial, so screenshots do not show broken images */
const avatar = (color: string, initial: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="${color}"/><text x="48" y="64" font-size="48" text-anchor="middle" font-family="sans-serif" fill="#1e1e2e">${initial}</text></svg>`;

const status = (id: string, html: string, account = me) => ({
  id,
  created_at: '2026-01-02T10:00:00.000Z',
  url: `${INSTANCE}/@ronsu/${id}`,
  content: html,
  spoiler_text: '',
  sensitive: false,
  media_attachments: [],
  emojis: [blob],
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
      case '/api/v1/notifications': {
        if (url.searchParams.getAll('types[]').includes('mention')) {
          return json([notification('20', 'mention', '<p>Hello <a href="javascript:alert(1)">@ronsu</a></p>')]);
        }
        // Favourites and boosts have a second, older page
        if (url.searchParams.get('max_id')) return json([notification('5', 'favourite', '<p>Older favourite</p>')]);
        const next = `<${INSTANCE}/api/v1/notifications?limit=40&types[]=favourite&types[]=reblog&max_id=11>; rel="next"`;
        return route.fulfill({
          // Like Mastodon, expose the Link header to the browser
          headers: { link: next, 'access-control-expose-headers': 'Link' },
          json: [notification('12', 'favourite', '<p>Liked post :blobaww:</p>'), notification('11', 'reblog', '<p>Boosted post</p>')],
        });
      }
      case '/api/v1/conversations':
        return json([{ id: '5', unread: true, accounts: [other], last_status: status('30', '<p>Secret hello</p>', other) }]);
      case `/api/v1/accounts/${me.id}/statuses`:
        return json([
          {
            ...status('40', '<p>My own post</p>'),
            media_attachments: [{ id: 'm1', type: 'image', url: `${INSTANCE}/preview.svg`, preview_url: `${INSTANCE}/preview.svg`, description: 'A purple square' }],
          },
        ]);
      case '/avatar.svg':
        return route.fulfill({ contentType: 'image/svg+xml', body: avatar('#89b4fa', 'R') });
      case '/friend.svg':
        return route.fulfill({ contentType: 'image/svg+xml', body: avatar('#f5c2e7', 'F') });
      case '/emoji.svg':
        return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="15" fill="#f9e2af"/><circle cx="11" cy="13" r="2" fill="#1e1e2e"/><circle cx="21" cy="13" r="2" fill="#1e1e2e"/><path d="M9 19q7 7 14 0" stroke="#1e1e2e" stroke-width="2" fill="none"/></svg>' });
      case '/preview.svg':
        return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#cba6f7"/></svg>' });
      default:
        return route.fulfill({ status: 404, json: { error: 'not mocked' } });
    }
  };
  await page.route(`${INSTANCE}/**`, handler);
}
