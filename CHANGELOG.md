### Unreleased

* Add README, AGENTS.md and project documentation
* Add the app shell: Vite, Svelte, PWA manifest and service worker, Catppuccin Mocha theme, Finnish and English UI
* Add OAuth login with PKCE and the state check, stored in the browser
* Add accounts panel to connect and remove accounts on any server
* Show favourites and boosts, mentions, direct messages and sent posts of all accounts in four columns
* Highlight unread items, show unread counts and add a mark as read button per column
* Refresh the columns every 5 minutes while the page is visible and with a refresh button
* Keep the old items when a refresh fails and pause an account for a while after a rate limit response
* Add browser tests with a mocked Mastodon server
* Show the server form only when adding an account and mark accounts that fail to load
* Fix empty columns staying in the loading state and feeds being reloaded in a loop
* Show which columns failed and with what status when hovering the warning of an account
* Add a load more button to each column for older items
* Ask to log in again when the server no longer accepts a token
* Redesign the layout: full height columns that scroll on their own, tabs at the bottom on a narrow screen and a compact mark as read icon
* Move the accounts behind an icon in the top right corner and give each account its own color
* Show on every card which account it concerns, the time as relative text and image attachments
* Show the account at the top of each card and dim the colored edge of read cards
* Show the read state of a card with an icon and the edge color instead of a different background
* Show the app version in the accounts menu
* Add the bell logo as the app icon, favicon and app bar logo
