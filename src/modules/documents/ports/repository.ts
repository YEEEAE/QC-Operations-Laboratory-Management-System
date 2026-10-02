import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentIdentity } from '../domain/document.js';
import type { DocumentVersion } from '../domain/document-version.js';
import type { DocumentVersionAction } from '../domain/document-state.js';
import type { ExpectedDocumentPredecessor } from '../domain/revision-creation.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';

export interface DocumentListFilter { search?: string; documentType?: string; state?: string; }

export interface DocumentSourceFileOption {
  id: string;
  originalFilename: string;
  sizeBytes: number;
  uploadedAt: Date;
}

export interface DocumentRepository {
  createDocument(input: { document: DocumentIdentity; actor: ActorContext; requestId: string }): Promise<DocumentIdentity>;
  getDocument(id: string): Promise<DocumentIdentity | undefined>;
  listSourceFiles(documentId: string): Promise<readonly DocumentSourceFileOption[]>;
  listDocuments(input: { actor: ActorContext; filter?: DocumentListFilter }): Promise<readonly DocumentIdentity[]>;
  createVersion(input: { version: DocumentVersion; sourceFiles: readonly { fileId: string; fileRole: string }[]; expectedDocumentVersion: bigint; expectedPredecessor: ExpectedDocumentPredecessor | null; actor: ActorContext; requestId: string }): Promise<DocumentVersion>;
  getVersion(id: string): Promise<DocumentVersion | undefined>;
  /** Returns exact stored creation order: created_at DESC, then id DESC. */
  listVersions(documentId: string): Promise<readonly DocumentVersion[]>;
  updateDraft(input: { id: string; expectedVersion: bigint; expectedContentHash: string; actor: ActorContext; revision: string; changeSummary?: string; now: Date; requestId: string }): Promise<DocumentVersion>;
  recordReview(input: { id: string; expectedVersion: bigint; actor: ActorContext; now: Date; requestId: string }): Promise<DocumentVersion>;
  transition(input: { id: string; expectedVersion: bigint; actor: ActorContext; action: DocumentVersionAction; toState: DocumentVersion['state']; reason?: string; now: Date; requestId: string }, transaction?: DatabaseTransaction): Promise<DocumentVersion>;
  supersede(input: { currentId: string; currentExpectedVersion: bigint; replacementId: string; replacementExpectedVersion: bigint; actor: ActorContext; effectiveAt: Date; requestId: string }): Promise<{ current: DocumentVersion; replacement: DocumentVersion }>;
}

export interface DocumentReviewQueueItem {
  versionId: string;
  documentId: string;
  documentNo: string;
  title: string;
  revision: string;
  state: 'IN_REVIEW';
  authorId: string;
  ownerId: string;
  createdAt: Date;
}

export interface DocumentReviewQueueQuery {
  listForReviewer(input: {
    actorId: string;
    global: boolean;
    own: boolean;
    limit: number;
  }): Promise<{ total: number; items: readonly DocumentReviewQueueItem[] }>;
}
