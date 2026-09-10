import { createHash } from 'node:crypto';

export const RELEASE_SCHEMA_VERSION = 1 as const;
export const SERVICE_NAME = 'qc-operations-laboratory-management-system';

export const RELEASE_ENVIRONMENTS = ['local', 'test', 'ci', 'staging', 'production'] as const;
export type ReleaseEnvironment = (typeof RELEASE_ENVIRONMENTS)[number];

export interface ReleaseIdentityInput {
  applicationVersion: string;
  serviceVersion?: string;
  buildId: string;
  buildTimestamp: string;
  environment: ReleaseEnvironment;
  gitSha: string;
  migrationHead: string;
  migrationHeadChecksum?: string;
  workingTree: string;
  artifactSha256?: string;
}

export interface ReleaseIdentity extends ReleaseIdentityInput {
  readonly schemaVersion: typeof RELEASE_SCHEMA_VERSION;
  readonly releaseId: string;
  readonly dirty: boolean;
  readonly serviceName: typeof SERVICE_NAME;
  readonly serviceVersion: string;
}

export interface PublicReleaseInfo {
  service: { name: typeof SERVICE_NAME; version: string };
  release: {
    id: string;
    buildId: string;
    gitSha: string;
    migrationHead: string;
    environment: ReleaseEnvironment;
  };
}

export interface ConfiguredReleaseIdentity {
  status: 'VERIFIED' | 'UNVERIFIED';
  releaseId?: string;
  buildId?: string;
  buildTimestamp?: string;
  environment?: ReleaseEnvironment;
  gitSha?: string;
  migrationHead?: string;
  serviceVersion?: string;
}

const SHA256 = /^[0-9a-f]{64}$/i;
const GIT_SHA = /^[0-9a-f]{40}$/i;
const MIGRATION_HEAD = /^\d{4}_[a-z0-9_]+$/;
const SAFE_VALUE = /^[A-Za-z0-9][A-Za-z0-9._:+/@-]{0,127}$/;
const RELEASE_ID = /^rel-[0-9a-f]{16}$/i;

function assertSafeValue(name: string, value: string): void {
  if (!value || !SAFE_VALUE.test(value)) throw new Error(`Invalid ${name}.`);
}

function identityDigest(input: ReleaseIdentityInput): string {
  return createHash('sha256')
    .update(
      [
        input.applicationVersion,
        input.serviceVersion ?? input.applicationVersion,
        input.buildId,
        input.gitSha.toLowerCase(),
        input.migrationHead,
        input.migrationHeadChecksum ?? '',
        input.artifactSha256 ?? '',
      ].join('\u0000'),
      'utf8',
    )
    .digest('hex')
    .slice(0, 16);
}

export function createReleaseIdentity(input: ReleaseIdentityInput): ReleaseIdentity {
  if (!RELEASE_ENVIRONMENTS.includes(input.environment))
    throw new Error('Invalid release environment.');
  assertSafeValue('application version', input.applicationVersion);
  if (input.serviceVersion) assertSafeValue('service version', input.serviceVersion);
  assertSafeValue('build ID', input.buildId);
  if (!GIT_SHA.test(input.gitSha)) throw new Error('Invalid Git SHA.');
  if (!MIGRATION_HEAD.test(input.migrationHead)) throw new Error('Invalid migration head.');
  if (input.migrationHeadChecksum && !SHA256.test(input.migrationHeadChecksum))
    throw new Error('Invalid migration head checksum.');
  if (input.artifactSha256 && !SHA256.test(input.artifactSha256))
    throw new Error('Invalid artifact checksum.');
  if (!Number.isFinite(Date.parse(input.buildTimestamp)))
    throw new Error('Invalid build timestamp.');

  const workingTree = input.workingTree.trim();
  const dirty = workingTree !== '' && workingTree.toLowerCase() !== 'clean';
  if (input.environment === 'production' && (dirty || workingTree.toLowerCase() === 'unknown')) {
    throw new Error('Production release evidence refuses a dirty working tree or unknown state.');
  }

  return {
    ...input,
    schemaVersion: RELEASE_SCHEMA_VERSION,
    releaseId: `rel-${identityDigest(input)}`,
    dirty,
    serviceName: SERVICE_NAME,
    serviceVersion: input.serviceVersion ?? input.applicationVersion,
  };
}

export function assertReleaseIdentity(
  expected: Pick<
    ReleaseIdentity,
    | 'releaseId'
    | 'buildId'
    | 'gitSha'
    | 'migrationHead'
    | 'applicationVersion'
    | 'serviceVersion'
    | 'environment'
    | 'migrationHeadChecksum'
    | 'artifactSha256'
  >,
  actual: Pick<
    ReleaseIdentity,
    | 'releaseId'
    | 'buildId'
    | 'gitSha'
    | 'migrationHead'
    | 'applicationVersion'
    | 'serviceVersion'
    | 'environment'
    | 'migrationHeadChecksum'
    | 'artifactSha256'
  >,
): void {
  const fields = [
    'releaseId',
    'buildId',
    'gitSha',
    'migrationHead',
    'migrationHeadChecksum',
    'applicationVersion',
    'serviceVersion',
    'environment',
    'artifactSha256',
  ] as const;
  for (const field of fields) {
    if (expected[field] !== actual[field]) {
      throw new Error(
        `Release identity ${field} mismatch: expected ${String(expected[field])}, actual ${String(actual[field])}.`,
      );
    }
  }
}

export function getPublicReleaseInfo(identity: ReleaseIdentity): PublicReleaseInfo {
  return {
    service: { name: SERVICE_NAME, version: identity.serviceVersion },
    release: {
      id: identity.releaseId,
      buildId: identity.buildId,
      gitSha: identity.gitSha,
      migrationHead: identity.migrationHead,
      environment: identity.environment,
    },
  };
}

export function getConfiguredReleaseIdentity(
  environment: Record<string, string | undefined>,
): ConfiguredReleaseIdentity {
  const serviceVersion = environment.SERVICE_VERSION?.trim() || undefined;
  const releaseId = environment.RELEASE_ID?.trim();
  const buildId = environment.RELEASE_BUILD_ID?.trim();
  const buildTimestamp = environment.RELEASE_BUILD_TIMESTAMP?.trim();
  const releaseEnvironment = environment.RELEASE_ENVIRONMENT?.trim() as
    ReleaseEnvironment | undefined;
  const gitSha = environment.RELEASE_GIT_SHA?.trim().toLowerCase();
  const migrationHead = environment.RELEASE_MIGRATION_HEAD?.trim();
  const complete = Boolean(
    releaseId &&
    RELEASE_ID.test(releaseId) &&
    buildId &&
    SAFE_VALUE.test(buildId) &&
    buildTimestamp &&
    Number.isFinite(Date.parse(buildTimestamp)) &&
    releaseEnvironment &&
    RELEASE_ENVIRONMENTS.includes(releaseEnvironment) &&
    gitSha &&
    GIT_SHA.test(gitSha) &&
    migrationHead &&
    MIGRATION_HEAD.test(migrationHead),
  );
  return {
    status: complete ? 'VERIFIED' : 'UNVERIFIED',
    ...(releaseId && RELEASE_ID.test(releaseId) ? { releaseId } : {}),
    ...(buildId && SAFE_VALUE.test(buildId) ? { buildId } : {}),
    ...(buildTimestamp && Number.isFinite(Date.parse(buildTimestamp)) ? { buildTimestamp } : {}),
    ...(releaseEnvironment && RELEASE_ENVIRONMENTS.includes(releaseEnvironment)
      ? { environment: releaseEnvironment }
      : {}),
    ...(gitSha && GIT_SHA.test(gitSha) ? { gitSha } : {}),
    ...(migrationHead && MIGRATION_HEAD.test(migrationHead) ? { migrationHead } : {}),
    ...(serviceVersion && SAFE_VALUE.test(serviceVersion) ? { serviceVersion } : {}),
  };
}

export function getServiceVersion(
  environment: Record<string, string | undefined>,
  fallback: string,
): string {
  const candidate = environment.SERVICE_VERSION?.trim();
  const safeFallback = fallback.trim();
  return candidate && SAFE_VALUE.test(candidate)
    ? candidate
    : SAFE_VALUE.test(safeFallback)
      ? safeFallback
      : 'unknown';
}
