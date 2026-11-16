import { normalizeInstance } from '$lib/url';

/** Minimal scopes: read the account itself, its notifications and its statuses and conversations. */
export const SCOPES = 'read:accounts read:notifications read:statuses';

const PENDING_KEY = 'mast.oauth.pending';

export interface AppRegistration {
  instance: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /** Scopes the app was registered with, to detect that it must be registered again */
  scopes: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface PendingLogin {
  instance: string;
  state: string;
  verifier: string;
}

export function redirectUri(): string {
  return `${location.origin}/`;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(byteLength: number): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

/** PKCE S256 code challenge (RFC 7636): base64url(sha256(verifier)). */
export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/** True when the granted scope string contains every scope the app needs. */
export function hasRequiredScopes(granted: string): boolean {
  const have = new Set(granted.split(/\s+/));
  return SCOPES.split(' ').every((s) => have.has(s));
}

/** Registers this app on a server (POST /api/v1/apps). Mastodon only provisions confidential clients. */
export async function registerApp(instance: string): Promise<AppRegistration> {
  const response = await fetch(`${instance}/api/v1/apps`, {
    method: 'POST',
    body: new URLSearchParams({
      client_name: 'Mastodon Tools',
      redirect_uris: redirectUri(),
      scopes: SCOPES,
      website: location.origin,
    }),
  });
  if (!response.ok) throw new Error(`App registration failed (${response.status})`);
  const data = await response.json();
  if (typeof data.client_id !== 'string' || typeof data.client_secret !== 'string') {
    throw new Error('Unexpected app registration response');
  }
  return { instance, clientId: data.client_id, clientSecret: data.client_secret, redirectUri: redirectUri(), scopes: SCOPES };
}

/** Stores the PKCE verifier and state, then returns the authorization URL to send the user to. */
export async function startLogin(app: AppRegistration): Promise<string> {
  const state = randomString(16);
  const verifier = randomString(32);
  const pending: PendingLogin = { instance: app.instance, state, verifier };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

  const url = new URL(`${app.instance}/oauth/authorize`);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: app.clientId,
    redirect_uri: app.redirectUri,
    scope: SCOPES,
    state,
    code_challenge: await codeChallenge(verifier),
    code_challenge_method: 'S256',
    // Needed to authorize a second account on a server the browser is already logged in to
    force_login: 'true',
  }).toString();
  return url.href;
}

export interface LoginResult {
  instance: string;
  token: TokenResponse;
}

/** Reads the redirect parameters. Returns null when the URL is not an OAuth redirect. */
export function readRedirect(search: string): { code: string; state: string } | { error: string } | null {
  const params = new URLSearchParams(search);
  const state = params.get('state');
  if (!state) return null;
  const error = params.get('error');
  if (error) return { error: params.get('error_description') ?? error };
  const code = params.get('code');
  return code ? { code, state } : null;
}

/** Checks the state against the stored one and exchanges the code for a token. */
export async function finishLogin(
  code: string,
  state: string,
  loadApp: (instance: string) => Promise<AppRegistration | undefined>,
): Promise<LoginResult> {
  const raw = sessionStorage.getItem(PENDING_KEY);
  sessionStorage.removeItem(PENDING_KEY);
  const pending: PendingLogin | null = raw ? JSON.parse(raw) : null;
  if (!pending || pending.state !== state || !normalizeInstance(pending.instance)) {
    throw new Error('Login state did not match');
  }
  const app = await loadApp(pending.instance);
  if (!app) throw new Error('Unknown server');

  const response = await fetch(`${pending.instance}/oauth/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: app.clientId,
      client_secret: app.clientSecret,
      redirect_uri: app.redirectUri,
      code_verifier: pending.verifier,
    }),
  });
  if (!response.ok) throw new Error(`Token request failed (${response.status})`);
  const token: TokenResponse = await response.json();
  if (typeof token.access_token !== 'string') throw new Error('Unexpected token response');
  return { instance: pending.instance, token };
}

/** Revokes a token on the server (POST /oauth/revoke). Failure is not fatal for logging out locally. */
export async function revokeToken(app: AppRegistration, token: string): Promise<void> {
  await fetch(`${app.instance}/oauth/revoke`, {
    method: 'POST',
    body: new URLSearchParams({ client_id: app.clientId, client_secret: app.clientSecret, token }),
  });
}
