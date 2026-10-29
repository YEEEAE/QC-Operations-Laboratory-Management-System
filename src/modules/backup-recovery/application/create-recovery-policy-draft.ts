import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import {
  normalizeRecoveryPolicyDraft,
  type NormalizedRecoveryPolicyDraft,
  type RecoveryPolicyDraftInput,
  type RecoveryPolicyVersion,
} from '../domain/recovery-policy.js';
import type { RecoveryGovernanceRepository } from '../ports/recovery-governance.js';

/**
 * Drafts a recovery policy version by transcribing an approved source.
 *
 * The draft has no approval fields and is persisted as PENDING_APPROVAL. The
 * platform does not fill in, round or default any objective; an omitted value
 * stays null and blocks approval later.
 */
export class CreateRecoveryPolicyDraftUseCase {
  constructor(
    private readonly repository: RecoveryGovernanceRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    draft: RecoveryPolicyDraftInput;
    expectedLatestRevision: number | null;
    requestId: string;
  }): Promise<RecoveryPolicyVersion> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-BKP-POLICY-MANAGE',
        action: 'CREATE',
        entity: {
          type: 'RECOVERY_POLICY',
          id: 'draft',
          state: 'PENDING_APPROVAL',
          domain: 'BACKUP_RECOVERY',
        },
        scope: { domain: 'BACKUP_RECOVERY' },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );

    const normalized: NormalizedRecoveryPolicyDraft = normalizeRecoveryPolicyDraft(input.draft);
    const latest = await this.repository.latestPolicyVersion();
    const currentRevision = latest?.revision ?? 0;
    if (input.expectedLatestRevision !== null && input.expectedLatestRevision !== currentRevision)
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    const approved = await this.repository.latestApprovedPolicyVersion();
    return this.repository.createPolicyDraft({
      draft: normalized,
      revision: currentRevision + 1,
      ...(approved ? { supersedesId: approved.id } : {}),
      actor: input.actor,
      requestId: input.requestId,
      now: this.now(),
    });
  }
}
