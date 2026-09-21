import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Inspection } from '../domain/inspection.js';
import type { InspectionAction } from '../domain/inspection-state.js';
import type { FinalResult, InspectionResultEntry } from '../domain/inspection-result.js';
import type { SignatureEvidence } from '../../../e-signatures/domain/signature-evidence.js';
import type { PointCriteria } from '../application/record-inspection-results.js';
import type { AqlSampling } from '../domain/inspection-aql.js';
export interface InspectionRepository {
  /**
   * QC-DATA-002: approved point criteria of the bound template version for
   * server-side deterministic evaluation (BR-INSP-006).
   */
  listPointCriteria(templateVersionId: string): Promise<PointCriteria[]>;
  /**
   * QC-DATA-002 §8: store the structured AQL/sampling block (draft only).
   */
  saveAql(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    aql: AqlSampling;
    requestId: string;
  }): Promise<void>;
  create(i: {
    inspection: Inspection;
    actor: ActorContext;
    requestId: string;
    /** Set when the report is created from its receiving record (QC-DATA-001). */
    originAudit?: { receivingItemId: string };
  }): Promise<Inspection>;
  get(id: string, actor: ActorContext): Promise<Inspection | undefined>;
  list(i: {
    actor: ActorContext;
    assignedTo?: string;
    state?: Inspection['state'];
    /** Canonical scientific-result filter (PASS | FAIL | HOLD). */
    finalResult?: FinalResult;
    /** Ownership filter: 'mine' restricts to reports the actor authored. */
    ownership?: 'mine';
  }): Promise<readonly Inspection[]>;
  saveDraft(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    results: readonly InspectionResultEntry[];
    finalResult?: FinalResult;
    requestId: string;
  }): Promise<Inspection>;
  transition(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: InspectionAction;
    reason?: string;
    /** Final-approval evidence is committed atomically with the state transition. */
    signatureEvidence?: SignatureEvidence;
    requestId: string;
  }): Promise<Inspection>;
}
