import type { ActorContext } from '../../../shared/authorization/types.js';

/**
 * Server-side authorized read model for DOCUMENT_VERSION change targets.
 *
 * The owning controlled-documents truth stays behind this port: callers pass
 * only the operator-selected version id, and every field below (document
 * context, current values, version) is resolved server-side after
 * reauthorization. Client-supplied versions, hashes, snapshots, field paths,
 * and data types are never trusted.
 */
export interface DocumentVersionChangeTarget {
  id: string;
  documentId: string;
  documentNo: string;
  documentType: string;
  title: string;
  revision: string;
  changeSummary?: string;
  contentHash?: string;
  state: string;
  version: bigint;
}

export interface ChangeTargetSource {
  listChangeTargets(input: {
    actor: ActorContext;
  }): Promise<readonly DocumentVersionChangeTarget[]>;
  loadChangeTarget(input: {
    id: string;
    actor: ActorContext;
  }): Promise<DocumentVersionChangeTarget>;
}
