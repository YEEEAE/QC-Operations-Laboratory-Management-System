/**
 * QC-100-FINAL-004 Task 5 — UAT evidence ingestion use cases.
 *
 * - `CreateUatCycleUseCase`: binds the exact release identity + snapshot hash.
 * - `RecordUatSessionUseCase` / `RecordUatDefectUseCase`: append-only evidence
 *   against an existing cycle; automated rows carry
 *   `participant_code='FACILITATOR-AUTOMATED'` and never transition the cycle.
 * - `AcceptUatCycleUseCase`: release-authority signer + reauthentication +
 *   e-signature ceremony; the gate-evidence row (`SIGNED_UAT_CYCLE`) commits
 *   inside the same transaction as the acceptance.
 * - `GetUatCycleEvidenceUseCase`: retrieval read model for operator/audit use.
 */
import { createHash } from 'node:crypto';

import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { ReauthenticationVerifier } from '../../e-signatures/ports/repository.js';
import type {
  UatCycleIdentityBinding,
  UatDefectInput,
  UatSessionInput,
} from '../domain/uat-evidence.js';
import {
  assertUatCycleIdentity,
  assertUatDefect,
  assertUatSession,
  evaluateAcceptancePreconditions,
  uatCycleSnapshotHash,
} from '../domain/uat-evidence.js';
import type {
  IngestionActor,
  UatCycleRecord,
  UatCycleEvidenceSummary,
  UatDefectRecord,
  UatEvidenceRepository,
  UatSessionRecord,
} from '../ports/repository.js';

/**
 * Release authority for UAT acceptance mirrors `isReleaseAuthority`: Manager
 * or the named system owner; Admin alone is denied.
 */
export function assertUatAcceptanceAuthority(actor: ActorContext): void {
  const isAuthority =
    actor.accountState === 'ACTIVE' &&
    (actor.roles.includes('MANAGER') || isNamedSystemOwner(actor));
  if (!isAuthority) throw new AppError('AUTHZ_DENIED', { userSafe: true });
}

export class CreateUatCycleUseCase {
  constructor(private readonly repository: UatEvidenceRepository) {}

  async execute(input: {
    identity: UatCycleIdentityBinding;
    requestId: string;
    status?: 'UNVERIFIED' | 'IN_PROGRESS';
  }): Promise<UatCycleRecord> {
    if (!input.requestId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    assertUatCycleIdentity(input.identity);
    const existing = await this.repository.findCycleByCycleId(input.identity.cycleId.trim());
    if (existing) throw new AppError('RESOURCE_ALREADY_EXISTS', { userSafe: true });
    const snapshotHash = uatCycleSnapshotHash(input.identity);
    return this.repository.createCycle({
      identity: input.identity,
      evidenceSnapshotHash: snapshotHash,
      status: input.status ?? 'UNVERIFIED',
      requestId: input.requestId.trim(),
    });
  }
}

export class RecordUatSessionUseCase {
  constructor(private readonly repository: UatEvidenceRepository) {}

  async execute(input: {
    cycleId: string;
    session: UatSessionInput;
    requestId: string;
    actor?: IngestionActor;
  }): Promise<UatSessionRecord> {
    if (!input.requestId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    assertUatSession(input.session);
    return this.repository.recordSession({
      cycleId: input.cycleId,
      session: input.session,
      requestId: input.requestId.trim(),
      ...(input.actor ? { actorId: input.actor.id } : {}),
    });
  }
}

export class RecordUatDefectUseCase {
  constructor(private readonly repository: UatEvidenceRepository) {}

  async execute(input: {
    cycleId: string;
    defect: UatDefectInput;
    requestId: string;
    actor?: IngestionActor;
  }): Promise<UatDefectRecord> {
    if (!input.requestId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    assertUatDefect(input.defect);
    return this.repository.recordDefect({
      cycleId: input.cycleId,
      defect: input.defect,
      requestId: input.requestId.trim(),
      ...(input.actor ? { actorId: input.actor.id } : {}),
    });
  }
}

export interface UatAcceptanceSignatureService {
  create(input: {
    actorId: string;
    subjectType: 'UAT_CYCLE';
    subjectId: string;
    subjectVersion: bigint;
    action: string;
    meaning: string;
    snapshotHash: string;
    reauthMethod: 'PASSWORD';
    requestId: string;
  }): { id: string };
}

export class AcceptUatCycleUseCase {
  constructor(
    private readonly repository: UatEvidenceRepository,
    private readonly executeAcceptance: (input: {
      cycleId: string;
      acceptance: {
        cycleId: string;
        outcome: 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
        authorizedSignerId: string;
        signatureEvidenceId: string;
        reauthenticatedAt: Date;
        evidenceSnapshotHash: string;
        requestId: string;
      };
      gateEvidence: {
        releaseId: string;
        cycleReference: string;
        status: 'PASS' | 'FAIL' | 'PARTIAL' | 'UNVERIFIED';
        immutableReference: string;
        observedAt: Date;
        gitSha: string;
        buildId: string;
        applicationVersion: string;
        migrationHead: string;
        releaseVersion: bigint;
        evidenceVersion: bigint;
        recordedBy: string;
        auditInfo: unknown;
      };
      signer: IngestionActor;
    }) => Promise<{ acceptanceId: string; outcome: string }>,
    private readonly verifier: ReauthenticationVerifier,
    private readonly signatureService: UatAcceptanceSignatureService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    signer: IngestionActor;
    cycleId: string;
    outcome: 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
    /** Exact release row the gate evidence binds to (release_candidates.id). */
    releaseRowId: string;
    releaseVersion: bigint;
    evidenceVersion: bigint;
    reauthenticationSecret: string;
    requestId: string;
  }): Promise<{ acceptanceId: string; outcome: string; signatureId: string }> {
    if (!input.requestId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!input.reauthenticationSecret?.trim()) {
      throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    }
    assertUatAcceptanceAuthority(input.actor);

    const cycle = await this.repository.findCycleByCycleId(input.cycleId);
    if (!cycle) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });

    // Authorize the signer against the cycle entity (fail-closed policy check).
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-APR-APPROVE',
        action: 'APPROVE',
        entity: { type: 'UAT_CYCLE', id: cycle.id, state: cycle.status },
        scope: {},
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );

    const valid = await this.verifier.verify({
      actorId: input.actor.id,
      secret: input.reauthenticationSecret,
      requestId: input.requestId.trim(),
    });
    if (!valid) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });

    const [summary, sessions] = await Promise.all([
      this.repository.getEvidenceSummary(cycle.cycleId),
      this.repository.listSessions(cycle.cycleId),
    ]);
    evaluateAcceptancePreconditions({
      cycleStatus: cycle.status,
      environment: cycle.environment,
      cycleSnapshotHash: cycle.evidenceSnapshotHash,
      expectedSnapshotHash: uatCycleSnapshotHash(cycle),
      sessionCount: summary.sessionCount,
      humanSessionCount: summary.humanSessionCount,
      openCriticalDefectCount: summary.openCriticalDefectCount,
    });

    // The signed snapshot binds the cycle + full release identity at acceptance time.
    const evidenceSnapshotHash = createHash('sha256')
      .update(
        stableJson({
          cycleId: cycle.cycleId,
          releaseId: cycle.releaseId,
          gitSha: cycle.gitSha,
          buildId: cycle.buildId,
          applicationVersion: cycle.applicationVersion,
          migrationHead: cycle.migrationHead,
          environment: cycle.environment,
          sessionIds: sessions.map((session) => session.id).sort(),
          sessionHashes: sessions
            .map((session) => session.evidenceReference.trim())
            .sort(),
        }),
      )
      .digest('hex');

    const signature = this.signatureService.create({
      actorId: input.actor.id,
      subjectType: 'UAT_CYCLE',
      subjectId: cycle.id,
      subjectVersion: 1n,
      action: 'UAT_ACCEPT',
      meaning: `Accept UAT cycle ${cycle.cycleId} for release ${cycle.releaseId} at ${cycle.gitSha}`,
      snapshotHash: evidenceSnapshotHash,
      reauthMethod: 'PASSWORD',
      requestId: input.requestId.trim(),
    });

    const result = await this.executeAcceptance({
      cycleId: cycle.cycleId,
      acceptance: {
        cycleId: cycle.cycleId,
        outcome: input.outcome,
        authorizedSignerId: input.actor.id,
        signatureEvidenceId: signature.id,
        reauthenticatedAt: this.now(),
        evidenceSnapshotHash: cycle.evidenceSnapshotHash,
        requestId: input.requestId.trim(),
      },
      gateEvidence: {
        releaseId: input.releaseRowId,
        cycleReference: cycle.cycleId,
        status: input.outcome === 'ACCEPTED' ? 'PASS' : 'UNVERIFIED',
        immutableReference: `uat-cycle:${cycle.cycleId}:${signature.id}`,
        observedAt: this.now(),
        gitSha: cycle.gitSha,
        buildId: cycle.buildId,
        applicationVersion: cycle.applicationVersion,
        migrationHead: cycle.migrationHead,
        releaseVersion: input.releaseVersion,
        evidenceVersion: input.evidenceVersion,
        recordedBy: input.actor.id,
        auditInfo: { outcome: input.outcome, cycleId: cycle.cycleId },
      },
      signer: input.signer,
    });
    return { ...result, signatureId: signature.id };
  }
}

export class GetUatCycleEvidenceUseCase {
  constructor(private readonly repository: UatEvidenceRepository) {}

  /** Retrieval read model; only cycles the actor is authorized to inspect. */
  async execute(input: {
    actor: ActorContext;
    cycleId: string;
  }): Promise<{
    cycle: UatCycleRecord;
    summary: UatCycleEvidenceSummary;
    sessions: UatSessionRecord[];
    defects: UatDefectRecord[];
    releaseGateStatus: 'PASS' | 'UNVERIFIED';
  }> {
    const cycle = await this.repository.findCycleByCycleId(input.cycleId.trim());
    if (!cycle) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-RPT-VIEW',
        action: 'VIEW',
        entity: { type: 'UAT_CYCLE', id: cycle.id, state: cycle.status },
        scope: {},
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const [summary, sessions, defects] = await Promise.all([
      this.repository.getEvidenceSummary(cycle.cycleId),
      this.repository.listSessions(cycle.cycleId),
      this.repository.listDefects(cycle.cycleId),
    ]);
    return {
      cycle,
      summary,
      sessions,
      defects,
      releaseGateStatus: cycle.status === 'ACCEPTED' ? 'PASS' : 'UNVERIFIED',
    };
  }
}
