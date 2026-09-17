import { describe, expect, it } from 'vitest';
import { getRequiredRouteFiles, getRouteById, routes } from '../../src/shared/routing/routes.js';
import { definePageRoute } from '../../src/shared/routing/route-types.js';
import { validateRouteIntegrity } from '../../src/shared/routing/route-integrity.js';

describe('canonical route registry', () => {
  it('keeps route IDs, paths, and Astro files unique', () => {
    expect(new Set(routes.map((route) => route.id)).size).toBe(routes.length);
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length);
    expect(new Set(routes.map((route) => route.file)).size).toBe(routes.length);
  });

  it('does not require deferred or conditional files before their policy is approved', () => {
    expect(getRequiredRouteFiles()).not.toContain('src/pages/auth/recovery.astro');
    expect(getRequiredRouteFiles()).not.toContain('src/pages/quality/ncr/new.astro');
  });

  it('uses explicit public visibility only for public entry routes', () => {
    expect(getRouteById('RT-AUTH-001')).toMatchObject({
      path: '/login',
      visibility: 'PUBLIC',
    });
    expect(
      routes.filter(
        (route) => route.visibility === 'PUBLIC' && route.fileExpectation === 'required',
      ),
    ).toHaveLength(2);
  });

  it('defaults future page declarations to authenticated visibility', () => {
    expect(
      definePageRoute({
        id: 'RT-TEST-001',
        path: '/test',
        page: 'src/pages/test.astro',
        domain: 'test',
        title: 'Test',
      }).visibility,
    ).toBe('AUTHENTICATED');
  });

  it('reports route, file, visibility, breadcrumb, and navigation drift', () => {
    const valid = definePageRoute({
      id: 'RT-TEST-001',
      path: '/test',
      page: 'src/pages/test.astro',
      domain: 'test',
      title: 'Test',
    });
    const invalid = {
      ...valid,
      id: 'RT-TEST-001',
      path: '/test',
      breadcrumb: undefined,
      visibility: 'NOT_A_VISIBILITY',
    } as never;
    const errors = validateRouteIntegrity({
      routes: [valid, invalid],
      pageFiles: ['src/pages/unregistered.astro'],
      navigationRouteIds: ['RT-MISSING'],
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        'duplicate route id: RT-TEST-001',
        'duplicate canonical path: /test',
        'unknown visibility: RT-TEST-001',
        'incomplete page metadata: RT-TEST-001',
        'registered route has missing page file: src/pages/test.astro',
        'application page is not registered: src/pages/unregistered.astro',
        'navigation points to unknown route: RT-MISSING',
      ]),
    );
  });
});
