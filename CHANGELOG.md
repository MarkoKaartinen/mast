### Unreleased

* Show a welcome page with the server field when no account is connected
* Give each account its own color by its place in the list, with colors far apart, instead of a hash that often repeated one

### 0.1.0: 2026-11-16

* First release of Mastodon Tools (MAST): a PWA for following several Mastodon accounts, in Finnish and English with the Catppuccin Mocha theme
* Log in to accounts on any server with OAuth and PKCE, tokens stay in the browser
* Show favourites and boosts, mentions, direct messages and sent posts of all accounts in four columns, with tabs on a narrow screen
* Show on every card which account it concerns with a color per account, the time as relative text, image attachments and custom emojis
* Count only items that arrive after an account was added as unread, with a read state icon, an unread count and a mark as read button per column, and the total in the page title and on the app icon
* Refresh every 5 minutes while the page is visible and with a refresh button, and load older items with load more
* Save the last loaded items to show them at once and offline, pause an account after a rate limit response and ask to log in again when a token is rejected
* Add the bell logo, app icons, MIT license, README with screenshots and browser tests with a mocked Mastodon server
