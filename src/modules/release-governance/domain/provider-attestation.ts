import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { GateStatus, ReleaseCandidateIdentity, ReleaseGateKey } from './release-approval.js';

export type ProviderGateKey = Extract<ReleaseGateKey, 'ci' | 'security' | 'database' | 'e2e'>;
const PROVIDER_GATE_KEYS: readonly ProviderGateKey[] = ['ci', 'security', 'database', 'e2e'];
const STATUSES: readonly GateStatus[] = ['PASS', 'PARTIAL', 'FAIL', 'UNVERIFIED'];
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^[a-f0-9]{40}$/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:+/@-]{0,127}$/;

export interface ProviderSignerPolicy {
  signerId: string;
  keyId: string;
  secret: string;
  provider: string;
  approvalReference: string;
  gates: ProviderGateKey[];
  environments: string[];
  maxEvidenceAgeSeconds: number;
}

export interface ProviderGateAttestation {
  signerId: string;
  keyId: string;
  nonce: string;
  environment: string;
  identity: ReleaseCandidateIdentity & { releaseVersion: bigint };
  evidenceType: ProviderGateKey;
  status: GateStatus;
  immutableReference: string;
  observedAt: Date;
  evidenceDigest: string;
}

export interface VerifiedProviderAttestation extends ProviderGateAttestation {
  source: 'SIGNED_PROVIDER_ATTESTATION';
  provider: string;
  signerScope: ProviderGateKey[];
  approvalReference: string;
  signatureDigest: string;
}

export class ProviderAttestationError extends Error {
  constructor(
    readonly reason: 'CONFIGURATION' | 'SIGNATURE' | 'SCOPE' | 'IDENTITY' | 'STALE' | 'PAYLOAD',
  ) {
    super(`Provider evidence rejected: ${reason.toLowerCase()}.`);
    this.name = 'ProviderAttestationError';
  }
}

export function parseProviderSignerPolicies(raw: string | undefined): ProviderSignerPolicy[] {
  if (!raw?.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ProviderAttestationError('CONFIGURATION');
  }
  if (!Array.isArray(parsed)) throw new ProviderAttestationError('CONFIGURATION');
  const policies = parsed.map((value): ProviderSignerPolicy => {
    if (!value || typeof value !== 'object') throw new ProviderAttestationError('CONFIGURATION');
    const item = value as Record<string, unknown>;
    const gates = item.gates;
    const environments = item.environments;
    if (
      typeof item.signerId !== 'string' ||
      !SAFE_ID.test(item.signerId) ||
      typeof item.keyId !== 'string' ||
      !SAFE_ID.test(item.keyId) ||
      typeof item.secret !== 'string' ||
      Buffer.byteLength(item.secret) < 32 ||
      typeof item.provider !== 'string' ||
      !SAFE_ID.test(item.provider) ||
      typeof item.approvalReference !== 'string' ||
      item.approvalReference.trim().length < 3 ||
      !Array.isArray(gates) ||
      gates.length === 0 ||
      gates.some((gate) => !PROVIDER_GATE_KEYS.includes(gate as ProviderGateKey)) ||
      !Array.isArray(environments) ||
      environments.length === 0 ||
      environments.some((env) => typeof env !== 'string' || !SAFE_ID.test(env)) ||
      typeof item.maxEvidenceAgeSeconds !== 'number' ||
      !Number.isInteger(item.maxEvidenceAgeSeconds) ||
      item.maxEvidenceAgeSeconds < 1
    )
      throw new ProviderAttestationError('CONFIGURATION');
    return {
      signerId: item.signerId,
      keyId: item.keyId,
      secret: item.secret,
      provider: item.provider,
      approvalReference: item.approvalReference.trim(),
      gates: [...new Set(gates as ProviderGateKey[])],
      environments: [...new Set(environments as string[])],
      maxEvidenceAgeSeconds: item.maxEvidenceAgeSeconds,
    };
  });
  if (new Set(policies.map((policy) => policy.keyId)).size !== policies.length) {
    throw new ProviderAttestationError('CONFIGURATION');
  }
  return policies;
}

export function providerSignature(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}\n${rawBody}`, 'utf8').digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validatePayload(payload: unknown): ProviderGateAttestation {
  if (!isRecord(payload) || !isRecord(payload.identity))
    throw new ProviderAttestationError('PAYLOAD');
  const identity = payload.identity;
  const evidenceType = payload.evidenceType;
  const observedAt =
    typeof payload.observedAt === 'string' ? new Date(payload.observedAt) : new Date(NaN);
  let reference: URL | undefined;
  try {
    reference = new URL(String(payload.immutableReference));
  } catch {
    /* invalid below */
  }
  if (
    typeof payload.signerId !== 'string' ||
    !SAFE_ID.test(payload.signerId) ||
    typeof payload.keyId !== 'string' ||
    !SAFE_ID.test(payload.keyId) ||
    typeof payload.nonce !== 'string' ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(payload.nonce) ||
    typeof payload.environment !== 'string' ||
    !SAFE_ID.test(payload.environment) ||
    typeof identity.releaseId !== 'string' ||
    !identity.releaseId.trim() ||
    typeof identity.gitSha !== 'string' ||
    !GIT_SHA.test(identity.gitSha) ||
    typeof identity.buildId !== 'string' ||
    !SAFE_ID.test(identity.buildId) ||
    typeof identity.applicationVersion !== 'string' ||
    !SAFE_ID.test(identity.applicationVersion) ||
    typeof identity.migrationHead !== 'string' ||
    !identity.migrationHead.trim() ||
    typeof identity.uatCycleId !== 'string' ||
    !identity.uatCycleId.trim() ||
    typeof identity.releaseVersion !== 'string' ||
    !/^[1-9][0-9]*$/.test(identity.releaseVersion) ||
    typeof evidenceType !== 'string' ||
    !PROVIDER_GATE_KEYS.includes(evidenceType as ProviderGateKey) ||
    typeof payload.status !== 'string' ||
    !STATUSES.includes(payload.status as GateStatus) ||
    reference?.protocol !== 'https:' ||
    reference.username.length > 0 ||
    reference.password.length > 0 ||
    !Number.isFinite(observedAt.getTime()) ||
    typeof payload.evidenceDigest !== 'string' ||
    !SHA256.test(payload.evidenceDigest)
  )
    throw new ProviderAttestationError('PAYLOAD');
  return {
    signerId: payload.signerId,
    keyId: payload.keyId,
    nonce: payload.nonce,
    environment: payload.environment,
    identity: {
      releaseId: identity.releaseId,
      gitSha: identity.gitSha.toLowerCase(),
      buildId: identity.buildId,
      applicationVersion: identity.applicationVersion,
      migrationHead: identity.migrationHead,
      uatCycleId: identity.uatCycleId,
      releaseVersion: BigInt(identity.releaseVersion),
    },
    evidenceType: evidenceType as ProviderGateKey,
    status: payload.status as GateStatus,
    immutableReference: reference.toString(),
    observedAt,
    evidenceDigest: payload.evidenceDigest,
  };
}

export function verifyProviderAttestation(input: {
  rawBody: string;
  keyId: string | null;
  timestamp: string | null;
  signature: string | null;
  policies: readonly ProviderSignerPolicy[];
  expectedIdentity?: ReleaseCandidateIdentity & { releaseVersion: bigint };
  now?: Date;
}): VerifiedProviderAttestation {
  const now = input.now ?? new Date();
  if (Buffer.byteLength(input.rawBody, 'utf8') > 32_768)
    throw new ProviderAttestationError('PAYLOAD');
  const policy = input.policies.find((entry) => entry.keyId === input.keyId);
  if (!policy || !input.timestamp || !input.signature || !/^[a-f0-9]{64}$/i.test(input.signature)) {
    throw new ProviderAttestationError('SIGNATURE');
  }
  const timestampMs = Date.parse(input.timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(now.getTime() - timestampMs) > 5 * 60_000) {
    throw new ProviderAttestationError('SIGNATURE');
  }
  const expectedSignature = Buffer.from(
    providerSignature(policy.secret, input.timestamp, input.rawBody),
    'hex',
  );
  const receivedSignature = Buffer.from(input.signature, 'hex');
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    throw new ProviderAttestationError('SIGNATURE');
  }
  let untrusted: unknown;
  try {
    untrusted = JSON.parse(input.rawBody);
  } catch {
    throw new ProviderAttestationError('PAYLOAD');
  }
  const attestation = validatePayload(untrusted);
  if (attestation.signerId !== policy.signerId || attestation.keyId !== policy.keyId) {
    throw new ProviderAttestationError('SIGNATURE');
  }
  if (
    !policy.gates.includes(attestation.evidenceType) ||
    !policy.environments.includes(attestation.environment) ||
    now.getTime() - attestation.observedAt.getTime() > policy.maxEvidenceAgeSeconds * 1000 ||
    attestation.observedAt.getTime() > now.getTime()
  )
    throw new ProviderAttestationError('SCOPE');
  if (
    input.expectedIdentity &&
    (attestation.identity.releaseId !== input.expectedIdentity.releaseId ||
      attestation.identity.gitSha !== input.expectedIdentity.gitSha.toLowerCase() ||
      attestation.identity.buildId !== input.expectedIdentity.buildId ||
      attestation.identity.applicationVersion !== input.expectedIdentity.applicationVersion ||
      attestation.identity.migrationHead !== input.expectedIdentity.migrationHead ||
      attestation.identity.uatCycleId !== input.expectedIdentity.uatCycleId ||
      attestation.identity.releaseVersion !== input.expectedIdentity.releaseVersion)
  )
    throw new ProviderAttestationError('IDENTITY');
  return {
    ...attestation,
    source: 'SIGNED_PROVIDER_ATTESTATION',
    provider: policy.provider,
    signerScope: policy.gates,
    approvalReference: policy.approvalReference,
    signatureDigest: createHash('sha256').update(expectedSignature).digest('hex'),
  };
}
