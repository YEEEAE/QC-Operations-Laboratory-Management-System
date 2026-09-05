import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentIdentity } from '../domain/document.js';
import type { DocumentVersion } from '../domain/document-version.js';
import type { DocumentVersionAction } from '../domain/document-state.js';

export interface DocumentListFilter { search?: string; documentType?: string; state?: string; }

export interface DocumentRepository {
  createDocument(input: { document: DocumentIdentity; actor: ActorContext; requestId: string }): Promise<DocumentIdentity>;
  getDocument(id: string): Promise<DocumentIdentity | undefined>;
  listDocuments(input: { actor: ActorContext; filter?: DocumentListFilter }): Promise<readonly DocumentIdentity[]>;
  createVersion(input: { version: DocumentVersion; actor: ActorContext; requestId: string }): Promise<DocumentVersion>;
  getVersion(id: string): Promise<DocumentVersion | undefined>;
  listVersions(documentId: string): Promise<readonly DocumentVersion[]>;
  updateDraft(input: { id: string; expectedVersion: bigint; actor: ActorContext; revision: string; changeSummary?: string; contentHash?: string; now: Date; requestId: string }): Promise<DocumentVersion>;
  recordReview(input: { id: string; expectedVersion: bigint; actor: ActorContext; now: Date; requestId: string }): Promise<DocumentVersion>;
  transition(input: { id: string; expectedVersion: bigint; actor: ActorContext; action: DocumentVersionAction; toState: DocumentVersion['state']; reason?: string; now: Date; requestId: string }): Promise<DocumentVersion>;
  supersede(input: { currentId: string; currentExpectedVersion: bigint; replacementId: string; replacementExpectedVersion: bigint; actor: ActorContext; effectiveAt: Date; requestId: string }): Promise<{ current: DocumentVersion; replacement: DocumentVersion }>;
}
