import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../../src/pages/api/system/release-identity.js';
import { resetServerEnvForTests } from '../../../src/config/env.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

type RouteContext = Parameters<typeof GET>[0];

const actor = (permissions: ActorContext['permissions']): ActorContext => ({
  id: '01900000-0000-7000-8000-000000000212',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions,
});

const permitted = [{ code: 'PERM-HLTH-VIEW', scopes: ['GLOBAL'] }] as ActorContext['permissions'];

function context(query = '', actorValue?: ActorContext): RouteContext {
  return {
    locals: { ...(actorValue ? { actor: actorValue } : {}) },
    request: new Request(`https://example.test/api/system/release-identity${query}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as RouteContext;
}

const COMPLETE_IDENTITY = {
  RELEASE_ID: 'rel-0123456789abcdef',
  RELEASE_BUILD_ID: 'render-123',
  RELEASE_BUILD_TIMESTAMP: '2026-09-10T01:00:00.000Z',
  RELEASE_ENVIRONMENT: 'production',
  RELEASE_GIT_SHA: '0123456789abcdef0123456789abcdef01234567',
  RELEASE_MIGRATION_HEAD: '0018_rate_limit_windows',
};

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  resetServerEnvForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetServerEnvForTests();
});

describe('authenticated build-identity surface (Prompt 12 integration)', () => {
  it('denies unauthenticated callers without leaking identity', async () => {
    const response = await GET(context());
    expect(response.status).toBe(401);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 401 });
    expect(JSON.stringify(body)).not.toContain('rel-');
    expect(body).not.toHaveProperty('release');
  });

  it('denies actors without the explicit health-view permission', async () => {
    for (const [key, value] of Object.entries(COMPLETE_IDENTITY)) vi.stubEnv(key, value);
    resetServerEnvForTests();
    const response = await GET(context('', actor([])));
    expect(response.status).toBe(403);
    const body = (await response.json()) as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain('rel-0123456789abcdef');
  });

  it('returns the exact server-derived identity for a permitted actor', async () => {
    for (const [key, value] of Object.entries(COMPLETE_IDENTITY)) vi.stubEnv(key, value);
    resetServerEnvForTests();
    const response = await GET(context('', actor(permitted)));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'VERIFIED',
      release: {
        id: 'rel-0123456789abcdef',
        buildId: 'render-123',
        gitSha: '0123456789abcdef0123456789abcdef01234567',
        buildTimestamp: '2026-09-10T01:00:00.000Z',
        environment: 'production',
        migrationHead: '0018_rate_limit_windows',
      },
    });
  });

  it('ignores browser-supplied identity overrides', async () => {
    for (const [key, value] of Object.entries(COMPLETE_IDENTITY)) vi.stubEnv(key, value);
    resetServerEnvForTests();
    const response = await GET(
      context(
        '?RELEASE_GIT_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&gitSha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        actor(permitted),
      ),
    );
    const body = (await response.json()) as { release: Record<string, string> };
    expect(body.release.gitSha).toBe('0123456789abcdef0123456789abcdef01234567');
  });

  it('stays UNVERIFIED when build evidence is absent and exposes no secrets', async () => {
    vi.stubEnv('SESSION_SECRET', 'top-secret-session-value-32-chars-ok');
    vi.stubEnv('DATABASE_URL', 'postgresql://user:secret@db.internal:5432/qc_ops');
    resetServerEnvForTests();
    const response = await GET(context('', actor(permitted)));
    expect(response.status).toBe(200);
    const serialized = await response.text();
    expect(serialized).toContain('"UNVERIFIED"');
    expect(serialized).not.toContain('top-secret-session-value');
    expect(serialized).not.toContain('db.internal');
  });
});
