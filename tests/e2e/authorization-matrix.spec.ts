import { expect, test } from '@playwright/test';
import { routes } from '../../src/shared/routing/routes';

// Valid-format substituted identifier used for IDOR-style probing; no real record exists behind it.
const SUBSTITUTED_UUID = '01900000-0000-7000-0000-0000000000f1';

const protectedRoutes = routes
  .filter((route) => route.fileExpectation === 'required' && route.access !== 'public')
  .map((route) => ({ id: route.id, path: route.path.replaceAll(/\[[^\]]+\]/g, SUBSTITUTED_UUID) }));

const detailRoutes = routes
  .filter((route) => route.fileExpectation === 'required' && /\[[^\]]+\]/.test(route.path))
  .map((route) => route.path.replaceAll(/\[[^\]]+\]/g, SUBSTITUTED_UUID));

// Sensitive Astro Actions invoked directly, bypassing any page or button (TESTING-STRATEGY §37).
const sensitiveActions = [
  'quarantine.approveInspection',
  'quarantine.releaseReceiving',
  'laboratory.approve',
  'documents.approve',
  'documents.supersede',
  'approvals.decide',
  'admin.updateRolePermissions',
  'admin.manageUserScopes',
  'system.requestRestore',
  'reports.exportReport',
  'tasks.transition',
  'findings.create',
];

const LEAK_MARKERS = /APPROVED|RELEASED|inspection_result|release_system/;

test.describe('unauthenticated authorization matrix across protected domains', () => {
  test('serves no protected content to unauthenticated browsers on any registered route', async ({
    page,
  }) => {
    expect(protectedRoutes.length).toBeGreaterThan(20);
    for (const route of protectedRoutes) {
      const response = await page.goto(route.path);
      const status = response?.status() ?? 0;
      if (status === 200) {
        // Implemented routes must bounce to login, never render protected content.
        expect(page.url(), `${route.id} (${route.path}) must redirect to login`).toMatch(
          /\/login\?returnTo=%2F/,
        );
        expect(await page.content(), `${route.id} must not leak record data`).not.toMatch(
          LEAK_MARKERS,
        );
      } else {
        // Unimplemented or explicitly rejected routes must not render content either.
        expect(
          status,
          `${route.id} (${route.path}) must deny unauthenticated access`,
        ).toBeGreaterThanOrEqual(400);
      }
    }
  });

  test('does not leak record data when object identifiers are substituted on detail routes', async ({
    page,
  }) => {
    expect(detailRoutes.length).toBeGreaterThan(5);
    for (const path of detailRoutes) {
      const response = await page.goto(path);
      const status = response?.status() ?? 0;
      if (status === 200) {
        expect(page.url(), `substituted id on ${path} must redirect to login`).toMatch(
          /\/login\?returnTo=%2F/,
        );
      } else {
        expect(status, `substituted id on ${path} must not be served`).toBeGreaterThanOrEqual(400);
      }
      expect(
        await page.content(),
        `substituted id on ${path} must not reveal record data`,
      ).not.toMatch(LEAK_MARKERS);
    }
  });

  test('rejects unauthenticated direct action invocation through the actions RPC endpoint', async ({
    request,
  }) => {
    for (const action of sensitiveActions) {
      const response = await request.post(`/_actions/${action}`, {
        headers: { origin: 'http://127.0.0.1:4321' },
        data: { id: SUBSTITUTED_UUID, expectedVersion: 1, requestId: 'e2e-direct' },
      });
      expect(
        response.status(),
        `${action} must not execute without a session`,
      ).toBeGreaterThanOrEqual(400);
      const body = await response.text();
      expect(body, `${action} must not return controlled data`).not.toMatch(LEAK_MARKERS);
    }
  });

  test('rejects unauthenticated form-style action invocation for sensitive operations', async ({
    request,
  }) => {
    for (const action of sensitiveActions) {
      const response = await request.post(`/login?_action=${action}`, {
        headers: { origin: 'http://127.0.0.1:4321' },
        form: { id: SUBSTITUTED_UUID, expectedVersion: '1', requestId: 'e2e-direct' },
        maxRedirects: 0,
      });
      expect(
        response.status(),
        `${action} must not execute via form invocation without a session`,
      ).toBeGreaterThanOrEqual(400);
    }
  });

  test('stops direct action posts to protected routes at the middleware redirect', async ({
    request,
  }) => {
    const response = await request.post('/dashboard?_action=quarantine.releaseReceiving', {
      headers: { origin: 'http://127.0.0.1:4321' },
      form: { id: SUBSTITUTED_UUID, expectedVersion: '1' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toMatch(/^\/login\?returnTo=%2Fdashboard/);
  });

  test('keeps reports, search and dashboard scoped behind authentication', async ({ page }) => {
    for (const path of ['/reports/quarantine-aging', '/search?q=quarantine', '/dashboard']) {
      await page.goto(path);
      expect(page.url(), `${path} must redirect to login`).toMatch(/\/login\?returnTo=%2F/);
    }
  });
});
