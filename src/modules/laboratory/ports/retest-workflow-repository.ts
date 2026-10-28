import type { ActorContext } from '../../../shared/authorization/types.js';
import type { LabTest } from '../domain/lab-test.js';

export type RetestRequestState = 'REQUESTED' | 'INVESTIGATING' | 'APPROVED' | 'REJECTED';
export interface RetestRequest {
  id: string;
  originalTestId: string;
  originalTestVersion: bigint;
  originalScientificResult: LabTest['scientificResult'];
  requesterId: string;
  reason: string;
  investigation: string | null;
  status: RetestRequestState;
  decisionActorId: string | null;
  decisionAt: Date | null;
  decisionReason: string | null;
  sourceMethodReference: string;
  sourceTemplateVersionId: string;
  sourceContentHash: string;
  version: bigint;
}
export interface RetestWorkflowRepository {
  createRequest(input: {
    id: string;
    original: LabTest;
    actor: ActorContext;
    reason: string;
    investigation: string;
    requestKey: string;
    at: Date;
  }): Promise<RetestRequest>;
  getRequest(id: string): Promise<RetestRequest | undefined>;
  recordInvestigation(input: {
    request: RetestRequest;
    actor: ActorContext;
    expectedVersion: bigint;
    investigation: string;
    requestKey: string;
    at: Date;
  }): Promise<RetestRequest>;
  decide(input: {
    request: RetestRequest;
    actor: ActorContext;
    expectedVersion: bigint;
    decision: 'APPROVED' | 'REJECTED';
    reason: string;
    requestKey: string;
    at: Date;
  }): Promise<RetestRequest>;
}
