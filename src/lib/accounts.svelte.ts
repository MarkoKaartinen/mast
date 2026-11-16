import { verifyCredentials } from '$lib/api/client';
import {
  finishLogin,
  hasRequiredScopes,
  readRedirect,
  registerApp,
  revokeToken,
  SCOPES,
  startLogin,
} from '$lib/api/oauth';
import { deleteAccount, loadAccounts, loadApp, saveAccount, saveApp, type StoredAccount } from '$lib/storage';
import { normalizeInstance } from '$lib/url';

export const accountStore = $state({
  list: [] as StoredAccount[],
  ready: false,
  error: '' as '' | 'invalidInstance' | 'loginFailed',
});

/** Loads saved accounts and completes a login if the page was opened from an OAuth redirect. */
export async function initAccounts(): Promise<void> {
  accountStore.list = await loadAccounts();
  const redirect = readRedirect(location.search);
  if (redirect) {
    // Remove code and state from the address bar so they are not kept in history
    history.replaceState(null, '', location.pathname);
    try {
      if ('error' in redirect) throw new Error(redirect.error);
      const { instance, token } = await finishLogin(redirect.code, redirect.state, loadApp);
      const user = await verifyCredentials(instance, token.access_token);
      const account: StoredAccount = {
        key: `${instance}/${user.id}`,
        instance,
        id: user.id,
        acct: `${user.acct}@${new URL(instance).host}`,
        displayName: user.display_name || user.acct,
        avatar: user.avatar,
        accessToken: token.access_token,
        scope: token.scope,
      };
      await saveAccount(account);
      accountStore.list = [...accountStore.list.filter((a) => a.key !== account.key), account];
    } catch {
      accountStore.error = 'loginFailed';
    }
  }
  accountStore.ready = true;
}

/** Registers the app on the server if needed and sends the browser to its authorization page. */
export async function addAccount(input: string): Promise<void> {
  accountStore.error = '';
  const instance = normalizeInstance(input);
  if (!instance) {
    accountStore.error = 'invalidInstance';
    return;
  }
  try {
    let app = await loadApp(instance);
    if (!app || app.scopes !== SCOPES) {
      app = await registerApp(instance);
      await saveApp(app);
    }
    location.assign(await startLogin(app));
  } catch {
    accountStore.error = 'loginFailed';
  }
}

export async function removeAccount(account: StoredAccount): Promise<void> {
  const app = await loadApp(account.instance);
  // Revoking is best effort: the account is removed locally even if the server cannot be reached
  if (app) await revokeToken(app, account.accessToken).catch(() => {});
  await deleteAccount(account.key);
  accountStore.list = accountStore.list.filter((a) => a.key !== account.key);
}

/** Accounts whose token was granted fewer scopes than the app needs now and must log in again. */
export const needsRelogin = (account: StoredAccount) => !hasRequiredScopes(account.scope);
