import { AppError } from '../../../shared/errors/app-error.js';

export const DOCUMENT_TYPES = ['WI', 'SOP', 'CONTROLLED_PROCEDURE', 'CONTROLLED_FORM', 'INSTRUCTION'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number] | string;

export interface DocumentIdentity {
  id: string;
  documentNo: string;
  documentType: DocumentType;
  title: string;
  ownerId?: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: bigint;
  currentEffectiveVersionId?: string;
}

export interface NewDocumentIdentityInput {
  id: string;
  documentNo: string;
  documentType: string;
  title: string;
  ownerId?: string;
  createdBy: string;
  now: Date;
}

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { [field]: ['required'] } });
  return normalized;
}

export function createDocumentIdentity(input: NewDocumentIdentityInput): DocumentIdentity {
  return {
    id: input.id,
    documentNo: required(input.documentNo, 'documentNo'),
    documentType: required(input.documentType, 'documentType'),
    title: required(input.title, 'title'),
    ...(input.ownerId ? { ownerId: input.ownerId } : {}),
    active: true,
    createdBy: input.createdBy,
    createdAt: input.now,
    updatedAt: input.now,
    version: 1n,
  };
}
