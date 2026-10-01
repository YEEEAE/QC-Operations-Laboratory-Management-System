import type { ConfiguredReleaseIdentity } from '../../../config/release.js';
import type { ReleaseCandidateIdentity } from '../domain/release-approval.js';

const IDENTITY_FIELDS = [
  'releaseId',
  'buildId',
  'buildTimestamp',
  'environment',
  'gitSha',
  'migrationHead',
] as const;
const MAX_IDENTITY_AGE_MS = 5 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 30 * 1000;

/** Fail closed unless the current production runtime proves this exact candidate identity. */
export function isCurrentRuntimeIdentityForCandidate(
  identity: ConfiguredReleaseIdentity,
  candidate: ReleaseCandidateIdentity,
  now = new Date(),
): boolean {
  const checkedAt = identity.checkedAt ? Date.parse(identity.checkedAt) : Number.NaN;
  const age = now.getTime() - checkedAt;
  const verifiedNames = new Set(
    identity.fields?.filter((field) => field.status === 'VERIFIED').map((field) => field.name),
  );
  const allFieldsVerified =
    identity.fields?.length === IDENTITY_FIELDS.length &&
    IDENTITY_FIELDS.every((field) => verifiedNames.has(field));

  return Boolean(
    identity.status === 'VERIFIED' &&
    identity.verifiedFields === IDENTITY_FIELDS.length &&
    identity.fieldCount === IDENTITY_FIELDS.length &&
    allFieldsVerified &&
    identity.environment === 'production' &&
    identity.dirty === false &&
    Number.isFinite(checkedAt) &&
    age <= MAX_IDENTITY_AGE_MS &&
    age >= -MAX_FUTURE_SKEW_MS &&
    Number.isFinite(Date.parse(identity.buildTimestamp ?? '')) &&
    identity.gitSha?.toLowerCase() === candidate.gitSha.toLowerCase() &&
    identity.buildId === candidate.buildId &&
    identity.serviceVersion === candidate.applicationVersion &&
    identity.migrationHead === candidate.migrationHead,
  );
}
