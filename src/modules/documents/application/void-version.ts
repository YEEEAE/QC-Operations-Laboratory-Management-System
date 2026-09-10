import { AppError } from '../../../shared/errors/app-error.js';
import { isP05Authority } from '../../../shared/authorization/p05-authority.js';
import { authorizeDocument } from './authorization.js';
import { transitionDocumentVersion } from '../domain/document-state.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentRepository } from '../ports/repository.js';

export class VoidVersionUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  async execute(input: {
    actor: ActorContext;
    versionId: string;
    expectedVersion: bigint;
    reason: string;
    requestId: string;
  }) {
    const version = await this.repository.getVersion(input.versionId);
    if (!version) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const document = await this.repository.getDocument(version.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!input.reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!isP05Authority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorizeDocument({
      actor: input.actor,
      permission: 'PERM-DOC-VOID',
      action: 'VOID',
      document,
      state: version.state,
      version,
      expectedVersion: input.expectedVersion,
    });
    const next = transitionDocumentVersion(
      version,
      'VOID',
      this.now(),
      input.reason.trim(),
    );
    return this.repository.transition({
      ...input,
      id: version.id,
      action: 'VOID',
      toState: next.state,
      reason: input.reason.trim(),
      now: next.updatedAt ?? this.now(),
    });
  }
}
