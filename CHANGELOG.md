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
