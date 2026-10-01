import { AppError } from '../../../shared/errors/app-error.js';
import { documentContentDigest } from './document-content-digest.js';

export const DOCUMENT_VERSION_STATES = ['CATALOG_ONLY', 'DRAFT', 'IN_REVIEW', 'RETURNED', 'APPROVED', 'EFFECTIVE', 'SUPERSEDED', 'ARCHIVED', 'VOID'] as const;
export type DocumentVersionState = (typeof DOCUMENT_VERSION_STATES)[number];

export interface DocumentVersionFile {
  id: string;
  documentVersionId: string;
  fileId: string;
  fileRole: string;
  originalFilename: string;
  sizeBytes: number;
  sha256: string;
  state: string;
  linkedAt: Date;
  linkedBy: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  revision: string;
  state: DocumentVersionState;
  effectiveAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  supersededAt?: Date;
  archivedAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  changeSummary?: string;
  contentHash?: string;
  sourceBindingVerified?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  version: bigint;
  files: readonly DocumentVersionFile[];
}

export interface NewDocumentVersionInput {
  id: string;
  documentId: string;
  revision: string;
  changeSummary?: string;
  createdBy: string;
  now: Date;
}

const required = (value: string, field: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { [field]: ['required'] } });
  return normalized;
};

export function createDraftDocumentVersion(input: NewDocumentVersionInput): DocumentVersion {
  return {
    id: input.id,
    documentId: input.documentId,
    revision: required(input.revision, 'revision'),
    state: 'DRAFT',
    ...(input.changeSummary?.trim() ? { changeSummary: input.changeSummary.trim() } : {}),
    createdBy: input.createdBy,
    createdAt: input.now,
    updatedAt: input.now,
    version: 1n,
    files: [],
  };
}

export function assertDocumentVersionDraftEditable(version: DocumentVersion): void {
  if (version.state !== 'DRAFT') throw new AppError('AUTHZ_DENIED', { userSafe: true });
}

export function assertApprovalEvidence(version: DocumentVersion): void {
  if (
    version.files.length === 0 ||
    version.sourceBindingVerified !== true ||
    version.files.some((file) => file.state !== 'ACTIVE') ||
    !/^[0-9a-f]{64}$/.test(version.contentHash ?? '')
  ) {
    throw new AppError('AUTHZ_DENIED', { userSafe: true });
  }

  if (
    documentContentDigest({
      documentId: version.documentId,
      revision: version.revision,
      files: version.files,
    }) !== version.contentHash
  ) {
    throw new AppError('AUTHZ_DENIED', { userSafe: true });
  }
}
