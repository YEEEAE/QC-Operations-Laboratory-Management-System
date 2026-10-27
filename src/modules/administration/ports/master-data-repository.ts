import type { ActorContext } from '../../../shared/authorization/types.js';

export interface MasterDataRevision {
  id: string;
  datasetKey: string;
  contentSha256: string;
  sourceOwner: string;
  sourceReference: string;
  effectiveRevision: string | null;
  sourceApprovalReference: string | null;
  adapterKey: string | null;
  sourceLastUpdated: string | null;
  headerMapping: Record<string, string>;
  records: Record<string, unknown>[];
  preview: Record<string, unknown>;
  approvalState: 'PENDING_SOURCE_APPROVAL' | 'APPROVED' | 'REJECTED';
  importState: 'NOT_IMPORTED' | 'IMPORTED';
  version: number;
}

export interface MasterDataRepository {
  listRevisions(): Promise<readonly MasterDataRevision[]>;
  submitRevision(input: {
    actor: ActorContext;
    datasetKey: string;
    contentSha256: string;
    sourceOwner: string;
    sourceReference: string;
    adapterKey: string | null;
    headerMapping: Record<string, string>;
    records: Record<string, unknown>[];
    preview: Record<string, unknown>;
    requestId: string;
  }): Promise<MasterDataRevision>;
  decideRevision(input: {
    actor: ActorContext;
    revisionId: string;
    expectedVersion: number;
    effectiveRevision: string;
    sourceApprovalReference: string;
    sourceLastUpdated: string;
    reason: string;
    requestId: string;
  }): Promise<MasterDataRevision>;
}
