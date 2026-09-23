/**
 * QC-100-FINAL-004 Task 5 — UAT evidence repository contract.
 *
 * Every mutating method is transactional at the implementation boundary and
 * appends an audited `qc.audit_events` row (actor/subject/action/refs) so the
 * ingestion path itself is controlled history, matching the append-only
 * evidence tables it writes (migration 0023).
 */
import type {
  UatCycleIdentityBinding,
  UatCycleStatus,
  UatDefectInput,
  UatDefectStatus,
  UatSessionInput,
} from '../domain/uat-evidence.js';

export interface UatCycleRecord extends UatCycleIdentityBinding {
  id: string;
  status: UatCycleStatus;
  evidenceSnapshotHash: string;
  executionStartedAt?: Date;
  executionEndedAt?: Date;
  createdAt: Date;
}

export interface UatSessionRecord extends UatSessionInput {
  id: string;
  cycleId: string;
  createdAt: Date;
}

export interface UatDefectRecord extends UatDefectInput {
  id: string;
  cycleId: string;
  createdAt: Date;
}

export interface UatCycleEvidenceSummary {
  sessionCount: number;
  humanSessionCount: number;
  openCriticalDefectCount: number;
}

export interface RecordSessionCommand {
  cycleId: string;
  session: UatSessionInput;
  requestId: string;
  actorId?: string;
}

export interface RecordDefectCommand {
  cycleId: string;
  defect: UatDefectInput;
  requestId: string;
  actorId?: string;
}

export interface UatEvidenceRepository {
  /**
   * Every public method addresses a cycle by its business identifier
   * (`qc.uat_cycles.cycle_id`, e.g. `UAT-2026-09-19-001`). The internal UUID
   * primary key (`qc.uat_cycles.id`) is never an input: mixing the two is how
   * the ingestion path silently failed closed on a bogus UUID lookup.
   */
  findCycleByCycleId(cycleId: string): Promise<UatCycleRecord | undefined>;
  createCycle(input: {
    identity: UatCycleIdentityBinding;
    evidenceSnapshotHash: string;
    status?: UatCycleStatus;
    requestId: string;
    actorId?: string;
  }): Promise<UatCycleRecord>;
  recordSession(command: RecordSessionCommand): Promise<UatSessionRecord>;
  recordDefect(command: RecordDefectCommand): Promise<UatDefectRecord>;
  getEvidenceSummary(cycleId: string): Promise<UatCycleEvidenceSummary>;
  listSessions(cycleId: string): Promise<UatSessionRecord[]>;
  listDefects(cycleId: string, statuses?: readonly UatDefectStatus[]): Promise<UatDefectRecord[]>;
}

/** Narrow command shape the acceptance transaction persists (mirrors the table row). */
export interface UatAcceptanceWrite {
  cycleId: string;
  outcome: 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  authorizedSignerId: string;
  signatureEvidenceId: string;
  reauthenticatedAt: Date;
  evidenceSnapshotHash: string;
  requestId: string;
}

/** Minimal service-account shape used for audited ingestion writes. */
export interface IngestionActor {
  id: string;
  loginIdentity: string;
  accountState: 'ACTIVE' | 'INACTIVE' | 'DISABLED';
  roles: readonly string[];
}
