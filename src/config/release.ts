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
  verifiedFields?: number;
  readonly fieldCount?: 6;
  checkedAt?: string;
  fields?: readonly ReleaseIdentityField[];
  reason?: 'ARTIFACT_MISSING' | 'ARTIFACT_INVALID' | 'ARTIFACT_MISMATCH' | 'RUNTIME_MISMATCH';
  dirty?: boolean;
  releaseId?: string;
  buildId?: string;
  buildTimestamp?: string;
  environment?: ReleaseEnvironment;
  gitSha?: string;
  migrationHead?: string;
  serviceVersion?: string;
}

export interface ReleaseIdentityField {
  name: 'releaseId' | 'buildId' | 'buildTimestamp' | 'environment' | 'gitSha' | 'migrationHead';
  status: 'VERIFIED' | 'MISSING' | 'INVALID' | 'MISMATCH';
  source: string;
  value?: string;
}

const IDENTITY_FIELD_NAMES = [
  'releaseId',
  'buildId',
  'buildTimestamp',
  'environment',
  'gitSha',
  'migrationHead',
] as const;
function identityFieldSources(
  isRenderRuntime: boolean,
): Record<(typeof IDENTITY_FIELD_NAMES)[number], string> {
  const buildIdentitySource = isRenderRuntime
    ? 'Render RENDER_GIT_COMMIT platform metadata'
    : 'Build command --build-id or platform CI run identity';
  const gitSource = isRenderRuntime
    ? 'Git HEAD cross-checked against Render RENDER_GIT_COMMIT'
    : 'Git HEAD read by release:identity';
  const environmentSource = isRenderRuntime
    ? 'Render platform metadata (RENDER=true maps to production)'
    : 'Build platform metadata or explicit release:identity argument';
  return {
    releaseId: 'Derived from the candidate identity and server artifact SHA-256',
    buildId: buildIdentitySource,
    buildTimestamp: 'Build process timestamp captured by release:identity',
    environment: environmentSource,
    gitSha: gitSource,
    migrationHead: 'Highest ordered db/migrations source file',
  };
}

export type ReleaseIdentityArtifact = ReleaseIdentity & {
  readonly applicationVersion: string;
  readonly migrationHeadChecksum: string;
  readonly artifactSha256: string;
  readonly workingTree: 'clean' | 'dirty';
};

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
  artifact?: unknown,
  runtimeArtifactSha256?: string,
  checkedAt = new Date().toISOString(),
): ConfiguredReleaseIdentity {
  const serviceVersion = environment.SERVICE_VERSION?.trim() || undefined;
  const names = IDENTITY_FIELD_NAMES;
  const fieldSources = identityFieldSources(environment.RENDER === 'true');
  if (artifact === undefined || artifact === null) {
    return {
      status: 'UNVERIFIED',
      verifiedFields: 0,
      fieldCount: 6,
      checkedAt,
      reason: 'ARTIFACT_MISSING',
      fields: names.map((name) => ({
        name,
        status: 'MISSING',
        source: fieldSources[name],
      })),
    };
  }

  const data = artifact as Partial<ReleaseIdentityArtifact>;
  const candidateFields: Record<(typeof names)[number], unknown> = {
    releaseId: data.releaseId,
    buildId: data.buildId,
    buildTimestamp: data.buildTimestamp,
    environment: data.environment,
    gitSha: data.gitSha,
    migrationHead: data.migrationHead,
  };
  let reason: ConfiguredReleaseIdentity['reason'];
  let reconstructed: ReleaseIdentity | undefined;
  try {
    if (
      data.schemaVersion !== RELEASE_SCHEMA_VERSION ||
      data.serviceName !== SERVICE_NAME ||
      (data.environment === 'production' &&
        (data.workingTree !== 'clean' || data.dirty !== false)) ||
      !data.migrationHeadChecksum ||
      !data.artifactSha256 ||
      !data.applicationVersion ||
      !data.serviceVersion ||
      typeof data.workingTree !== 'string' ||
      !data.buildTimestamp
    ) {
      throw new Error('invalid-artifact');
    }
    reconstructed = createReleaseIdentity({
      applicationVersion: data.applicationVersion,
      serviceVersion: data.serviceVersion,
      buildId: data.buildId ?? '',
      buildTimestamp: data.buildTimestamp,
      environment: data.environment as ReleaseEnvironment,
      gitSha: data.gitSha ?? '',
      migrationHead: data.migrationHead ?? '',
      migrationHeadChecksum: data.migrationHeadChecksum,
      workingTree: data.workingTree,
      artifactSha256: data.artifactSha256,
    });
    if (
      data.releaseId !== reconstructed.releaseId ||
      !SHA256.test(data.artifactSha256) ||
      !SHA256.test(runtimeArtifactSha256 ?? '')
    ) {
      reason = 'ARTIFACT_INVALID';
    } else if (runtimeArtifactSha256?.toLowerCase() !== data.artifactSha256.toLowerCase()) {
      reason = 'ARTIFACT_MISMATCH';
    } else if (
      (environment.NODE_ENV === 'production' && data.environment !== 'production') ||
      (environment.RENDER === 'true' &&
        (!GIT_SHA.test(environment.RENDER_GIT_COMMIT ?? '') ||
          environment.RENDER_GIT_COMMIT?.toLowerCase() !== data.gitSha?.toLowerCase())) ||
      (serviceVersion && serviceVersion !== data.serviceVersion)
    ) {
      reason = 'RUNTIME_MISMATCH';
    }
  } catch {
    reason = 'ARTIFACT_INVALID';
  }

  const validMetadata = Boolean(reconstructed && !reason);
  const fields: ReleaseIdentityField[] = names.map((name) => {
    const value = candidateFields[name];
    const present = typeof value === 'string' && value.trim().length > 0;
    const valid =
      (name === 'releaseId' && typeof value === 'string' && RELEASE_ID.test(value)) ||
      (name === 'buildId' && typeof value === 'string' && SAFE_VALUE.test(value)) ||
      (name === 'buildTimestamp' &&
        typeof value === 'string' &&
        Number.isFinite(Date.parse(value))) ||
      (name === 'environment' &&
        typeof value === 'string' &&
        RELEASE_ENVIRONMENTS.includes(value as ReleaseEnvironment)) ||
      (name === 'gitSha' && typeof value === 'string' && GIT_SHA.test(value)) ||
      (name === 'migrationHead' && typeof value === 'string' && MIGRATION_HEAD.test(value));
    return {
      name,
      status: !present ? 'MISSING' : !valid ? 'INVALID' : validMetadata ? 'VERIFIED' : 'MISMATCH',
      source: fieldSources[name],
      ...(valid ? { value: value as string } : {}),
    };
  });
  const verifiedFields = fields.filter((field) => field.status === 'VERIFIED').length;
  return {
    status: verifiedFields === 6 ? 'VERIFIED' : 'UNVERIFIED',
    verifiedFields,
    fieldCount: 6,
    checkedAt,
    fields,
    ...(reason ? { reason } : {}),
    ...(typeof data.releaseId === 'string' && RELEASE_ID.test(data.releaseId)
      ? { releaseId: data.releaseId }
      : {}),
    ...(typeof data.buildId === 'string' && SAFE_VALUE.test(data.buildId)
      ? { buildId: data.buildId }
      : {}),
    ...(typeof data.buildTimestamp === 'string' && Number.isFinite(Date.parse(data.buildTimestamp))
      ? { buildTimestamp: data.buildTimestamp }
      : {}),
    ...(typeof data.environment === 'string' &&
    RELEASE_ENVIRONMENTS.includes(data.environment as ReleaseEnvironment)
      ? { environment: data.environment as ReleaseEnvironment }
      : {}),
    ...(typeof data.gitSha === 'string' && GIT_SHA.test(data.gitSha)
      ? { gitSha: data.gitSha.toLowerCase() }
      : {}),
    ...(typeof data.migrationHead === 'string' && MIGRATION_HEAD.test(data.migrationHead)
      ? { migrationHead: data.migrationHead }
      : {}),
    ...(serviceVersion && SAFE_VALUE.test(serviceVersion) ? { serviceVersion } : {}),
    ...(validMetadata && typeof data.dirty === 'boolean' ? { dirty: data.dirty } : {}),
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
