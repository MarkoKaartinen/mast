import type { Page, Route } from '@playwright/test';

export const INSTANCE = 'https://mastodon.example';

/** What one fake server knows: the account that logs in, a friend who reacts, and the texts of the items. */
export interface Profile {
  instance: string;
  user: { id: string; acct: string; name: string; color: string };
  friend: { id: string; acct: string; name: string; color: string };
  favourite: string;
  boost: string;
  mention: string;
  message: string;
  post: string;
  /** The newest item of each column, which appears when the server is released */
  news: { favourite: string; mention: string; message: string; post: string };
  /** Item ages, so that the accounts' items mix in the columns and times look recent */
  minutesAgo: { favourite: number; boost: number; mention: number; message: number; post: number };
  /** Gives the favourites a second, older page and the own post an image. Used by the tests, not the screenshots. */
  extras: boolean;
}

export const defaultProfile: Profile = {
  instance: INSTANCE,
  user: { id: '1', acct: 'ronsu', name: 'Ronsu', color: '#89b4fa' },
  friend: { id: '2', acct: 'friend@other.example', name: 'A Friend :blobaww:', color: '#f5c2e7' },
  favourite: 'Liked post :blobaww:',
  boost: 'Boosted post',
  // The link is not safe and must be stripped
  mention: 'Hello <a href="javascript:alert(1)">@ronsu</a>',
  message: 'Secret hello',
  post: 'My own post',
  news: { favourite: 'Great thread today', mention: 'Can you check this out @ronsu', message: 'Did you see the news?', post: 'Back at the desk after lunch' },
  minutesAgo: { favourite: 12, boost: 95, mention: 30, message: 50, post: 200 },
  extras: true,
};

/** A second account on another server, used for screenshots of several accounts side by side. */
export const secondProfile: Profile = {
  instance: 'https://social.example',
  user: { id: '1', acct: 'sanna', name: 'Sanna', color: '#a6e3a1' },
  friend: { id: '9', acct: 'mika@other.example', name: 'Mika', color: '#fab387' },
  favourite: 'Spring is finally here :blobaww:',
  boost: 'New photos from the weekend trip',
  mention: 'Thanks for the tip, it worked :blobaww:',
  message: 'Are we still meeting on Friday?',
  post: 'Coffee first, then the garden',
  news: { favourite: 'First tomatoes of the year', mention: 'Which book was it again?', message: 'Running a bit late', post: 'Evening walk by the lake' },
  minutesAgo: { favourite: 45, boost: 20, mention: 8, message: 130, post: 70 },
  extras: false,
};

/** A round colored avatar with an initial, so screenshots do not show broken images */
const avatar = (color: string, initial: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="${color}"/><text x="48" y="64" font-size="48" text-anchor="middle" font-family="sans-serif" fill="#1e1e2e">${initial}</text></svg>`;

const emojiSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="15" fill="#f9e2af"/><circle cx="11" cy="13" r="2" fill="#1e1e2e"/><circle cx="21" cy="13" r="2" fill="#1e1e2e"/><path d="M9 19q7 7 14 0" stroke="#1e1e2e" stroke-width="2" fill="none"/></svg>';

const previewSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#cba6f7"/></svg>';

export interface MockServer {
  /** From now on the server also has one newer item per column, like something that happened after the first load */
  release(): void;
}

/** Fake Mastodon server: the whole API is answered from here, no real server is contacted. */
export async function mockMastodon(page: Page, profile: Profile = defaultProfile): Promise<MockServer> {
  const { instance, user, friend } = profile;
  const blob = { shortcode: 'blobaww', url: `${instance}/emoji.svg`, static_url: `${instance}/emoji.svg` };
  const person = (p: Profile['user']) => ({
    id: p.id,
    acct: p.acct,
    display_name: p.name,
    avatar: `${instance}/avatar-${p.id}.svg`,
    emojis: [blob],
  });
  const me = person(user);
  const other = person(friend);
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

  const status = (id: string, html: string, minutes: number, account = me) => ({
    id,
    created_at: ago(minutes),
    url: `${instance}/@${account.acct}/${id}`,
    content: `<p>${html}</p>`,
    spoiler_text: '',
    sensitive: false,
    media_attachments: [],
    emojis: [blob],
    visibility: 'public',
    account,
    reblog: null,
  });

  const notification = (id: string, type: string, html: string, minutes: number) => ({
    id,
    type,
    created_at: ago(minutes),
    account: other,
    status: status('s' + id, html, minutes),
  });

  const { minutesAgo: age } = profile;
  let released = false;
  /** The newest items that appear after release(): ids above all others, a minute old */
  const fresh = <T>(items: T[]) => (released ? items : []);

  const handler = async (route: Route) => {
    const url = new URL(route.request().url());
    const json = (body: unknown) => route.fulfill({ json: body });
    const svg = (body: string) => route.fulfill({ contentType: 'image/svg+xml', body });

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
          return json([...fresh([notification('21', 'mention', profile.news.mention, 1)]), notification('20', 'mention', profile.mention, age.mention)]);
        }
        const items = [
          ...fresh([notification('13', 'favourite', profile.news.favourite, 1)]),
          notification('12', 'favourite', profile.favourite, age.favourite),
          notification('11', 'reblog', profile.boost, age.boost),
        ];
        if (!profile.extras) return json(items);
        // Favourites and boosts have a second, older page
        if (url.searchParams.get('max_id')) return json([notification('5', 'favourite', 'Older favourite', 3000)]);
        const next = `<${instance}/api/v1/notifications?limit=40&types[]=favourite&types[]=reblog&max_id=11>; rel="next"`;
        // Like Mastodon, expose the Link header to the browser
        return route.fulfill({ headers: { link: next, 'access-control-expose-headers': 'Link' }, json: items });
      }
      case '/api/v1/conversations':
        return json([
          {
            id: '5',
            unread: true,
            accounts: [other],
            last_status: released ? status('31', profile.news.message, 1, other) : status('30', profile.message, age.message, other),
          },
        ]);
      case `/api/v1/accounts/${me.id}/statuses`: {
        const own = status('40', profile.post, age.post);
        const newest = fresh([status('41', profile.news.post, 1)]);
        if (!profile.extras) return json([...newest, own]);
        const image = { id: 'm1', type: 'image', url: `${instance}/preview.svg`, preview_url: `${instance}/preview.svg`, description: 'A purple square' };
        return json([...newest, { ...own, media_attachments: [image] }]);
      }
      case `/avatar-${user.id}.svg`:
        return svg(avatar(user.color, user.name[0]));
      case `/avatar-${friend.id}.svg`:
        return svg(avatar(friend.color, friend.name[0]));
      case '/emoji.svg':
        return svg(emojiSvg);
      case '/preview.svg':
        return svg(previewSvg);
      default:
        return route.fulfill({ status: 404, json: { error: 'not mocked' } });
    }
  };
  await page.route(`${instance}/**`, handler);
  return {
    release: () => {
      released = true;
    },
  };
}
