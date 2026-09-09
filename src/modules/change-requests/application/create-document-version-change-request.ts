import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { createChangeRequest } from '../domain/change-request.js';
import type { ChangeRequestAggregate, ChangeRequestRepository } from '../ports/repository.js';
import type { ChangeTargetSource } from '../ports/change-target-source.js';
import {
  DOCUMENT_VERSION_CHANGE_DATA_TYPES,
  assertDocumentVersionChangeField,
  type DocumentVersionChangeField,
} from './document-version-change-fields.js';

/**
 * Contextual creation for DOCUMENT_VERSION targets (Prompt 2).
 *
 * The operator supplies only a selected version id (from the authorized
 * selector), the expected version token shown with that selection, one
 * allowlisted field, and the proposed value. Everything authoritative —
 * targetId, targetVersion, targetSnapshot, currentValue, dataType — is
 * resolved server-side from the current controlled version. Client-supplied
 * field paths, data types, versions, hashes, and snapshots are never trusted:
 * unknown fields are rejected and the expected version is verified both here
 * and inside the write transaction (`createForDocumentVersion` re-reads the
 * target row `FOR UPDATE`).
 */
export class CreateDocumentVersionChangeRequestUseCase {
  constructor(
    private readonly repository: ChangeRequestRepository,
    private readonly targets: ChangeTargetSource,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    changeNo: string;
    reason: string;
    documentVersionId: string;
    expectedDocumentVersion: bigint;
    changeField: string;
    proposedValue: string;
    requestId: string;
  }): Promise<ChangeRequestAggregate> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-CHG-CREATE',
        action: 'CREATE',
        entity: {
          type: 'CHANGE_REQUEST',
          id: 'new',
          state: 'DRAFT',
          ownerId: input.actor.id,
          authorId: input.actor.id,
        },
        scope: { ownerId: input.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    assertDocumentVersionChangeField(input.changeField);
    const field = input.changeField as DocumentVersionChangeField;
    const proposed = input.proposedValue.trim();
    if (!proposed) {
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { proposedValue: ['required'] },
      });
    }
    // Authorized server-side resolution (re-authorizes PERM-DOC-VIEW inside).
    const target = await this.targets.loadChangeTarget({
      id: input.documentVersionId,
      actor: input.actor,
    });
    if (target.version !== input.expectedDocumentVersion) {
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    }
    const currentValue =
      field === 'revision'
        ? target.revision
        : field === 'changeSummary'
          ? (target.changeSummary ?? '')
          : (target.contentHash ?? '');
    // Immutable snapshot of the exact controlled context used at creation.
    const targetSnapshot: Record<string, unknown> = {
      documentId: target.documentId,
      documentNo: target.documentNo,
      documentType: target.documentType,
      title: target.title,
      revision: target.revision,
      state: target.state,
      version: target.version.toString(),
      ...(target.changeSummary !== undefined ? { changeSummary: target.changeSummary } : {}),
      ...(target.contentHash !== undefined ? { contentHash: target.contentHash } : {}),
    };
    const timestamp = this.now();
    const request = createChangeRequest({
      id: uuidv7(),
      changeNo: input.changeNo,
      targetType: 'DOCUMENT_VERSION',
      targetId: target.id,
      targetVersion: target.version,
      reason: input.reason,
      targetSnapshot,
      requestedBy: input.actor.id,
      now: timestamp,
    });
    const aggregate: ChangeRequestAggregate = {
      changeRequest: request,
      changes: [
        {
          id: uuidv7(),
          fieldPath: field,
          currentValue,
          proposedValue: proposed,
          dataType: DOCUMENT_VERSION_CHANGE_DATA_TYPES[field],
          position: 1,
        },
      ],
      history: [],
      applicationAttempts: [],
    };
    return this.repository.createForDocumentVersion({
      aggregate,
      actor: input.actor,
      requestId: input.requestId,
      documentVersionId: target.id,
      expectedDocumentVersion: target.version,
    });
  }
}
