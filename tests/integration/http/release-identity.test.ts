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
    const response = await GET(context('', actor([])));
    expect(response.status).toBe(403);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty('release');
  });

  it('returns artifact-bound identity status and six source checks for a permitted actor', async () => {
    const response = await GET(context('', actor(permitted)));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      verifiedFields: number;
      fieldCount: number;
      fields: Array<{ status: string; source: string }>;
    };
    expect(body.fieldCount).toBe(6);
    expect(body.fields).toHaveLength(6);
    expect(body.verifiedFields).toBe(
      body.fields.filter((field) => field.status === 'VERIFIED').length,
    );
    if (body.status === 'VERIFIED') expect(body.verifiedFields).toBe(6);
  });

  it('ignores browser-supplied identity overrides and legacy environment values', async () => {
    vi.stubEnv('RELEASE_GIT_SHA', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    vi.stubEnv('RELEASE_ID', 'rel-aaaaaaaaaaaaaaaa');
    vi.stubEnv('RENDER', 'true');
    vi.stubEnv('RENDER_GIT_COMMIT', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    resetServerEnvForTests();
    const response = await GET(
      context(
        '?RELEASE_GIT_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&gitSha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        actor(permitted),
      ),
    );
    const body = (await response.json()) as { release: Record<string, string>; status: string };
    expect(body.release.gitSha).not.toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(body.status).toBe('UNVERIFIED');
    expect(body).toMatchObject({ reason: 'RUNTIME_MISMATCH', verifiedFields: 0 });
  });

  it('stays UNVERIFIED when platform identity mismatches and exposes no secrets', async () => {
    vi.stubEnv('SESSION_SECRET', 'top-secret-session-value-32-chars-ok');
    vi.stubEnv('DATABASE_URL', 'postgresql://user:secret@db.internal:5432/qc_ops');
    vi.stubEnv('RENDER', 'true');
    vi.stubEnv('RENDER_GIT_COMMIT', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    resetServerEnvForTests();
    const response = await GET(context('', actor(permitted)));
    expect(response.status).toBe(200);
    const serialized = await response.text();
    expect(serialized).toContain('"UNVERIFIED"');
    expect(serialized).not.toContain('top-secret-session-value');
    expect(serialized).not.toContain('db.internal');
  });
});
