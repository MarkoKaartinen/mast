import { describe, expect, it } from 'vitest';
import { codeChallenge, hasRequiredScopes, readRedirect, SCOPES } from './oauth';

describe('oauth', () => {
  it('computes the PKCE S256 challenge from the RFC 7636 example', async () => {
    expect(await codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('checks that all required scopes were granted', () => {
    expect(hasRequiredScopes(SCOPES)).toBe(true);
    expect(hasRequiredScopes('read')).toBe(false);
    expect(hasRequiredScopes('read:accounts read:notifications')).toBe(false);
  });

  it('reads the redirect parameters', () => {
    expect(readRedirect('')).toBeNull();
    expect(readRedirect('?code=abc')).toBeNull();
    expect(readRedirect('?code=abc&state=xyz')).toEqual({ code: 'abc', state: 'xyz' });
    expect(readRedirect('?error=access_denied&error_description=No&state=xyz')).toEqual({ error: 'No' });
  });
});
