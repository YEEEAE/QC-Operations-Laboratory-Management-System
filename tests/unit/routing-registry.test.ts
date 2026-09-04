import { describe, expect, it } from 'vitest';
import { getRequiredRouteFiles, getRouteById, routes } from '../../src/shared/routing/routes.js';

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

  it('marks login as the only currently required public browser route', () => {
    expect(getRouteById('RT-AUTH-001')).toMatchObject({
      path: '/login',
      access: 'public',
    });
    expect(
      routes.filter((route) => route.access === 'public' && route.fileExpectation === 'required'),
    ).toHaveLength(1);
  });
});
