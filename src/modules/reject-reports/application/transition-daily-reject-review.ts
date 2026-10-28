import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { assertFinalizable } from '../domain/daily-reject.js';
import { assertReason } from '../domain/reject-report.js';
import type { DailyRejectStatus } from '../domain/reject-report.js';
import type { RejectReportRepository } from '../ports/repository.js';

export type DailyRejectReviewAction = 'SUBMIT_FOR_QC' | 'QC_REVIEW' | 'QC_RETURN' | 'SUPERVISOR_APPROVE';
const permissions: Record<DailyRejectReviewAction, PermissionCode> = {
  SUBMIT_FOR_QC: 'PERM-RREJ-SUBMIT-QC', QC_REVIEW: 'PERM-RREJ-QC-REVIEW',
  QC_RETURN: 'PERM-RREJ-QC-REVIEW', SUPERVISOR_APPROVE: 'PERM-RREJ-SUPERVISOR-APPROVE',
};
const states: Record<DailyRejectReviewAction, DailyRejectStatus[]> = {
  SUBMIT_FOR_QC: ['DRAFT'], QC_REVIEW: ['SUBMITTED_FOR_QC'],
  QC_RETURN: ['SUBMITTED_FOR_QC'], SUPERVISOR_APPROVE: ['QC_REVIEWED'],
};
const transitionActions = {
  SUBMIT_FOR_QC: 'SUBMIT_FOR_QC', QC_REVIEW: 'QC_REVIEW', QC_RETURN: 'QC_RETURN',
  SUPERVISOR_APPROVE: 'SUPERVISOR_APPROVE',
} as const;

export class TransitionDailyRejectReviewUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  async execute(input: { actor: ActorContext; reportId: string; expectedVersion: bigint; idempotencyKey: string; action: DailyRejectReviewAction; reason?: string }) {
    if (!input.idempotencyKey.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const record = await this.repository.getDailyReject(input.reportId);
    if (!record) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (input.action === 'SUBMIT_FOR_QC' && input.actor.id !== record.createdBy)
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!states[input.action].includes(record.status)) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    if (input.action === 'SUBMIT_FOR_QC') assertFinalizable(record.entries);
    if (['QC_REVIEW', 'QC_RETURN', 'SUPERVISOR_APPROVE'].includes(input.action)) assertReason(input.reason);
    const latest = record.reviewEvents ?? [];
    const qcReviewer = [...latest].reverse().find((event) => event.action === 'QC_REVIEW')?.actorId;
    if (input.action !== 'SUBMIT_FOR_QC' && input.actor.id === record.createdBy)
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (input.action === 'SUPERVISOR_APPROVE' && (!qcReviewer || qcReviewer === input.actor.id))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorize({ actor: input.actor, permission: permissions[input.action], action: transitionActions[input.action],
      entity: { type: 'REJECT_REPORT', id: record.id, state: record.status, ownerId: record.createdBy,
        departmentId: record.department, shiftId: record.shift },
      scope: { ownerId: record.createdBy, departmentId: record.department, shiftId: record.shift },
      currentVersion: record.version, expectedVersion: input.expectedVersion,
      businessCondition: true }, { throwOnDeny: true });
    return this.repository.transitionDailyRejectReview({
      id: record.id, expectedVersion: input.expectedVersion, actor: input.actor,
      requestId: input.idempotencyKey, idempotencyKey: input.idempotencyKey,
      action: input.action, reason: input.reason?.trim(),
    });
  }
}
