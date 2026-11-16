import type { AppRegistration } from '$lib/api/oauth';

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

let dbPromise: Promise<IDBDatabase> | undefined;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(APPS, { keyPath: 'instance' });
      request.result.createObjectStore(ACCOUNTS, { keyPath: 'key' });
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
