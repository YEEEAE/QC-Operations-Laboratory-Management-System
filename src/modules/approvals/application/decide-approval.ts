import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isApprovalWorkItemActionable, type ApprovalDecisionKind } from '../domain/approval.js';
import { authorizeApprovalDecision, authorizeApprovalView } from './authorization.js';
import type { ApprovalRepository, ApprovalRecord } from '../ports/repository.js';
import type { SignatureEvidence } from '../../e-signatures/domain/signature-evidence.js';
import type { SignControlledActionUseCase } from '../../e-signatures/application/sign-controlled-action.js';

export type SignatureRequirement = 'REQUIRED' | 'NOT_REQUIRED' | 'UNRESOLVED';
export interface SignaturePolicy {
  requirement(input: { record: ApprovalRecord; decision: ApprovalDecisionKind }): {
    status: SignatureRequirement;
    meaning?: string;
  };
}
export interface SubjectTransitionResult {
  subjectId: string;
  version: bigint;
  state: string;
}
export interface SubjectTransition {
  execute(input: {
    actor: ActorContext;
    subjectId: string;
    expectedVersion: bigint;
    action: ApprovalDecisionKind;
    reason?: string;
    requestId: string;
  }): Promise<SubjectTransitionResult>;
}
export type SubjectTransitionHandler =
  | SubjectTransition
  | ((input: Parameters<SubjectTransition['execute']>[0]) => Promise<SubjectTransitionResult>);

const unresolvedSignaturePolicy: SignaturePolicy = {
  requirement: () => ({ status: 'UNRESOLVED' }),
};

export class DecideApprovalUseCase {
  private readonly transitions: Readonly<Record<string, SubjectTransitionHandler>>;
  private readonly signaturePolicy: SignaturePolicy;
  private readonly signer?: Pick<SignControlledActionUseCase, 'execute'>;
  private readonly now: () => Date;

  constructor(
    private readonly repository: ApprovalRepository,
    options: {
      subjectTransitions: Readonly<Record<string, SubjectTransitionHandler>>;
      signaturePolicy?: SignaturePolicy;
      signer?: Pick<SignControlledActionUseCase, 'execute'>;
      now?: () => Date;
    },
  ) {
    this.transitions = options.subjectTransitions;
    this.signaturePolicy = options.signaturePolicy ?? unresolvedSignaturePolicy;
    this.signer = options.signer;
    this.now = options.now ?? (() => new Date());
  }

  async execute(input: {
    actor: ActorContext;
    approvalId: string;
    workItemId: string;
    decision: ApprovalDecisionKind;
    subjectVersion: bigint;
    reason?: string;
    comments?: string;
    reauthenticationSecret?: string;
    requestId: string;
  }) {
    const record = await this.repository.get({ approvalId: input.approvalId, actor: input.actor });
    if (!record || record.workItem.id !== input.workItemId)
      throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    // Replays remain subject to current assignment authorization; the prior result is not a read bypass.
    const replay = await this.repository.findDecisionByRequestId({
      approvalCaseId: record.approvalCase.id,
      workItemId: record.workItem.id,
      requestId: input.requestId,
    });
    if (replay) {
      if (replay.actorId !== input.actor.id)
        throw new AppError('AUTHZ_SCOPE_DENIED', { userSafe: true });
      authorizeApprovalView(
        isApprovalWorkItemActionable(record.workItem)
          ? record
          : { ...record, workItem: { ...record.workItem, state: 'IN_PROGRESS' } },
        input.actor,
      );
      return { decision: replay };
    }
    authorizeApprovalView(record, input.actor);
    if (!isApprovalWorkItemActionable(record.workItem))
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    authorizeApprovalDecision(record, input.actor, input.decision, input.subjectVersion);
    const signatureRequirement = this.signaturePolicy.requirement({
      record,
      decision: input.decision,
    });
    if (signatureRequirement.status === 'UNRESOLVED')
      throw new AppError('DOMAIN_SIGNATURE_REQUIRED', { userSafe: true });
    let signature: SignatureEvidence | undefined;
    if (signatureRequirement.status === 'REQUIRED') {
      if (!this.signer || !signatureRequirement.meaning)
        throw new AppError('DOMAIN_SIGNATURE_REQUIRED', { userSafe: true });
      signature = await this.signer.execute({
        actor: input.actor,
        subjectType: record.subject.subjectType,
        subjectId: record.subject.subjectId,
        subjectVersion: input.subjectVersion,
        currentState: record.subject.state,
        action: input.decision,
        meaning: signatureRequirement.meaning,
        snapshotHash: record.subject.snapshotHash ?? '',
        reason: input.reason,
        reauthenticationSecret: input.reauthenticationSecret ?? '',
        requestId: input.requestId,
        persist: false,
      });
    }
    const transition = this.transitions[record.subject.subjectType];
    if (!transition) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const subject =
      typeof transition === 'function'
        ? await transition({
            actor: input.actor,
            subjectId: record.subject.subjectId,
            expectedVersion: input.subjectVersion,
            action: input.decision,
            reason: input.reason,
            requestId: input.requestId,
          })
        : await transition.execute({
            actor: input.actor,
            subjectId: record.subject.subjectId,
            expectedVersion: input.subjectVersion,
            action: input.decision,
            reason: input.reason,
            requestId: input.requestId,
          });
    if (subject.subjectId !== record.subject.subjectId || subject.version <= input.subjectVersion)
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    return this.repository.recordDecision({
      approvalCaseId: record.approvalCase.id,
      workItemId: record.workItem.id,
      actor: input.actor,
      decision: input.decision,
      subjectVersion: input.subjectVersion,
      reason: input.reason,
      comments: input.comments,
      signature,
      requestId: input.requestId,
      now: this.now(),
    });
  }
}
