import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';

export const RELEASE_GATE_KEYS = [
  'ci',
  'security',
  'database',
  'e2e',
  'uat',
  'signatures',
  'criticalRisks',
  'residualRisk',
] as const;
export type ReleaseGateKey = (typeof RELEASE_GATE_KEYS)[number];

export type GateStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'UNVERIFIED' | 'NOT_APPLICABLE';

export type ReleaseGateEvidence = Record<ReleaseGateKey, GateStatus>;

export interface ReleaseGateEvidenceRecord extends ReleaseCandidateIdentity {
  evidenceType: ReleaseGateKey;
  status: GateStatus;
  source: string;
  immutableReference: string;
  observedAt: Date;
  releaseVersion: bigint;
  evidenceVersion: bigint;
  recordedBy: string;
  auditInfo: unknown;
}

export type ResidualSeverity = 'LOW' | 'MEDIUM' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';

export interface ResidualRiskAcceptance {
  acceptedBy: string;
  authority: 'MANAGER' | 'SYSTEM_OWNER';
  evidenceRef: string;
  acceptedAt: string;
}

export interface ResidualRiskEntry {
  riskId: string;
  severity: ResidualSeverity;
  status: 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED' | 'BLOCKED';
  acceptance?: ResidualRiskAcceptance;
}

export interface ReleaseRiskEvidenceRecord extends ReleaseCandidateIdentity {
  riskId: string;
  severity: ResidualSeverity;
  status: ResidualRiskEntry['status'];
  source: string;
  immutableReference: string;
  observedAt: Date;
  releaseVersion: bigint;
  evidenceVersion: bigint;
  recordedBy: string;
  acceptance?: ResidualRiskAcceptance;
  auditInfo: unknown;
}

export interface ReleaseEvidenceSnapshot {
  gates: ReleaseGateEvidence;
  gateRecords: Partial<Record<ReleaseGateKey, ReleaseGateEvidenceRecord>>;
  risks: ResidualRiskEntry[];
  riskRecords: ReleaseRiskEvidenceRecord[];
}

export interface ReleaseCandidateForEvidence extends ReleaseCandidateIdentity {
  uatStatus: string;
  residualRiskStatus: string;
  state: 'PENDING' | 'RELEASE_APPROVED';
  version: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReleaseCandidateIdentity {
  releaseId: string;
  gitSha: string;
  buildId: string;
  applicationVersion: string;
  migrationHead: string;
  uatCycleId: string;
}

export const RELEASE_APPROVED_STATE = 'RELEASE_APPROVED' as const;
export const RELEASE_PENDING_STATE = 'PENDING' as const;

const GIT_SHA = /^[0-9a-f]{40}$/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:+/@-]{0,127}$/;

export function assertReleaseIdentityShape(identity: ReleaseCandidateIdentity): void {
  if (!identity.releaseId?.trim() || !identity.gitSha?.trim() || !identity.buildId?.trim()) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!GIT_SHA.test(identity.gitSha.trim()))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!SAFE_ID.test(identity.buildId.trim()))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!identity.applicationVersion?.trim() || !SAFE_ID.test(identity.applicationVersion.trim())) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!identity.migrationHead?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!identity.uatCycleId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
}

/** Final release authority: Manager OR the named system owner. One signer is sufficient. Admin alone is denied. */
export function isReleaseAuthority(actor: ActorContext): boolean {
  if (actor.accountState !== 'ACTIVE') return false;
  if (actor.roles.includes('MANAGER')) return true;
  return isNamedSystemOwner(actor);
}

export function releaseAuthorityKind(actor: ActorContext): 'MANAGER' | 'SYSTEM_OWNER' | null {
  if (actor.accountState !== 'ACTIVE') return null;
  if (actor.roles.includes('MANAGER')) return 'MANAGER';
  if (isNamedSystemOwner(actor)) return 'SYSTEM_OWNER';
  return null;
}

export function assertReleaseAuthority(actor: ActorContext): 'MANAGER' | 'SYSTEM_OWNER' {
  const kind = releaseAuthorityKind(actor);
  if (!kind) throw new AppError('AUTHZ_DENIED', { userSafe: true });
  return kind;
}

export function evaluateGates(gates: ReleaseGateEvidence): {
  ok: boolean;
  failures: ReleaseGateKey[];
} {
  const failures = RELEASE_GATE_KEYS.filter((key) => gates[key] !== 'PASS');
  return { ok: failures.length === 0, failures };
}

export function assertAllGatesPass(gates: ReleaseGateEvidence): void {
  if (!evaluateGates(gates).ok) throw new AppError('AUTHZ_DENIED', { userSafe: true });
}

const TRUSTED_GATE_SOURCES: Record<ReleaseGateKey, readonly string[]> = {
  ci: ['TRUSTED_CI', 'IMPORTED_CI'],
  security: ['TRUSTED_SECURITY_SUITE', 'IMPORTED_SECURITY'],
  database: ['TRUSTED_DATABASE_PREFLIGHT', 'IMPORTED_DATABASE'],
  e2e: ['TRUSTED_PLAYWRIGHT', 'IMPORTED_E2E'],
  uat: ['SIGNED_UAT_CYCLE'],
  signatures: ['E_SIGNATURE_STORE'],
  criticalRisks: ['CONTROLLED_RISK_REGISTER'],
  residualRisk: ['CONTROLLED_RISK_REGISTER'],
};

function isCurrentEvidence(
  record: ReleaseGateEvidenceRecord,
  candidate: ReleaseCandidateForEvidence,
  now: Date,
): boolean {
  return (
    record.releaseId === candidate.releaseId &&
    record.gitSha.toLowerCase() === candidate.gitSha.toLowerCase() &&
    record.buildId === candidate.buildId &&
    record.applicationVersion === candidate.applicationVersion &&
    record.migrationHead === candidate.migrationHead &&
    record.uatCycleId === candidate.uatCycleId &&
    record.releaseVersion === candidate.version &&
    record.evidenceVersion > 0n &&
    record.immutableReference.trim().length > 0 &&
    record.observedAt.getTime() <= now.getTime() &&
    TRUSTED_GATE_SOURCES[record.evidenceType].includes(record.source)
  );
}

export function deriveReleaseEvidence(
  candidate: ReleaseCandidateForEvidence,
  gateRecords: readonly ReleaseGateEvidenceRecord[],
  riskRecords: readonly ReleaseRiskEvidenceRecord[],
  now: Date,
): ReleaseEvidenceSnapshot {
  const current = gateRecords.filter((record) => isCurrentEvidence(record, candidate, now));
  const latest = new Map<ReleaseGateKey, ReleaseGateEvidenceRecord>();
  for (const record of current) {
    const previous = latest.get(record.evidenceType);
    if (!previous || record.evidenceVersion > previous.evidenceVersion)
      latest.set(record.evidenceType, record);
  }
  const gates = Object.fromEntries(
    RELEASE_GATE_KEYS.map((key) => [key, latest.get(key)?.status ?? 'UNVERIFIED']),
  ) as ReleaseGateEvidence;
  const currentRisks = riskRecords
    .filter(
      (risk) =>
        risk.releaseId === candidate.releaseId &&
        risk.gitSha.toLowerCase() === candidate.gitSha.toLowerCase() &&
        risk.buildId === candidate.buildId &&
        risk.applicationVersion === candidate.applicationVersion &&
        risk.migrationHead === candidate.migrationHead &&
        risk.uatCycleId === candidate.uatCycleId &&
        risk.releaseVersion === candidate.version &&
        risk.evidenceVersion > 0n &&
        risk.immutableReference.trim().length > 0 &&
        risk.observedAt.getTime() <= now.getTime() &&
        risk.source === 'CONTROLLED_RISK_REGISTER',
    )
    .sort(
      (a, b) => a.riskId.localeCompare(b.riskId) || Number(b.evidenceVersion - a.evidenceVersion),
    );
  const risks = [...new Map(currentRisks.map((risk) => [risk.riskId, risk])).values()].map(
    (risk) => ({
      riskId: risk.riskId,
      severity: risk.severity,
      status: risk.status,
      ...(risk.acceptance ? { acceptance: risk.acceptance } : {}),
    }),
  );
  return { gates, gateRecords: Object.fromEntries(latest), risks, riskRecords: currentRisks };
}

function isAcceptanceAuthority(entry: ResidualRiskEntry): boolean {
  const authority = entry.acceptance?.authority;
  if (authority !== 'MANAGER' && authority !== 'SYSTEM_OWNER') return false;
  if (!entry.acceptance?.acceptedBy?.trim()) return false;
  if (!entry.acceptance?.evidenceRef?.trim()) return false;
  if (!entry.acceptance?.acceptedAt?.trim()) return false;
  return true;
}

/**
 * Fail-closed residual-risk rule for a normal release:
 * - CRITICAL or VERY_HIGH severity blocks unconditionally.
 * - LOW / MEDIUM / MODERATE / HIGH must carry an explicit acceptance by
 *   Manager or SYSTEM_OWNER with evidence; otherwise blocked.
 * - CLOSED entries with no residual exposure do not require acceptance.
 */
export function evaluateResidualRisks(risks: readonly ResidualRiskEntry[]): {
  ok: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];
  for (const risk of risks) {
    if (!risk.riskId?.trim()) {
      blockers.push('unknown-risk');
      continue;
    }
    if (risk.severity === 'CRITICAL' || risk.severity === 'VERY_HIGH') {
      blockers.push(risk.riskId);
      continue;
    }
    if (risk.status === 'CLOSED') continue;
    if (risk.status === 'ACCEPTED' && isAcceptanceAuthority(risk)) continue;
    if (
      (risk.severity === 'LOW' ||
        risk.severity === 'MEDIUM' ||
        risk.severity === 'MODERATE' ||
        risk.severity === 'HIGH') &&
      isAcceptanceAuthority(risk)
    ) {
      continue;
    }
    blockers.push(risk.riskId);
  }
  return { ok: blockers.length === 0, blockers };
}

export function assertResidualRisksAcceptable(risks: readonly ResidualRiskEntry[]): void {
  if (!evaluateResidualRisks(risks).ok) throw new AppError('AUTHZ_DENIED', { userSafe: true });
}

export interface ReleaseApprovalCapability {
  canApprove: boolean;
  disabledReasons: string[];
}

/** Server-derived capability: the approval action is enabled only when every gate is PASS. */
export function getReleaseApprovalCapability(input: {
  actor: ActorContext;
  gates: ReleaseGateEvidence;
  risks: readonly ResidualRiskEntry[];
}): ReleaseApprovalCapability {
  const disabledReasons: string[] = [];
  if (!isReleaseAuthority(input.actor)) disabledReasons.push('AUTHORITY');
  const gates = evaluateGates(input.gates);
  for (const failure of gates.failures) disabledReasons.push(`GATE:${failure}`);
  const risks = evaluateResidualRisks(input.risks);
  for (const blocker of risks.blockers) disabledReasons.push(`RISK:${blocker}`);
  return { canApprove: disabledReasons.length === 0, disabledReasons };
}
