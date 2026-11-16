export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** The fields of Mastodon's Account entity this app uses. */
export interface Account {
  id: string;
  acct: string;
  display_name: string;
  avatar: string;
}

/** GET a Mastodon API path with a user token. */
export async function apiGet<T>(instance: string, token: string, path: string): Promise<T> {
  const response = await fetch(`${instance}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new ApiError(`Request failed (${response.status})`, response.status);
  return response.json();
}

export const verifyCredentials = (instance: string, token: string) =>
  apiGet<Account>(instance, token, '/api/v1/accounts/verify_credentials');
