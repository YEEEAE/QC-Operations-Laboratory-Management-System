import { test, expect } from '@playwright/test';

test.describe('security headers baseline', () => {
  test('applies CSP baseline and hardening headers to public pages', async ({ request }) => {
    const response = await request.get('/login');
    expect(response.status()).toBe(200);
    const headers = response.headers();
    const csp = headers['content-security-policy'] ?? '';
    // SECURITY-ARCHITECTURE §76 baseline
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    // §74 hardening
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBeTruthy();
    expect(headers['permissions-policy']).toBeTruthy();
  });

  test('keeps HSTS production-only', async ({ request }) => {
    const response = await request.get('/login');
    // The local E2E server runs outside production; §70 gates HSTS to prod.
    expect(response.headers()['strict-transport-security']).toBeUndefined();
  });

  test('never sends a wildcard CORS header on auth endpoints', async ({ request }) => {
    const get = await request.get('/login');
    expect(get.headers()['access-control-allow-origin']).toBeUndefined();
    const post = await request.post('/login', {
      headers: { origin: 'https://evil.example' },
      form: { loginIdentity: 'attacker', password: 'guess' },
    });
    expect(post.headers()['access-control-allow-origin']).toBeUndefined();
  });

  test('rejects cross-origin state-changing POSTs instead of allowing them', async ({
    request,
  }) => {
    const response = await request.post('/login', {
      headers: { origin: 'https://evil.example' },
      form: { loginIdentity: 'attacker', password: 'guess' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('does not leak stack traces or source internals on unknown routes', async ({ request }) => {
    const response = await request.get('/definitely-not-a-page-master031');
    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).not.toMatch(/at .+ \(\//);
    expect(body).not.toContain('node_modules');
    expect(body).not.toMatch(/\.ts:\d+/);
  });
});
