import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { PostgresDocumentRepository } from '../infrastructure/postgres-repository.js';
import { ApproveVersionUseCase } from './approve-version.js';
import { CreateDocumentUseCase } from './create-document.js';
import { CreateVersionUseCase } from './create-version.js';
import { GetDocumentUseCase } from './get-document.js';
import { ListDocumentsUseCase } from './list-documents.js';
import { ReviewVersionUseCase } from './review-version.js';
import { SubmitVersionUseCase } from './submit-version.js';
import { SupersedeVersionUseCase } from './supersede-version.js';
import { UpdateVersionDraftUseCase } from './update-version-draft.js';

export function documentsReadDependencies() {
  const repository = new PostgresDocumentRepository(getDatabase());
  return { get: new GetDocumentUseCase(repository), list: new ListDocumentsUseCase(repository) };
}

export function documentsActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresDocumentRepository(database, new PostgresAuditRepository(database), new PostgresOutboxRepository(database));
  return {
    create: new CreateDocumentUseCase(repository),
    createVersion: new CreateVersionUseCase(repository),
    updateDraft: new UpdateVersionDraftUseCase(repository),
    submit: new SubmitVersionUseCase(repository),
    review: new ReviewVersionUseCase(repository),
    approve: new ApproveVersionUseCase(repository),
    supersede: new SupersedeVersionUseCase(repository),
  };
}
