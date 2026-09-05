import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentIdentity } from '../domain/document.js';
import type { DocumentVersion } from '../domain/document-version.js';

export function ownerOf(document: DocumentIdentity): string {
  return document.ownerId ?? document.createdBy;
}

export function authorizeDocument(input: {
  actor: ActorContext;
  permission: Parameters<typeof authorize>[0]['permission'];
  action: string;
  document: DocumentIdentity;
  state: string;
  version?: DocumentVersion;
  expectedVersion?: bigint;
}): void {
  const version = input.version;
  authorize({
    actor: input.actor,
    permission: input.permission,
    action: input.action,
    entity: {
      type: version ? 'DOCUMENT_VERSION' : 'DOCUMENT_IDENTITY',
      id: version?.id ?? input.document.id,
      state: input.state,
      ownerId: ownerOf(input.document),
      authorId: version?.createdBy,
    },
    scope: { ownerId: ownerOf(input.document) },
    currentVersion: version?.version ?? input.document.version,
    expectedVersion: input.expectedVersion ?? version?.version ?? input.document.version,
    sod: version ? { actorId: input.actor.id, authorId: version.createdBy } : undefined,
    businessCondition: input.document.active,
  }, { throwOnDeny: true });
}

export function requireDocument(repositoryResult: DocumentIdentity | undefined): DocumentIdentity {
  if (!repositoryResult) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
  return repositoryResult;
}
