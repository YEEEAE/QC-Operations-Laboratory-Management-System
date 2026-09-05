import { describe, expect, it } from 'vitest';
import {
  contentSecurityPolicy,
  securityHeaders,
} from '../../../src/shared/security/security-headers';
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '../../../src/shared/security/session-cookie';

describe('security headers baseline (SECURITY-ARCHITECTURE §74–§78)', () => {
  it('emits the approved CSP baseline in production without unsafe-inline/eval', () => {
    const csp = contentSecurityPolicy('production');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('documents the development-only inline exception for Astro dev tooling', () => {
    const devCsp = contentSecurityPolicy('development');
    expect(devCsp).toContain('unsafe-inline');
    expect(devCsp).toContain('ws:');
    expect(contentSecurityPolicy('production')).not.toContain('unsafe-inline');
  });

  it('sends hardening headers in every environment and HSTS only in production', () => {
    for (const environment of ['development', 'test', 'production'] as const) {
      const headers = securityHeaders(environment);
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['referrer-policy']).toBeTruthy();
      expect(headers['permissions-policy']).toBeTruthy();
      expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    }
    expect(securityHeaders('development')['strict-transport-security']).toBeUndefined();
    expect(securityHeaders('production')['strict-transport-security']).toBeTruthy();
  });
});

describe('session cookie contract (SECURITY-ARCHITECTURE §12)', () => {
  it('always applies __Host- semantics regardless of environment', () => {
    const options = sessionCookieOptions();
    expect(options).toEqual({ path: '/', httpOnly: true, sameSite: 'strict', secure: true });
    expect(SESSION_COOKIE_NAME).toBe('__Host-qc_session');
  });

  it('expires cookies without weakening the flags', () => {
    const options = sessionCookieOptions({ expired: true });
    expect(options['maxAge']).toBe(0);
    expect(options.secure).toBe(true);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('strict');
  });
});
