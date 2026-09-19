/**
 * QC-100-FINAL-004 Task 5 — UAT evidence ingestion domain.
 *
 * Controlled evidence model for the `qc.uat_*` tables (migration 0023) and the
 * single authorized writer for `qc.release_gate_evidence` rows whose
 * `evidence_type='uat'` and `source='SIGNED_UAT_CYCLE'` (migration 0022).
 *
 * Fail-closed invariants (UAT-ACCEPTANCE-PLAN §4.1 and §78):
 * - Every cycle binds the exact release identity (SHA/build/version/migration
 *   head/environment) plus a snapshot hash of that binding.
 * - Sessions and defects must reference an existing cycle in the same
 *   environment; automated runs use `participant_code='FACILITATOR-AUTOMATED'`
 *   and can never flip the cycle to ACCEPTED.
 * - Acceptance requires a real e-signature id bound to the cycle, a
 *   reauthentication timestamp, and at least one recorded session; it writes
 *   the gate-evidence row only inside the acceptance transaction.
 * - A cycle whose only evidence is automated stays BLOCKED for acceptance and
 *   leaves the release gate `uat` UNVERIFIED.
 */
import { createHash } from 'node:crypto';

import { AppError } from '../../../shared/errors/app-error.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';

export const UAT_ENVIRONMENTS = ['test', 'staging'] as const;
export type UatEnvironment = (typeof UAT_ENVIRONMENTS)[number];

export const UAT_CYCLE_STATUSES = [
  'UNVERIFIED',
  'IN_PROGRESS',
  'ACCEPTED',
  'REJECTED',
  'BLOCKED',
] as const;
export type UatCycleStatus = (typeof UAT_CYCLE_STATUSES)[number];

export const UAT_PARTICIPANT_ROLES = [
  'QC Employee',
  'QC Inspector',
  'Laboratory User',
  'Supervisor',
  'Manager',
  'Administrator',
  'Auditor',
  'SYSTEM_OWNER',
  'AUTOMATED_FACILITATOR',
] as const;
export type UatParticipantRole = (typeof UAT_PARTICIPANT_ROLES)[number];

/** Marker for evidence produced by automated harness runs (Task 7). */
export const AUTOMATED_PARTICIPANT_CODE = 'FACILITATOR-AUTOMATED';

export const UAT_ASSISTANCE = ['none', 'clarification', 'coaching'] as const;
export type UatAssistance = (typeof UAT_ASSISTANCE)[number];

export const UAT_SEVERITIES = [
  'BLOCKER',
  'CRITICAL',
  'MAJOR',
  'MINOR',
  'COSMETIC',
  'NONE',
] as const;
export type UatSeverity = (typeof UAT_SEVERITIES)[number];

export const UAT_DEFECT_SEVERITIES = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC'] as const;
export type UatDefectSeverity = (typeof UAT_DEFECT_SEVERITIES)[number];

export const UAT_SCENARIO_STATUSES = [
  'PASS',
  'FAIL',
  'BLOCKED',
  'NOT EXECUTED',
  'NOT APPLICABLE',
] as const;
export type UatScenarioStatus = (typeof UAT_SCENARIO_STATUSES)[number];

export const UAT_TASK_ACCEPT_REJECT = ['ACCEPT', 'REJECT', 'BLOCKED', 'NOT EXECUTED'] as const;
export type UatTaskAcceptReject = (typeof UAT_TASK_ACCEPT_REJECT)[number];

export const UAT_DEFECT_STATUSES = [
  'OPEN',
  'ACCEPTED_RISK',
  'FIXED',
  'RETEST_REQUIRED',
  'CLOSED',
] as const;
export type UatDefectStatus = (typeof UAT_DEFECT_STATUSES)[number];

export const UAT_ACCEPTANCE_OUTCOMES = ['ACCEPTED', 'REJECTED', 'BLOCKED'] as const;
export type UatAcceptanceOutcome = (typeof UAT_ACCEPTANCE_OUTCOMES)[number];

const GIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:+/@-]{0,127}$/;
const CYCLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{2,127}$/;

export interface UatCycleIdentityBinding {
  cycleId: string;
  releaseId: string;
  gitSha: string;
  buildId: string;
  applicationVersion: string;
  migrationHead: string;
  environment: UatEnvironment;
  planReference: string;
}

export function assertUatCycleIdentity(identity: UatCycleIdentityBinding): void {
  if (
    !identity.cycleId?.trim() ||
    !CYCLE_ID_PATTERN.test(identity.cycleId.trim()) ||
    !identity.releaseId?.trim() ||
    !SAFE_ID_PATTERN.test(identity.releaseId.trim())
  ) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!identity.gitSha?.trim() || !GIT_SHA_PATTERN.test(identity.gitSha.trim().toLowerCase())) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (
    !identity.buildId?.trim() ||
    !SAFE_ID_PATTERN.test(identity.buildId.trim()) ||
    !identity.applicationVersion?.trim() ||
    !SAFE_ID_PATTERN.test(identity.applicationVersion.trim())
  ) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!identity.migrationHead?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!UAT_ENVIRONMENTS.includes(identity.environment)) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!identity.planReference?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
}

/**
 * Deterministic snapshot of the release binding stored on every cycle row and
 * recomputed (byte-equality) at acceptance time, so an acceptance can never
 * attach a cycle to a drifted release identity.
 */
export function uatCycleSnapshotHash(identity: UatCycleIdentityBinding): string {
  assertUatCycleIdentity(identity);
  return createHash('sha256')
    .update(
      stableJson({
        cycleId: identity.cycleId,
        releaseId: identity.releaseId,
        gitSha: identity.gitSha.toLowerCase(),
        buildId: identity.buildId,
        applicationVersion: identity.applicationVersion,
        migrationHead: identity.migrationHead,
        environment: identity.environment,
        planReference: identity.planReference,
      }),
    )
    .digest('hex');
}

export interface UatSessionInput {
  sessionId: string;
  taskId: string;
  participantRole: string;
  participantCode: string;
  startedAt: Date;
  endedAt: Date;
  timeOnTaskSeconds: number;
  taskSuccess: boolean;
  errorCount: number;
  backtrackingCount: number;
  failedNavigationCount: number;
  formCorrectionCount: number;
  assistance: UatAssistance;
  wrongActionAttempts: number;
  confidence1To5: number;
  seq1To7: number;
  observations: string;
  severity: UatSeverity;
  participantComments: string;
  scenarioStatus: UatScenarioStatus;
  taskAcceptReject: UatTaskAcceptReject;
  evidenceReference: string;
}

export function assertUatSession(input: UatSessionInput): void {
  const trimmed = (value: string | undefined): string => value?.trim() ?? '';
  if (!trimmed(input.sessionId) || !SAFE_ID_PATTERN.test(trimmed(input.sessionId)))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!trimmed(input.taskId) || !SAFE_ID_PATTERN.test(trimmed(input.taskId)))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (
    !trimmed(input.participantRole) ||
    !(UAT_PARTICIPANT_ROLES as readonly string[]).includes(trimmed(input.participantRole))
  ) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!trimmed(input.participantCode) || trimmed(input.participantCode).length > 127) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (
    !(input.startedAt instanceof Date) ||
    !(input.endedAt instanceof Date) ||
    Number.isNaN(input.startedAt.getTime()) ||
    Number.isNaN(input.endedAt.getTime()) ||
    input.endedAt.getTime() < input.startedAt.getTime()
  ) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  for (const value of [
    input.timeOnTaskSeconds,
    input.errorCount,
    input.backtrackingCount,
    input.failedNavigationCount,
    input.formCorrectionCount,
    input.wrongActionAttempts,
  ]) {
    if (!Number.isInteger(value) || value < 0)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (input.confidence1To5 < 1 || input.confidence1To5 > 5 || input.seq1To7 < 1 || input.seq1To7 > 7)
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!UAT_ASSISTANCE.includes(input.assistance))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!UAT_SEVERITIES.includes(input.severity))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!UAT_SCENARIO_STATUSES.includes(input.scenarioStatus))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!UAT_TASK_ACCEPT_REJECT.includes(input.taskAcceptReject))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!trimmed(input.observations) || !trimmed(input.participantComments)) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  // Controlled kit rule: time_on_task_seconds must equal the window.
  if (
    input.timeOnTaskSeconds !==
    Math.round((input.endedAt.getTime() - input.startedAt.getTime()) / 1000)
  ) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!trimmed(input.evidenceReference) || trimmed(input.evidenceReference).length > 512) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  // Same controlled kit consistency rules as validate-uat-records.mjs.
  if (
    input.scenarioStatus === 'PASS' &&
    (input.taskSuccess !== true || input.taskAcceptReject !== 'ACCEPT')
  ) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (input.scenarioStatus === 'FAIL' && input.taskAcceptReject !== 'REJECT') {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (input.scenarioStatus === 'BLOCKED' && input.taskAcceptReject !== 'BLOCKED') {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
}

export interface UatDefectInput {
  defectId: string;
  sessionId: string;
  taskId: string;
  severity: UatDefectSeverity;
  title: string;
  observedEvidence: string;
  expectedBusinessOutcome: string;
  actualBusinessOutcome: string;
  requestIdOrRef: string;
  status: UatDefectStatus;
}

export function assertUatDefect(input: UatDefectInput): void {
  const required = [
    input.defectId,
    input.sessionId,
    input.taskId,
    input.title,
    input.observedEvidence,
    input.requestIdOrRef,
  ];
  for (const value of required) {
    if (!value?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (
    input.defectId.trim().length > 127 ||
    input.sessionId.trim().length > 127 ||
    input.taskId.trim().length > 127 ||
    input.title.trim().length > 300 ||
    input.requestIdOrRef.trim().length > 200
  ) {
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  }
  if (!UAT_DEFECT_SEVERITIES.includes(input.severity))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!UAT_DEFECT_STATUSES.includes(input.status))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
}

export interface AcceptUatCycleInput {
  outcome: UatAcceptanceOutcome;
  signerId: string;
  signatureEvidenceId: string;
  reauthenticatedAt: Date;
  requestId: string;
}

/**
 * Acceptance preconditions, evaluated on the freshly re-read cycle and its
 * evidence inside the acceptance transaction:
 * - the signer is an ACTIVE user with release authority;
 * - the cycle has at least one recorded session;
 * - no OPEN BLOCKER/CRITICAL defect remains;
 * - a human participant session exists (automated-only cycles cannot accept).
 */
export function evaluateAcceptancePreconditions(input: {
  cycleStatus: UatCycleStatus;
  environment: string;
  cycleSnapshotHash: string;
  expectedSnapshotHash: string;
  sessionCount: number;
  humanSessionCount: number;
  openCriticalDefectCount: number;
}): void {
  if (input.cycleSnapshotHash !== input.expectedSnapshotHash) {
    throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
  }
  if (input.sessionCount === 0) {
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  }
  if (input.humanSessionCount === 0) {
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  }
  if (input.openCriticalDefectCount > 0) {
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  }
  if (input.cycleStatus === 'ACCEPTED' || input.cycleStatus === 'REJECTED') {
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  }
}
