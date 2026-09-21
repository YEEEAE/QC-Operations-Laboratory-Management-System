import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Inspection } from '../domain/inspection.js';
import type { InspectionAction } from '../domain/inspection-state.js';
import type { FinalResult, InspectionResultEntry } from '../domain/inspection-result.js';
import type { SignatureEvidence } from '../../../e-signatures/domain/signature-evidence.js';
export interface InspectionRepository {
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
