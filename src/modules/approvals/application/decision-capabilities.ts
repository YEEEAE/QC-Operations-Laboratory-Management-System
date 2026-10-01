import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import {
  APPROVAL_DECISIONS,
  isApprovalWorkItemActionable,
  type ApprovalDecisionKind,
} from '../domain/approval.js';
import { authorizeApprovalDecision } from './authorization.js';
import type { ApprovalRecord } from '../ports/repository.js';
import type { SignaturePolicy, SubjectTransitionHandler } from './decide-approval.js';

export type ApprovalDecisionCapabilityState =
  'AVAILABLE' | 'POLICY_BLOCKED' | 'UNSUPPORTED' | 'NOT_AUTHORIZED' | 'STALE' | 'NOT_ACTIONABLE';

export interface ApprovalDecisionCapability {
  decision: ApprovalDecisionKind;
  state: ApprovalDecisionCapabilityState;
  signature: 'REQUIRED' | 'NOT_REQUIRED' | 'UNRESOLVED';
  meaning?: string;
}

export interface ApprovalCapabilityResolver {
  execute(input: {
    record: ApprovalRecord;
    actor: ActorContext;
  }): readonly ApprovalDecisionCapability[];
}

export class ResolveApprovalDecisionCapabilitiesUseCase implements ApprovalCapabilityResolver {
  constructor(
    private readonly options: {
      subjectTransitions: Readonly<Record<string, SubjectTransitionHandler>>;
      signaturePolicy: SignaturePolicy;
      signerAvailable: boolean;
    },
  ) {}

  execute(input: {
    record: ApprovalRecord;
    actor: ActorContext;
  }): readonly ApprovalDecisionCapability[] {
    return APPROVAL_DECISIONS.map((decision) => {
      if (!isApprovalWorkItemActionable(input.record.workItem))
        return { decision, state: 'NOT_ACTIONABLE', signature: 'UNRESOLVED' };
      if (input.record.approvalCase.subjectVersion !== input.record.subject.version)
        return { decision, state: 'STALE', signature: 'UNRESOLVED' };

      try {
        authorizeApprovalDecision(
          input.record,
          input.actor,
          decision,
          input.record.subject.version,
        );
      } catch (error) {
        return {
          decision,
          state:
            error instanceof AppError && error.code === 'CONFLICT_STALE_VERSION'
              ? 'STALE'
              : 'NOT_AUTHORIZED',
          signature: 'UNRESOLVED',
        };
      }

      const transition = this.options.subjectTransitions[input.record.subject.subjectType];
      if (!transition?.decisions.includes(decision))
        return { decision, state: 'UNSUPPORTED', signature: 'UNRESOLVED' };

      let requirement: ReturnType<SignaturePolicy['requirement']>;
      try {
        requirement = this.options.signaturePolicy.requirement({ record: input.record, decision });
      } catch {
        return { decision, state: 'POLICY_BLOCKED', signature: 'UNRESOLVED' };
      }
      if (
        requirement.status === 'UNRESOLVED' ||
        (requirement.status === 'REQUIRED' &&
          (!this.options.signerAvailable || !requirement.meaning?.trim()))
      )
        return {
          decision,
          state: 'POLICY_BLOCKED',
          signature: requirement.status,
          ...(requirement.meaning ? { meaning: requirement.meaning } : {}),
        };

      return {
        decision,
        state: 'AVAILABLE',
        signature: requirement.status,
        ...(requirement.meaning ? { meaning: requirement.meaning } : {}),
      };
    });
  }
}

export function approvalWithCapabilities(
  record: ApprovalRecord,
  capabilities: ApprovalCapabilityResolver,
  actor: ActorContext,
) {
  return { ...record, decisionCapabilities: capabilities.execute({ record, actor }) };
}
