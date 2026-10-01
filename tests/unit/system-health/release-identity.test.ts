import { describe, expect, it } from 'vitest';
import {
  createReleaseIdentity,
  getConfiguredReleaseIdentity,
  type ReleaseIdentityArtifact,
} from '../../../src/config/release.js';

const gitSha = '0123456789abcdef0123456789abcdef01234567';
const entrySha = 'a'.repeat(64);
const sourceEnv = {
  NODE_ENV: 'production',
  RENDER: 'true',
  RENDER_GIT_COMMIT: gitSha,
  SERVICE_VERSION: '0.1.0',
};

function artifact(
  overrides: Partial<Omit<ReleaseIdentityArtifact, 'workingTree'>> & { workingTree?: string } = {},
): ReleaseIdentityArtifact {
  const base = createReleaseIdentity({
    applicationVersion: '0.1.0',
    serviceVersion: '0.1.0',
    buildId: `render-${gitSha}`,
    buildTimestamp: '2026-10-01T09:00:00.000Z',
    environment: 'production',
    gitSha,
    migrationHead: '0042_immutable_lab_equipment_usage',
    migrationHeadChecksum: 'b'.repeat(64),
    workingTree: 'clean',
    artifactSha256: entrySha,
  });
  return {
    ...base,
    applicationVersion: '0.1.0',
    migrationHeadChecksum: 'b'.repeat(64),
    artifactSha256: entrySha,
    workingTree: 'clean',
    ...overrides,
  } as ReleaseIdentityArtifact;
}

describe('artifact-bound release identity', () => {
  it('verifies all six fields only when the source artifact and running entry match', () => {
    const result = getConfiguredReleaseIdentity(
      sourceEnv,
      artifact(),
      entrySha,
      '2026-10-01T09:01:00.000Z',
    );
    expect(result).toMatchObject({ status: 'VERIFIED', verifiedFields: 6, fieldCount: 6 });
    const fields = result.fields ?? [];
    expect(fields.map((field) => field.status)).toEqual(Array(6).fill('VERIFIED'));
    expect(new Set(fields.map((field) => field.source)).size).toBe(6);
  });

  it('does not promote six plausible environment values into trusted identity', () => {
    const result = getConfiguredReleaseIdentity({
      ...sourceEnv,
      RELEASE_ID: 'rel-0123456789abcdef',
      RELEASE_BUILD_ID: 'fake-build',
      RELEASE_BUILD_TIMESTAMP: '2026-10-01T09:00:00.000Z',
      RELEASE_ENVIRONMENT: 'production',
      RELEASE_GIT_SHA: gitSha,
      RELEASE_MIGRATION_HEAD: '0042_immutable_lab_equipment_usage',
    });
    expect(result).toMatchObject({
      status: 'UNVERIFIED',
      verifiedFields: 0,
      reason: 'ARTIFACT_MISSING',
    });
  });

  it('keeps a matching dirty local artifact distinct from production evidence', () => {
    const localArtifact = artifact({
      environment: 'local',
      workingTree: ' M src/app.ts',
      dirty: true,
    });
    const local = getConfiguredReleaseIdentity(
      { NODE_ENV: 'development', SERVICE_VERSION: '0.1.0' },
      localArtifact,
      entrySha,
    );
    expect(local).toMatchObject({ status: 'VERIFIED', verifiedFields: 6, dirty: true });

    const dirtyProductionArtifact = artifact({ workingTree: ' M src/app.ts', dirty: true });
    expect(
      getConfiguredReleaseIdentity(sourceEnv, dirtyProductionArtifact, entrySha),
    ).toMatchObject({
      status: 'UNVERIFIED',
      reason: 'ARTIFACT_INVALID',
      verifiedFields: 0,
    });
  });

  it('fails closed for missing, invalid, stale, and runtime-mismatched evidence', () => {
    expect(getConfiguredReleaseIdentity(sourceEnv, undefined, entrySha).status).toBe('UNVERIFIED');
    expect(
      getConfiguredReleaseIdentity(sourceEnv, artifact({ migrationHead: 'malformed' }), entrySha),
    ).toMatchObject({ status: 'UNVERIFIED', reason: 'ARTIFACT_INVALID' });
    expect(getConfiguredReleaseIdentity(sourceEnv, artifact(), 'c'.repeat(64))).toMatchObject({
      status: 'UNVERIFIED',
      reason: 'ARTIFACT_MISMATCH',
      verifiedFields: 0,
    });
    expect(
      getConfiguredReleaseIdentity(
        { ...sourceEnv, RENDER_GIT_COMMIT: 'f'.repeat(40) },
        artifact(),
        entrySha,
      ),
    ).toMatchObject({ status: 'UNVERIFIED', reason: 'RUNTIME_MISMATCH' });
  });

  it('does not expose a version as evidence of a verified release', () => {
    const result = getConfiguredReleaseIdentity({ SERVICE_VERSION: '0.1.0' });
    expect(result.status).toBe('UNVERIFIED');
    expect(result.verifiedFields).toBe(0);
    expect(result).not.toHaveProperty('releaseId');
  });
});
