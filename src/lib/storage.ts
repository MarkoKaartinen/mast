import type { AppRegistration } from '$lib/api/oauth';
import type { Slot } from '$lib/feed';

export interface StoredAccount {
  /** Unique per account: "<instance>/<account id>" */
  key: string;
  instance: string;
  id: string;
  acct: string;
  displayName: string;
  avatar: string;
  accessToken: string;
  scope: string;
}

const DB_NAME = 'mast';
const APPS = 'apps';
const ACCOUNTS = 'accounts';
const FEEDS = 'feeds';
/** The cached items are one record, so that saving and restoring them is a single step */
const FEEDS_KEY = 'slots';

let dbPromise: Promise<IDBDatabase> | undefined;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    // Version 2 added the feeds store for the offline cache
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(APPS)) db.createObjectStore(APPS, { keyPath: 'instance' });
      if (!db.objectStoreNames.contains(ACCOUNTS)) db.createObjectStore(ACCOUNTS, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(FEEDS)) db.createObjectStore(FEEDS, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function run<T>(store: string, mode: IDBTransactionMode, action: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(store, mode).objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const loadApp = (instance: string) => run<AppRegistration | undefined>(APPS, 'readonly', (s) => s.get(instance));
export const saveApp = (app: AppRegistration) => run(APPS, 'readwrite', (s) => s.put(app));
export const loadAccounts = () => run<StoredAccount[]>(ACCOUNTS, 'readonly', (s) => s.getAll());
export const saveAccount = (account: StoredAccount) => run(ACCOUNTS, 'readwrite', (s) => s.put(account));
export const deleteAccount = (key: string) => run(ACCOUNTS, 'readwrite', (s) => s.delete(key));

/** The last loaded items, shown at once on start and when the servers cannot be reached. */
export type CachedSlots = Record<string, Slot>;
export const saveFeeds = (slots: CachedSlots) => run(FEEDS, 'readwrite', (s) => s.put({ key: FEEDS_KEY, slots }));
export const loadFeeds = async () => (await run<{ slots: CachedSlots } | undefined>(FEEDS, 'readonly', (s) => s.get(FEEDS_KEY)))?.slots;
