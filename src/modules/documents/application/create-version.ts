import { AppError } from '../../../shared/errors/app-error.js';
import { authorizeDocument } from './authorization.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { createDraftDocumentVersion } from '../domain/document-version.js';
import type { DocumentRepository } from '../ports/repository.js';
import { decideRevisionCreation, expectedPredecessorOf } from '../domain/revision-creation.js';

export class CreateVersionUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  async execute(input: { actor: ActorContext; documentId: string; revision: string; changeSummary?: string; fileIds: readonly string[]; expectedDocumentVersion: bigint; expectedPredecessor: ReturnType<typeof expectedPredecessorOf>; requestId: string }) {
    const document = await this.repository.getDocument(input.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const versions = await this.repository.listVersions(document.id);
    const currentPredecessor = expectedPredecessorOf(versions);
    if (document.version !== input.expectedDocumentVersion || !samePredecessor(currentPredecessor, input.expectedPredecessor)) {
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    }
    const decision = decideRevisionCreation(versions);
    if (!decision.allowed) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    if (decision.predecessor) {
      authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-REVISE', action: 'REVISE', document, state: decision.predecessor.state });
    } else authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-CREATE', action: 'CREATE', document, state: 'CATALOG_ONLY' });
    const now = this.now();
    if (!input.fileIds.length) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { files: ['required'] } });
    }
    const base = createDraftDocumentVersion({ ...input, id: uuidv7(), createdBy: input.actor.id, now });
    const sourceFiles = input.fileIds.map((fileId) => ({ fileId, fileRole: 'SOURCE' }));
    return this.repository.createVersion({ version: { ...base, files: [] }, sourceFiles, expectedDocumentVersion: input.expectedDocumentVersion, expectedPredecessor: currentPredecessor, actor: input.actor, requestId: input.requestId });
  }
}

function samePredecessor(
  left: ReturnType<typeof expectedPredecessorOf>,
  right: ReturnType<typeof expectedPredecessorOf>,
): boolean {
  return left === null
    ? right === null
    : right !== null && left.id === right.id && left.state === right.state && left.version === right.version;
}
